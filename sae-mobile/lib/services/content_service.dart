import 'package:dio/dio.dart';
import 'api_client.dart';
import 'offline_service.dart';

class Attachment {
  final String id;
  final String fileName;
  final String? originalName;
  final String? contentType;
  Attachment({required this.id, required this.fileName, this.originalName, this.contentType});
  factory Attachment.fromJson(Map<String, dynamic> j) => Attachment(
        id: j['id'].toString(),
        fileName: j['fileName'] ?? '',
        originalName: j['originalName'],
        contentType: j['contentType'],
      );
}

class Content {
  final String id;
  final String title;
  final String? description;
  final String? discipline;
  final String? level;
  final int? year;
  final String? fileUrl;
  final String? thumbnailUrl;
  final int? totalPages;

  Content({
    required this.id,
    required this.title,
    this.description,
    this.discipline,
    this.level,
    this.year,
    this.fileUrl,
    this.thumbnailUrl,
    this.totalPages,
  });

  factory Content.fromJson(Map<String, dynamic> j) => Content(
        id: j['id'].toString(),
        title: j['title'] ?? j['contentTitle'] ?? '',
        description: j['description'],
        discipline: j['discipline'],
        level: j['level'],
        year: j['year'] == null ? null : (j['year'] as num).toInt(),
        fileUrl: j['fileUrl'],
        thumbnailUrl: j['thumbnailUrl'],
        totalPages: j['totalPages'] == null ? null : (j['totalPages'] as num).toInt(),
      );
}

class Category {
  final String id;
  final String name;
  final String? description;
  final String? parentId;
  final List<Category> children;
  Category({
    required this.id,
    required this.name,
    this.description,
    this.parentId,
    this.children = const [],
  });
  factory Category.fromJson(Map<String, dynamic> j) => Category(
        id: j['id'].toString(),
        name: j['name'] ?? '',
        description: j['description'],
        parentId: j['parentId']?.toString(),
        children: (j['children'] as List?)
                ?.cast<Map<String, dynamic>>()
                .map(Category.fromJson)
                .toList() ??
            const [],
      );
}

class ReadingProgress {
  final String id;
  final String contentId;
  final String contentTitle;
  final String? thumbnailUrl;
  final int? currentPage;
  final int? totalPages;
  final double? percentageComplete;
  final String lastReadAt;
  ReadingProgress({
    required this.id,
    required this.contentId,
    required this.contentTitle,
    this.thumbnailUrl,
    this.currentPage,
    this.totalPages,
    this.percentageComplete,
    required this.lastReadAt,
  });
  factory ReadingProgress.fromJson(Map<String, dynamic> j) => ReadingProgress(
        id: j['id'].toString(),
        contentId: j['contentId'].toString(),
        contentTitle: j['contentTitle'] ?? '',
        thumbnailUrl: j['thumbnailUrl'],
        currentPage: j['currentPage'] == null ? null : (j['currentPage'] as num).toInt(),
        totalPages: j['totalPages'] == null ? null : (j['totalPages'] as num).toInt(),
        percentageComplete:
            j['percentageComplete'] == null ? null : (j['percentageComplete'] as num).toDouble(),
        lastReadAt: j['lastReadAt']?.toString() ?? '',
      );
}

class ReadingHistory {
  final String id;
  final String contentId;
  final String? contentTitle;
  final String? discipline;
  final int pagesRead;
  final int durationSeconds;
  final String readAt;
  ReadingHistory({
    required this.id,
    required this.contentId,
    this.contentTitle,
    this.discipline,
    required this.pagesRead,
    required this.durationSeconds,
    required this.readAt,
  });
  factory ReadingHistory.fromJson(Map<String, dynamic> j) => ReadingHistory(
        id: j['id'].toString(),
        contentId: j['contentId'].toString(),
        contentTitle: j['contentTitle'],
        discipline: j['discipline'],
        pagesRead: (j['pagesRead'] as num?)?.toInt() ?? 0,
        durationSeconds: (j['durationSeconds'] as num?)?.toInt() ?? 0,
        readAt: j['readAt']?.toString() ?? '',
      );
}

class ContentService {
  final _api = ApiClient.instance.dio;

  Future<List<Content>> listContents({String? discipline, String? level, int page = 0, int size = 30}) async {
    final res = await _api.get('/content/api/contents', queryParameters: {
      if (discipline != null && discipline.isNotEmpty) 'discipline': discipline,
      if (level != null && level.isNotEmpty) 'level': level,
      'page': page,
      'size': size,
    });
    final data = res.data as Map<String, dynamic>;
    final items = (data['content'] as List).cast<Map<String, dynamic>>();
    return items.map(Content.fromJson).toList();
  }

  Future<List<Content>> search(String q, {int page = 0, int size = 30}) async {
    final res = await _api.get('/content/api/contents/search', queryParameters: {
      'q': q, 'page': page, 'size': size,
    });
    final data = res.data as Map<String, dynamic>;
    final items = (data['content'] as List).cast<Map<String, dynamic>>();
    return items.map(Content.fromJson).toList();
  }

  Future<List<String>> listDisciplines() async {
    final res = await _api.get('/content/api/disciplines');
    return (res.data as List).map((e) => (e as Map)['name'].toString()).toList();
  }

  Future<List<Category>> listCategoriesTree() async {
    final res = await _api.get('/content/api/categories');
    return (res.data as List).cast<Map<String, dynamic>>().map(Category.fromJson).toList();
  }

  String readUrl(String contentId) =>
      '${ApiClient.instance.baseUrl}/content/api/contents/$contentId/read';

  String? absoluteUrl(String? path) {
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http')) return path;
    return '${ApiClient.instance.baseUrl}/content$path';
  }

  // Favoritos
  Future<List<Content>> listFavorites() async {
    final res = await _api.get('/content/api/user/favorites');
    return (res.data as List).cast<Map<String, dynamic>>().map(Content.fromJson).toList();
  }

  Future<void> addFavorite(String contentId) => OfflineService.instance.tryOrQueue(
        method: 'POST',
        path: '/content/api/user/favorites/$contentId',
        coalesceKey: 'fav:add:$contentId',
      );

  Future<void> removeFavorite(String contentId) => OfflineService.instance.tryOrQueue(
        method: 'DELETE',
        path: '/content/api/user/favorites/$contentId',
        coalesceKey: 'fav:del:$contentId',
      );

  // Progresso
  Future<List<ReadingProgress>> listProgress() async {
    final res = await _api.get(
      '/content/api/user/progress',
      queryParameters: {'sortBy': 'lastReadAt,desc'},
    );
    return (res.data as List).cast<Map<String, dynamic>>().map(ReadingProgress.fromJson).toList();
  }

  Future<void> upsertProgress(String contentId, int currentPage,
      {int readingTimeSecondsDelta = 0}) async {
    await OfflineService.instance.tryOrQueue(
      method: 'PUT',
      path: '/content/api/user/progress/$contentId',
      body: {
        'currentPage': currentPage,
        'readingTimeSecondsDelta': readingTimeSecondsDelta,
      },
      coalesceKey: 'progress:$contentId',
    );
  }

  // Histórico
  Future<List<ReadingHistory>> getHistory({String? discipline}) async {
    final res = await _api.get('/content/api/user/history', queryParameters: {
      if (discipline != null && discipline.isNotEmpty) 'discipline': discipline,
    });
    return (res.data as List).cast<Map<String, dynamic>>().map(ReadingHistory.fromJson).toList();
  }

  Future<void> deleteHistory(String id) => _api.delete('/content/api/user/history/$id');

  Future<void> recordHistory(String contentId, int pagesRead, int durationSeconds) =>
      OfflineService.instance.tryOrQueue(
        method: 'POST',
        path: '/content/api/user/history',
        body: {
          'contentId': contentId,
          'pagesRead': pagesRead,
          'durationSeconds': durationSeconds,
        },
      );

  // Anexos genéricos (usado pelo fórum)
  Future<Attachment> uploadAttachment(String filePath, {String? fileName, String? context, String? contextId}) async {
    final fd = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: fileName),
    });
    final res = await _api.post(
      '/content/api/user/uploads',
      data: fd,
      queryParameters: {
        if (context != null) 'context': context,
        if (contextId != null) 'contextId': contextId,
      },
    );
    return Attachment.fromJson(res.data as Map<String, dynamic>);
  }

  String attachmentUrl(String attachmentId) =>
      '${ApiClient.instance.baseUrl}/content/api/user/uploads/$attachmentId';
}
