import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/api_client.dart';
import '../../services/content_service.dart';
import '../../services/offline_service.dart';
import '../../state/auth_state.dart';
import '../../theme.dart';

class LeitorPage extends StatefulWidget {
  final Content content;
  /// Página onde deve abrir (1-based). Usado por sugestões de leitura
  /// para abrir directamente na página recomendada pelo professor.
  final int? initialPage;
  const LeitorPage({super.key, required this.content, this.initialPage});

  @override
  State<LeitorPage> createState() => _LeitorPageState();
}

class _LeitorPageState extends State<LeitorPage> {
  String? _path;
  String? _error;
  int _currentPage = 0;
  int _totalPages = 0;
  final DateTime _opened = DateTime.now();
  final _service = ContentService();
  final _offline = OfflineService.instance;
  bool _downloadingPersistent = false;
  double _progress = 0;

  @override
  void initState() {
    super.initState();
    _openOrDownload();
  }

  Future<void> _openOrDownload() async {
    try {
      await _offline.ensureInit();
      // 1) Já temos cópia persistente?
      final persistent = _offline.localFileFor(widget.content.id);
      if (persistent != null) {
        setState(() => _path = persistent.path);
        return;
      }
      // 2) Cache temporária (sessão actual)
      final dir = await getTemporaryDirectory();
      final tmp = File('${dir.path}/sae_${widget.content.id}.pdf');
      if (tmp.existsSync()) {
        setState(() => _path = tmp.path);
        return;
      }
      // 3) Descarregar para tmp
      final url = _service.readUrl(widget.content.id);
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(ApiClient.tokenKey);
      final dio = Dio();
      await dio.download(
        url, tmp.path,
        options: Options(headers: token == null ? null : {'Authorization': 'Bearer $token'}),
      );
      if (mounted) setState(() => _path = tmp.path);
    } catch (e) {
      if (mounted) setState(() => _error = 'Não foi possível abrir o conteúdo.');
    }
  }

  Future<void> _downloadPersistent() async {
    setState(() {
      _downloadingPersistent = true;
      _progress = 0;
    });
    try {
      final url = _service.readUrl(widget.content.id);
      await _offline.downloadBook(
        contentId: widget.content.id,
        title: widget.content.title,
        readUrl: url,
        discipline: widget.content.discipline,
        thumbnailUrl: widget.content.thumbnailUrl,
        onProgress: (p) => mounted ? setState(() => _progress = p) : null,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Disponível offline.')));
        setState(() {});
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Falha ao descarregar.')));
      }
    } finally {
      if (mounted) setState(() => _downloadingPersistent = false);
    }
  }

  Future<void> _saveProgressAndExit() async {
    final auth = context.read<AuthState>();
    if (!auth.isGuestRole && _currentPage > 0) {
      final duration = DateTime.now().difference(_opened).inSeconds;
      try {
        await _service.upsertProgress(
          widget.content.id, _currentPage + 1,
          readingTimeSecondsDelta: duration,
        );
        await _service.recordHistory(widget.content.id, _currentPage + 1, duration);
      } catch (_) {}
    }
  }

  @override
  Widget build(BuildContext context) {
    final downloaded = _offline.isDownloaded(widget.content.id);
    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) await _saveProgressAndExit();
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.content.title, maxLines: 1, overflow: TextOverflow.ellipsis),
          actions: [
            IconButton(
              tooltip: downloaded ? 'Remover offline' : 'Disponibilizar offline',
              icon: _downloadingPersistent
                  ? SizedBox(
                      width: 22, height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        value: _progress > 0 ? _progress : null,
                        color: SaeColors.primary,
                      ),
                    )
                  : Icon(downloaded ? Icons.offline_pin : Icons.download_for_offline_outlined,
                      color: downloaded ? SaeColors.primary : SaeColors.textPrimary),
              onPressed: _downloadingPersistent
                  ? null
                  : () async {
                      if (downloaded) {
                        await _offline.removeBook(widget.content.id);
                        if (mounted) setState(() {});
                      } else {
                        await _downloadPersistent();
                      }
                    },
            ),
            if (_totalPages > 0)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Center(
                  child: Text(
                    '${_currentPage + 1} / $_totalPages',
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, color: SaeColors.textPrimary),
                  ),
                ),
              ),
          ],
        ),
        body: _error != null
            ? Center(child: Text(_error!))
            : _path == null
                ? const Center(child: CircularProgressIndicator())
                : PDFView(
                    filePath: _path!,
                    enableSwipe: true,
                    swipeHorizontal: false,
                    autoSpacing: true,
                    pageSnap: true,
                    // PDFView usa página 0-based; sugestão chega 1-based
                    defaultPage: widget.initialPage == null
                        ? 0
                        : (widget.initialPage! - 1).clamp(0, 1 << 30),
                    onRender: (pages) => setState(() => _totalPages = pages ?? 0),
                    onPageChanged: (page, _) => setState(() => _currentPage = page ?? 0),
                  ),
      ),
    );
  }
}
