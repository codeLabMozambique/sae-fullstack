import 'api_client.dart';

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
        title: j['title'] ?? '',
        description: j['description'],
        discipline: j['discipline'],
        level: j['level'],
        year: j['year'] == null ? null : (j['year'] as num).toInt(),
        fileUrl: j['fileUrl'],
        thumbnailUrl: j['thumbnailUrl'],
        totalPages: j['totalPages'] == null ? null : (j['totalPages'] as num).toInt(),
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

  String readUrl(String contentId) =>
      '${ApiClient.instance.baseUrl}/content/api/contents/$contentId/read';

  String? absoluteUrl(String? path) {
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http')) return path;
    return '${ApiClient.instance.baseUrl}/content$path';
  }
}
