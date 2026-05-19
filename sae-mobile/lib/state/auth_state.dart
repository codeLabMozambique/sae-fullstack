import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class AuthState extends ChangeNotifier {
  AuthUser? user;
  bool loading = true;
  bool isGuest = false;

  final _service = AuthService();

  Future<void> bootstrap() async {
    user = await _service.currentUser();
    isGuest = false;
    loading = false;
    notifyListeners();
  }

  Future<void> login(String username, String password) async {
    user = await _service.login(username, password);
    isGuest = false;
    notifyListeners();
  }

  void enterAsGuest() {
    user = AuthUser(userId: 0, username: 'guest', fullName: 'Visitante', role: 'GUEST');
    isGuest = true;
    notifyListeners();
  }

  Future<void> logout() async {
    if (!isGuest) await _service.logout();
    user = null;
    isGuest = false;
    notifyListeners();
  }

  String get role => (user?.role ?? '').toUpperCase();
  bool get isProfessor => role.contains('PROFESSOR');
  bool get isStudent => role.contains('STUDENT') || role.contains('ALUNO');
  bool get isGuestRole => role == 'GUEST';
}
