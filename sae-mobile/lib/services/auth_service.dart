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
    final res = await _api.post('/auth/users/login', data: {
      'username': username,
      'password': password,
    });
    final data = res.data as Map<String, dynamic>;
    final token = data['token'] as String;
    final user = AuthUser.fromJson(data);
    final prefs = await SharedPreferences.getInstance();
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
}
