import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class AuthState extends ChangeNotifier {
  AuthUser? user;
  bool loading = true;

  final _service = AuthService();

  Future<void> bootstrap() async {
    user = await _service.currentUser();
    loading = false;
    notifyListeners();
  }

  Future<void> login(String username, String password) async {
    user = await _service.login(username, password);
    notifyListeners();
  }

  Future<void> logout() async {
    await _service.logout();
    user = null;
    notifyListeners();
  }

  bool get isProfessor =>
      (user?.role ?? '').toUpperCase().contains('PROFESSOR');
  bool get isStudent =>
      (user?.role ?? '').toUpperCase().contains('STUDENT') ||
      (user?.role ?? '').toUpperCase().contains('ALUNO');
}
