import 'api_client.dart';

class ReadingSuggestion {
  final int id;
  final String contentId;
  final String contentTitle;
  final String? contentThumbnailUrl;
  final int classroomId;
  final String professorUsername;
  final String? professorName;
  final String? note;
  final int? startPage;
  final int? endPage;
  final String? chapterRange;
  final String createdAt;

  ReadingSuggestion({
    required this.id,
    required this.contentId,
    required this.contentTitle,
    required this.classroomId,
    required this.professorUsername,
    required this.createdAt,
    this.contentThumbnailUrl,
    this.professorName,
    this.note,
    this.startPage,
    this.endPage,
    this.chapterRange,
  });

  factory ReadingSuggestion.fromJson(Map<String, dynamic> j) => ReadingSuggestion(
        id: (j['id'] as num).toInt(),
        contentId: j['contentId'].toString(),
        contentTitle: j['contentTitle'] ?? '',
        contentThumbnailUrl: j['contentThumbnailUrl'],
        classroomId: (j['classroomId'] as num).toInt(),
        professorUsername: j['professorUsername'] ?? '',
        professorName: j['professorName'],
        note: j['note'],
        startPage: j['startPage'] == null ? null : (j['startPage'] as num).toInt(),
        endPage: j['endPage'] == null ? null : (j['endPage'] as num).toInt(),
        chapterRange: j['chapterRange'],
        createdAt: j['createdAt']?.toString() ?? '',
      );
}

class SuggestionService {
  final _api = ApiClient.instance.dio;

  // Professor
  Future<List<ReadingSuggestion>> listMine() async {
    final res = await _api.get('/content/api/professor/suggestions');
    return (res.data as List)
        .cast<Map<String, dynamic>>()
        .map(ReadingSuggestion.fromJson)
        .toList();
  }

  Future<List<ReadingSuggestion>> create({
    required String contentId,
    required List<int> classroomIds,
    String? note,
    int? startPage,
    int? endPage,
    String? chapterRange,
  }) async {
    final res = await _api.post('/content/api/professor/suggestions', data: {
      'contentId': contentId,
      'classroomIds': classroomIds,
      if (note != null) 'note': note,
      if (startPage != null) 'startPage': startPage,
      if (endPage != null) 'endPage': endPage,
      if (chapterRange != null) 'chapterRange': chapterRange,
    });
    return (res.data as List)
        .cast<Map<String, dynamic>>()
        .map(ReadingSuggestion.fromJson)
        .toList();
  }

  Future<void> delete(int id) => _api.delete('/content/api/professor/suggestions/$id');

  // Student
  Future<List<ReadingSuggestion>> listForStudent(List<int> classroomIds) async {
    final res = await _api.get('/content/api/student/suggestions',
        queryParameters: {'classroomIds': classroomIds.join(',')});
    return (res.data as List)
        .cast<Map<String, dynamic>>()
        .map(ReadingSuggestion.fromJson)
        .toList();
  }
}
