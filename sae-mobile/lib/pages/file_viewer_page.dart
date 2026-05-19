import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_pdfview/flutter_pdfview.dart';
import 'package:path_provider/path_provider.dart';
import 'package:photo_view/photo_view.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_client.dart';
import '../theme.dart';

/// Abre PDF, imagens e outros ficheiros directamente dentro da app
/// (sem navegador externo). Para tipos não suportados mostra fallback.
class FileViewerPage extends StatefulWidget {
  final String url;
  final String title;
  final String? hintExtension; // ex: 'pdf', 'jpg', 'docx'
  const FileViewerPage({
    super.key,
    required this.url,
    required this.title,
    this.hintExtension,
  });

  @override
  State<FileViewerPage> createState() => _FileViewerPageState();
}

class _FileViewerPageState extends State<FileViewerPage> {
  String? _path;
  String? _error;
  String _ext = '';
  int _currentPage = 0;
  int _totalPages = 0;

  @override
  void initState() {
    super.initState();
    _download();
  }

  String _inferExt(String url) {
    final lower = url.toLowerCase();
    final qIdx = lower.indexOf('?');
    final clean = qIdx < 0 ? lower : lower.substring(0, qIdx);
    final dot = clean.lastIndexOf('.');
    if (dot >= 0 && dot < clean.length - 1) return clean.substring(dot + 1);
    return widget.hintExtension?.toLowerCase() ?? '';
  }

  Future<void> _download() async {
    try {
      _ext = (widget.hintExtension?.toLowerCase() ?? '').isEmpty
          ? _inferExt(widget.url)
          : widget.hintExtension!.toLowerCase();
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(ApiClient.tokenKey);
      final dir = await getTemporaryDirectory();
      final safeName = widget.url.hashCode.toString();
      final fileName = _ext.isEmpty ? safeName : '$safeName.$_ext';
      final file = File('${dir.path}/sae_$fileName');
      if (!file.existsSync() || file.lengthSync() == 0) {
        final dio = Dio();
        await dio.download(
          widget.url, file.path,
          options: Options(
              headers: token == null ? null : {'Authorization': 'Bearer $token'}),
        );
      }
      if (!mounted) return;
      setState(() => _path = file.path);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'Não foi possível abrir o ficheiro.');
    }
  }

  bool get _isPdf => _ext == 'pdf';
  bool get _isImage =>
      const ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].contains(_ext);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _isImage ? Colors.black : SaeColors.bg,
      appBar: AppBar(
        backgroundColor: _isImage ? Colors.black : SaeColors.bg,
        foregroundColor: _isImage ? Colors.white : SaeColors.textPrimary,
        title: Text(widget.title, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          if (_isPdf && _totalPages > 0)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Center(
                child: Text('${_currentPage + 1} / $_totalPages',
                    style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
        ],
      ),
      body: _error != null
          ? Center(
              child: Text(_error!,
                  style: TextStyle(
                      color: _isImage ? Colors.white : SaeColors.error)),
            )
          : _path == null
              ? const Center(child: CircularProgressIndicator())
              : _isPdf
                  ? PDFView(
                      filePath: _path!,
                      enableSwipe: true,
                      swipeHorizontal: false,
                      autoSpacing: true,
                      pageSnap: true,
                      onRender: (p) => setState(() => _totalPages = p ?? 0),
                      onPageChanged: (p, _) => setState(() => _currentPage = p ?? 0),
                    )
                  : _isImage
                      ? PhotoView(
                          imageProvider: FileImage(File(_path!)),
                          backgroundDecoration:
                              const BoxDecoration(color: Colors.black),
                          minScale: PhotoViewComputedScale.contained,
                          maxScale: PhotoViewComputedScale.covered * 3,
                        )
                      : _Unsupported(path: _path!, ext: _ext),
    );
  }
}

class _Unsupported extends StatelessWidget {
  final String path;
  final String ext;
  const _Unsupported({required this.path, required this.ext});
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.insert_drive_file,
                size: 64, color: SaeColors.textSecondary),
            const SizedBox(height: 14),
            Text(
              ext.isEmpty
                  ? 'Tipo de ficheiro não suportado para visualização.'
                  : 'Ficheiro .$ext não tem visualizador interno.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            const Text(
              'O ficheiro foi descarregado e ficou guardado em cache.',
              textAlign: TextAlign.center,
              style: TextStyle(color: SaeColors.textSecondary, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
