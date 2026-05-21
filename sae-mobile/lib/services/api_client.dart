import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  // Produção: gateway HTTPS em smartsae.co.mz:8443 (mesmo URL que o
  // frontend web usa). O IP 187.77.71.198:8080 não é exposto publicamente.
  static const String defaultBaseUrl = 'https://smartsae.co.mz:8443';
  /// Serviço Python (sae-ai-service) — acedido pelo mesmo gateway.
  static const String aiBaseUrl = 'https://smartsae.co.mz:8443';
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
        // Endpoints públicos: NUNCA mandar Authorization (um token velho
        // faria o filtro JWT do Spring rejeitar o pedido antes do endpoint
        // sequer validar as credenciais — o cliente interpretava como
        // "credenciais inválidas").
        if (!_isPublicAuthPath(options.path)) {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString(tokenKey);
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
        } else {
          options.headers.remove('Authorization');
        }
        handler.next(options);
      },
      onError: (e, handler) {
        handler.next(e);
      },
    ));
    return d;
  }

  /// Endpoints que NÃO devem receber `Authorization`.
  static bool _isPublicAuthPath(String path) {
    return path.contains('/auth/users/login') ||
        path.contains('/auth/users/signup') ||
        path.contains('/auth/users/forgot-password') ||
        path.contains('/auth/users/reset-password') ||
        path.contains('/auth/health');
  }

  String get baseUrl => dio.options.baseUrl;
}
