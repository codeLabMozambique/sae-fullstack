import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  // Para emulador Android usa-se 10.0.2.2 em vez de localhost.
  static const String defaultBaseUrl = 'http://10.0.2.2:8080';
  /// Serviço Python (sae-ai-service) — corre directo (sem gateway).
  static const String aiBaseUrl = 'http://10.0.2.2:8000';
  static const String tokenKey = 'sae_token';
  static const String userKey = 'sae_user';
  static const String sessionKey = 'sae_chat_session_id';

  late final Dio dio = _build();

  Dio _build() {
    final d = Dio(BaseOptions(
      baseUrl: defaultBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));
    d.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString(tokenKey);
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (e, handler) {
        handler.next(e);
      },
    ));
    return d;
  }

  String get baseUrl => dio.options.baseUrl;
}
