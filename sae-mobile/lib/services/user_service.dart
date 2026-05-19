import 'api_client.dart';

class MyProfile {
  final int id;
  final String username;
  final String fullName;
  final String? email;
  final String role;
  MyProfile({
    required this.id,
    required this.username,
    required this.fullName,
    required this.role,
    this.email,
  });
  factory MyProfile.fromJson(Map<String, dynamic> j) => MyProfile(
        id: (j['id'] as num).toInt(),
        username: j['username'] ?? '',
        fullName: j['fullName'] ?? '',
        email: j['email'],
        role: j['role'] ?? '',
      );
}

class ProfessorClassroom {
  final int id;
  final String name;
  final String? shift;
  final String? academicYear;
  final String? classLevelName;
  final String? subjectName;
  ProfessorClassroom({
    required this.id,
    required this.name,
    this.shift,
    this.academicYear,
    this.classLevelName,
    this.subjectName,
  });
}

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

  Future<MyProfile?> me() async {
    try {
      final res = await _api.get('/auth/users/me');
      return MyProfile.fromJson(res.data as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  /// Turmas onde o professor está atribuído (uma chamada `/professors` para
  /// mapear username→id, depois `/professor-assignment/professor/{id}`).
  /// Cada turma pode aparecer mais que uma vez (uma por disciplina) — agregamos.
  Future<List<ProfessorClassroom>> professorClassrooms(String username) async {
    try {
      final all = await _api.get('/auth/users/professors');
      final list = (all.data as List).cast<Map<String, dynamic>>();
      final me = list.firstWhere(
        (p) => (p['username']?.toString() ?? '') == username,
        orElse: () => <String, dynamic>{},
      );
      if (me.isEmpty || me['id'] == null) return const [];
      final id = (me['id'] as num).toInt();
      final res = await _api.get('/academic/professor-assignment/professor/$id');
      final raw = (res.data as List).cast<Map<String, dynamic>>();
      final map = <int, ProfessorClassroom>{};
      for (final r in raw) {
        final cid = (r['classroomId'] as num).toInt();
        final existing = map[cid];
        final subj = r['subjectName']?.toString();
        if (existing == null) {
          map[cid] = ProfessorClassroom(
            id: cid,
            name: r['classroomName'] ?? 'Turma $cid',
            shift: r['classroomShift'],
            academicYear: r['classroomAcademicYear'],
            classLevelName: r['classLevelName'],
            subjectName: subj,
          );
        } else if (subj != null && existing.subjectName != null && !existing.subjectName!.contains(subj)) {
          map[cid] = ProfessorClassroom(
            id: existing.id,
            name: existing.name,
            shift: existing.shift,
            academicYear: existing.academicYear,
            classLevelName: existing.classLevelName,
            subjectName: '${existing.subjectName}, $subj',
          );
        }
      }
      return map.values.toList();
    } catch (_) {
      return const [];
    }
  }
}
