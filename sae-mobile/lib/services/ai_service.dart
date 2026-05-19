import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class ChatMessage {
  final String role; // 'user' | 'assistant'
  final String content;
  ChatMessage({required this.role, required this.content});
  factory ChatMessage.fromJson(Map<String, dynamic> j) =>
      ChatMessage(role: j['role'] ?? 'assistant', content: j['content'] ?? '');
}

class AiService {
  final _dio = Dio(BaseOptions(
    baseUrl: ApiClient.aiBaseUrl,
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 60),
    headers: {'Content-Type': 'application/json'},
  ));

  /// session_id persistido por dispositivo. Garante que o histórico
  /// no Redis do AI-service mantém continuidade entre sessões.
  Future<String> sessionId() async {
    final prefs = await SharedPreferences.getInstance();
    var id = prefs.getString(ApiClient.sessionKey);
    if (id == null || id.isEmpty) {
      id = 'mob-${DateTime.now().microsecondsSinceEpoch}';
      await prefs.setString(ApiClient.sessionKey, id);
    }
    return id;
  }

  /// Envia uma mensagem para o AI service.
  /// `subject` pode incluir tópico/livro/disciplina/capítulo seleccionados.
  Future<String> chat({
    required String message,
    String? subject,
  }) async {
    final sid = await sessionId();
    final res = await _dio.post('/api/v1/chat', data: {
      'session_id': sid,
      'message': message,
      if (subject != null && subject.isNotEmpty) 'subject': subject,
    });
    final data = res.data as Map<String, dynamic>;
    return (data['response'] ?? '').toString();
  }

  Future<List<ChatMessage>> history() async {
    final sid = await sessionId();
    try {
      final res = await _dio.get('/api/v1/chat/history/$sid');
      final list = (res.data['messages'] as List? ?? []).cast<Map<String, dynamic>>();
      return list.map(ChatMessage.fromJson).toList();
    } catch (_) {
      return const [];
    }
  }

  Future<void> clearHistory() async {
    final sid = await sessionId();
    try {
      await _dio.delete('/api/v1/chat/history/$sid');
    } catch (_) {}
  }

  Future<void> resetSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ApiClient.sessionKey);
  }
}
