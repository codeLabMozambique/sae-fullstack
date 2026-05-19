import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_client.dart';
import 'connectivity_service.dart';

/// Livro descarregado para uso offline.
class OfflineBook {
  final String contentId;
  final String title;
  final String? discipline;
  final String? thumbnailUrl;
  final String filePath;
  final int sizeBytes;
  final DateTime downloadedAt;

  OfflineBook({
    required this.contentId,
    required this.title,
    required this.filePath,
    required this.sizeBytes,
    required this.downloadedAt,
    this.discipline,
    this.thumbnailUrl,
  });

  Map<String, dynamic> toJson() => {
        'contentId': contentId,
        'title': title,
        'discipline': discipline,
        'thumbnailUrl': thumbnailUrl,
        'filePath': filePath,
        'sizeBytes': sizeBytes,
        'downloadedAt': downloadedAt.toIso8601String(),
      };

  factory OfflineBook.fromJson(Map<String, dynamic> j) => OfflineBook(
        contentId: j['contentId'].toString(),
        title: j['title'] ?? '',
        discipline: j['discipline'],
        thumbnailUrl: j['thumbnailUrl'],
        filePath: j['filePath'],
        sizeBytes: (j['sizeBytes'] as num?)?.toInt() ?? 0,
        downloadedAt: DateTime.tryParse(j['downloadedAt'] ?? '') ?? DateTime.now(),
      );
}

/// Entrada da outbox: uma chamada à API guardada para enviar mais tarde.
class OutboxEntry {
  final String id;
  final String method; // 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  final String path;
  final Map<String, dynamic>? body;
  final Map<String, dynamic>? query;
  final DateTime createdAt;
  /// Chave de coalescência: entradas com a mesma key colapsam (última ganha).
  /// Útil para upsertProgress por contentId.
  final String? coalesceKey;

  OutboxEntry({
    required this.id,
    required this.method,
    required this.path,
    required this.createdAt,
    this.body,
    this.query,
    this.coalesceKey,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'method': method,
        'path': path,
        'body': body,
        'query': query,
        'createdAt': createdAt.toIso8601String(),
        'coalesceKey': coalesceKey,
      };

  factory OutboxEntry.fromJson(Map<String, dynamic> j) => OutboxEntry(
        id: j['id'],
        method: j['method'],
        path: j['path'],
        body: j['body'] == null ? null : Map<String, dynamic>.from(j['body']),
        query: j['query'] == null ? null : Map<String, dynamic>.from(j['query']),
        createdAt: DateTime.tryParse(j['createdAt'] ?? '') ?? DateTime.now(),
        coalesceKey: j['coalesceKey'],
      );
}

class OfflineService extends ChangeNotifier {
  OfflineService._();
  static final OfflineService instance = OfflineService._();

  static const _booksFile = 'offline_books.json';
  static const _outboxFile = 'outbox.json';
  static const _lastSyncKey = 'sae_last_sync_at';

  final Map<String, OfflineBook> _books = {};
  final List<OutboxEntry> _outbox = [];
  bool _initialized = false;
  bool _syncing = false;
  DateTime? _lastSyncAt;

  bool get isSyncing => _syncing;
  int get pendingOutbox => _outbox.length;
  int get downloadedCount => _books.length;
  DateTime? get lastSyncAt => _lastSyncAt;

  Future<void> ensureInit() async {
    if (_initialized) return;
    _initialized = true;
    await _loadAll();
    final prefs = await SharedPreferences.getInstance();
    final ts = prefs.getString(_lastSyncKey);
    if (ts != null) _lastSyncAt = DateTime.tryParse(ts);

    // Sincroniza quando ficar online
    ConnectivityService.instance.addListener(() {
      if (ConnectivityService.instance.isOnline) {
        sync();
      }
    });
  }

  // ── Persistência ─────────────────────────────────────────────
  Future<Directory> _docs() async => getApplicationDocumentsDirectory();
  Future<Directory> _booksDir() async {
    final d = Directory('${(await _docs()).path}/sae_offline');
    if (!d.existsSync()) await d.create(recursive: true);
    return d;
  }

  Future<File> _booksMetaFile() async =>
      File('${(await _docs()).path}/$_booksFile');
  Future<File> _outboxFileRef() async =>
      File('${(await _docs()).path}/$_outboxFile');

  Future<void> _loadAll() async {
    try {
      final f = await _booksMetaFile();
      if (f.existsSync()) {
        final raw = jsonDecode(await f.readAsString()) as List;
        for (final j in raw) {
          final b = OfflineBook.fromJson(Map<String, dynamic>.from(j));
          if (File(b.filePath).existsSync()) {
            _books[b.contentId] = b;
          }
        }
      }
    } catch (_) {}
    try {
      final f = await _outboxFileRef();
      if (f.existsSync()) {
        final raw = jsonDecode(await f.readAsString()) as List;
        _outbox.clear();
        _outbox.addAll(raw
            .cast<Map<String, dynamic>>()
            .map((j) => OutboxEntry.fromJson(j)));
      }
    } catch (_) {}
  }

  Future<void> _saveBooks() async {
    final f = await _booksMetaFile();
    await f.writeAsString(jsonEncode(_books.values.map((b) => b.toJson()).toList()));
  }

  Future<void> _saveOutbox() async {
    final f = await _outboxFileRef();
    await f.writeAsString(jsonEncode(_outbox.map((e) => e.toJson()).toList()));
  }

  // ── Livros offline ───────────────────────────────────────────
  List<OfflineBook> get books =>
      _books.values.toList()..sort((a, b) => b.downloadedAt.compareTo(a.downloadedAt));

  bool isDownloaded(String contentId) => _books.containsKey(contentId);

  File? localFileFor(String contentId) {
    final b = _books[contentId];
    if (b == null) return null;
    final f = File(b.filePath);
    return f.existsSync() ? f : null;
  }

  int totalBytes() => _books.values.fold(0, (s, b) => s + b.sizeBytes);

  Future<OfflineBook> downloadBook({
    required String contentId,
    required String title,
    required String readUrl,
    String? discipline,
    String? thumbnailUrl,
    void Function(double progress)? onProgress,
  }) async {
    await ensureInit();
    final dir = await _booksDir();
    final file = File('${dir.path}/sae_$contentId.pdf');
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(ApiClient.tokenKey);
    final dio = Dio();
    await dio.download(
      readUrl, file.path,
      options: Options(
          headers: token == null ? null : {'Authorization': 'Bearer $token'}),
      onReceiveProgress: (rec, total) {
        if (total > 0 && onProgress != null) onProgress(rec / total);
      },
    );
    final book = OfflineBook(
      contentId: contentId,
      title: title,
      discipline: discipline,
      thumbnailUrl: thumbnailUrl,
      filePath: file.path,
      sizeBytes: await file.length(),
      downloadedAt: DateTime.now(),
    );
    _books[contentId] = book;
    await _saveBooks();
    notifyListeners();
    return book;
  }

  Future<void> removeBook(String contentId) async {
    final b = _books.remove(contentId);
    if (b != null) {
      try {
        final f = File(b.filePath);
        if (f.existsSync()) await f.delete();
      } catch (_) {}
    }
    await _saveBooks();
    notifyListeners();
  }

  Future<void> clearAllBooks() async {
    for (final b in _books.values.toList()) {
      try {
        final f = File(b.filePath);
        if (f.existsSync()) await f.delete();
      } catch (_) {}
    }
    _books.clear();
    await _saveBooks();
    notifyListeners();
  }

  // ── Outbox ───────────────────────────────────────────────────
  Future<void> enqueue(OutboxEntry e) async {
    await ensureInit();
    if (e.coalesceKey != null) {
      _outbox.removeWhere((x) => x.coalesceKey == e.coalesceKey);
    }
    _outbox.add(e);
    await _saveOutbox();
    notifyListeners();
  }

  Future<void> sync({Dio? dio}) async {
    await ensureInit();
    if (_syncing) return;
    if (!ConnectivityService.instance.isOnline) return;
    if (_outbox.isEmpty) {
      _markSynced();
      return;
    }
    _syncing = true;
    notifyListeners();
    final client = dio ?? ApiClient.instance.dio;
    final stillPending = <OutboxEntry>[];
    for (final e in List<OutboxEntry>.from(_outbox)) {
      try {
        await client.request(
          e.path,
          data: e.body,
          queryParameters: e.query,
          options: Options(method: e.method),
        );
      } catch (err) {
        // mantém na fila se for erro de rede; descarta se for 4xx (já não recuperável)
        if (err is DioException && err.response != null) {
          final code = err.response!.statusCode ?? 0;
          if (code >= 400 && code < 500) continue; // descarta
        }
        stillPending.add(e);
      }
    }
    _outbox
      ..clear()
      ..addAll(stillPending);
    await _saveOutbox();
    _markSynced();
    _syncing = false;
    notifyListeners();
  }

  void _markSynced() {
    _lastSyncAt = DateTime.now();
    SharedPreferences.getInstance().then(
        (p) => p.setString(_lastSyncKey, _lastSyncAt!.toIso8601String()));
  }

  String _uid() =>
      '${DateTime.now().microsecondsSinceEpoch}-${_outbox.length}';

  /// Helper: tentar online; em falha de rede, enfileira.
  Future<bool> tryOrQueue({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    Map<String, dynamic>? query,
    String? coalesceKey,
  }) async {
    final isOnline = ConnectivityService.instance.isOnline;
    if (isOnline) {
      try {
        await ApiClient.instance.dio.request(
          path,
          data: body,
          queryParameters: query,
          options: Options(method: method),
        );
        return true;
      } catch (e) {
        // se for rede, enfileira; se 4xx propaga
        if (e is DioException && e.response != null) {
          final code = e.response!.statusCode ?? 0;
          if (code >= 400 && code < 500) rethrow;
        }
      }
    }
    await enqueue(OutboxEntry(
      id: _uid(),
      method: method,
      path: path,
      body: body,
      query: query,
      createdAt: DateTime.now(),
      coalesceKey: coalesceKey,
    ));
    return false; // ficou em fila
  }
}
