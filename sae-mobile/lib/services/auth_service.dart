import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class AuthUser {
  final int userId;
  final String username;
  final String fullName;
  final String role;
  AuthUser({
    required this.userId,
    required this.username,
    required this.fullName,
    required this.role,
  });

  factory AuthUser.fromJson(Map<String, dynamic> j) => AuthUser(
        userId: (j['userId'] as num).toInt(),
        username: j['username'] ?? '',
        fullName: j['fullName'] ?? '',
        role: (j['role'] ?? '').toString(),
      );

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'username': username,
        'fullName': fullName,
        'role': role,
      };
}

class AuthService {
  final _api = ApiClient.instance.dio;

  Future<AuthUser> login(String username, String password) async {
    // Limpa token velho antes — o interceptor já é defensivo, mas garante
    // que após um login falhado não fica lixo a contaminar o próximo.
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ApiClient.tokenKey);

    final res = await _api.post('/auth/users/login', data: {
      'username': username,
      'password': password,
    });
    final data = res.data as Map<String, dynamic>;
    final token = data['token'] as String;
    final user = AuthUser.fromJson(data);
    await prefs.setString(ApiClient.tokenKey, token);
    await prefs.setString(ApiClient.userKey, jsonEncode(user.toJson()));
    return user;
  }

  Future<AuthUser?> currentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(ApiClient.userKey);
    if (raw == null) return null;
    return AuthUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ApiClient.tokenKey);
    await prefs.remove(ApiClient.userKey);
  }

  /// Pede recuperação de senha. O backend envia SMS/email com link.
  Future<void> forgotPassword(String identifier) async {
    await _api.post('/auth/users/forgot-password', data: {
      'identifier': identifier.trim(),
    });
  }

  /// Lista pública de escolas (para o signup) — `/academic/school/all`.
  Future<List<SchoolOption>> listSchools() async {
    final res = await _api.get('/academic/school/all');
    final list = (res.data as List).cast<Map<String, dynamic>>();
    return list.map(SchoolOption.fromJson).toList();
  }

  /// Self-signup de estudante.
  Future<void> signupStudent({
    required String fullname,
    required String nTelefone,
    required String email,
    required String password,
    required int schoolId,
    String? grade,
    int? age,
  }) async {
    await _api.post('/auth/users/signup/student', data: {
      'fullname': fullname,
      'nTelefone': nTelefone,
      'email': email,
      'password': password,
      'schoolId': schoolId,
      'classroomId': null,
      if (grade != null && grade.isNotEmpty) 'grade': grade,
      if (age != null) 'age': age,
    });
  }
}

class SchoolOption {
  final int id;
  final String name;
  final String? city;
  SchoolOption({required this.id, required this.name, this.city});
  factory SchoolOption.fromJson(Map<String, dynamic> j) => SchoolOption(
        id: (j['id'] as num).toInt(),
        name: (j['name'] ?? '').toString(),
        city: j['city']?.toString(),
      );
  String get label => city == null || city!.isEmpty ? name : '$name · $city';
}
