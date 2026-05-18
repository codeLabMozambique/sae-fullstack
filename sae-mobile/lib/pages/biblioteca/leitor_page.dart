import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../services/api_client.dart';
import '../../services/content_service.dart';
import '../../theme.dart';

class LeitorPage extends StatefulWidget {
  final Content content;
  const LeitorPage({super.key, required this.content});

  @override
  State<LeitorPage> createState() => _LeitorPageState();
}

class _LeitorPageState extends State<LeitorPage> {
  String? _path;
  String? _error;
  int _currentPage = 0;
  int _totalPages = 0;

  @override
  void initState() {
    super.initState();
    _download();
  }

  Future<void> _download() async {
    try {
      final url = ContentService().readUrl(widget.content.id);
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(ApiClient.tokenKey);
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/sae_${widget.content.id}.pdf');
      if (!file.existsSync()) {
        final dio = Dio();
        await dio.download(
          url, file.path,
          options: Options(headers: token == null ? null : {'Authorization': 'Bearer $token'}),
        );
      }
      setState(() => _path = file.path);
    } catch (e) {
      setState(() => _error = 'Não foi possível abrir o conteúdo.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.content.title, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          if (_totalPages > 0)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Center(
                child: Text(
                  '${_currentPage + 1} / $_totalPages',
                  style: const TextStyle(fontWeight: FontWeight.w700, color: SaeColors.textPrimary),
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
                  onRender: (pages) => setState(() => _totalPages = pages ?? 0),
                  onPageChanged: (page, _) => setState(() => _currentPage = page ?? 0),
                ),
    );
  }
}
