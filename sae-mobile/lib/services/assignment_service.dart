import 'package:dio/dio.dart';
import 'api_client.dart';

class Submission {
  final int id;
  final int assignmentId;
  final String studentUsername;
  final String? studentName;
  final String? comment;
  final String? fileOriginalName;
  final String submittedAt;
  final double? grade;
  final String? gradedAt;
  final String state;

  Submission({
    required this.id,
    required this.assignmentId,
    required this.studentUsername,
    required this.submittedAt,
    required this.state,
    this.studentName,
    this.comment,
    this.fileOriginalName,
    this.grade,
    this.gradedAt,
  });

  factory Submission.fromJson(Map<String, dynamic> j) => Submission(
        id: (j['id'] as num).toInt(),
        assignmentId: (j['assignmentId'] as num).toInt(),
        studentUsername: j['studentUsername'] ?? '',
        studentName: j['studentName'],
        comment: j['comment'],
        fileOriginalName: j['fileOriginalName'],
        submittedAt: j['submittedAt'] ?? '',
        grade: j['grade'] == null ? null : (j['grade'] as num).toDouble(),
        gradedAt: j['gradedAt'],
        state: j['state'] ?? 'pendente',
      );
}

class Assignment {
  final int id;
  final int classroomId;
  final String title;
  final String? description;
  final String deadline;
  final double maxScore;
  final String? fileOriginalName;
  final String? createdByName;
  final Submission? mySubmission;

  Assignment({
    required this.id,
    required this.classroomId,
    required this.title,
    required this.deadline,
    required this.maxScore,
    this.description,
    this.fileOriginalName,
    this.createdByName,
    this.mySubmission,
  });

  factory Assignment.fromJson(Map<String, dynamic> j) => Assignment(
        id: (j['id'] as num).toInt(),
        classroomId: (j['classroomId'] as num).toInt(),
        title: j['title'] ?? '',
        description: j['description'],
        deadline: j['deadline'] ?? '',
        maxScore: (j['maxScore'] as num).toDouble(),
        fileOriginalName: j['fileOriginalName'],
        createdByName: j['createdByName'],
        mySubmission: j['mySubmission'] == null
            ? null
            : Submission.fromJson(Map<String, dynamic>.from(j['mySubmission'])),
      );
}

class AssignmentService {
  final _api = ApiClient.instance.dio;

  // Professor
  Future<List<Assignment>> listProfessor({int? classroomId}) async {
    final res = await _api.get('/content/api/professor/assignments',
        queryParameters: classroomId == null ? {} : {'classroomId': classroomId});
    return (res.data as List).cast<Map<String, dynamic>>().map(Assignment.fromJson).toList();
  }

  Future<Assignment> getProfessor(int id) async {
    final res = await _api.get('/content/api/professor/assignments/$id');
    return Assignment.fromJson(res.data as Map<String, dynamic>);
  }

  Future<List<Submission>> listSubmissions(int assignmentId) async {
    final res = await _api.get('/content/api/professor/assignments/$assignmentId/submissions');
    return (res.data as List).cast<Map<String, dynamic>>().map(Submission.fromJson).toList();
  }

  Future<Submission> grade(int submissionId, double grade) async {
    final res = await _api.patch(
      '/content/api/professor/assignments/submissions/$submissionId/grade',
      data: {'grade': grade},
    );
    return Submission.fromJson(res.data as Map<String, dynamic>);
  }

  // Student
  Future<List<Assignment>> listStudent(List<int> classroomIds) async {
    final res = await _api.get('/content/api/student/assignments',
        queryParameters: {'classroomIds': classroomIds.join(',')});
    return (res.data as List).cast<Map<String, dynamic>>().map(Assignment.fromJson).toList();
  }

  Future<List<Submission>> mySubmissions() async {
    final res = await _api.get('/content/api/student/assignments/submissions/mine');
    return (res.data as List).cast<Map<String, dynamic>>().map(Submission.fromJson).toList();
  }

  Future<Submission> submit({
    required int assignmentId,
    required List<int> classroomIds,
    String? comment,
    String? filePath,
    String? fileName,
  }) async {
    final fd = FormData();
    if (comment != null && comment.isNotEmpty) {
      fd.fields.add(MapEntry('comment', comment));
    }
    if (filePath != null) {
      fd.files.add(MapEntry('file', await MultipartFile.fromFile(filePath, filename: fileName)));
    }
    final res = await _api.post(
      '/content/api/student/assignments/$assignmentId/submit',
      data: fd,
      queryParameters: {'classroomIds': classroomIds.join(',')},
    );
    return Submission.fromJson(res.data as Map<String, dynamic>);
  }

  String assignmentFileUrl(int assignmentId) =>
      '${ApiClient.instance.baseUrl}/content/api/assignments/$assignmentId/file';

  String submissionFileUrl(int submissionId) =>
      '${ApiClient.instance.baseUrl}/content/api/assignments/submissions/$submissionId/file';
}
