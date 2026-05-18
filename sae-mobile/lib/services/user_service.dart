import 'api_client.dart';

class StudentProfile {
  final int userId;
  final String username;
  final String? fullName;
  final int? classroomId;
  final String? classroomName;

  StudentProfile({
    required this.userId,
    required this.username,
    this.fullName,
    this.classroomId,
    this.classroomName,
  });

  factory StudentProfile.fromJson(Map<String, dynamic> j) => StudentProfile(
        userId: (j['userId'] as num?)?.toInt() ?? (j['id'] as num?)?.toInt() ?? 0,
        username: j['username'] ?? '',
        fullName: j['fullName'],
        classroomId: j['classroomId'] == null ? null : (j['classroomId'] as num).toInt(),
        classroomName: j['classroomName'],
      );
}

class UserService {
  final _api = ApiClient.instance.dio;

  Future<StudentProfile?> getStudentProfile(String username) async {
    try {
      final res = await _api.get(
        '/auth/users/student-profile-by-username',
        queryParameters: {'username': username},
      );
      if (res.data == null) return null;
      return StudentProfile.fromJson(res.data as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  /// Turmas do aluno autenticado (normalmente uma só).
  Future<List<int>> myStudentClassroomIds(String username) async {
    final p = await getStudentProfile(username);
    if (p?.classroomId != null) return [p!.classroomId!];
    return const [];
  }
}
