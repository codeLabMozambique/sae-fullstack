import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

/// Reconhecimento de voz (pesquisa).
class VoiceSearch {
  VoiceSearch._();
  static final VoiceSearch instance = VoiceSearch._();

  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _initialized = false;

  Future<bool> _init() async {
    if (_initialized) return true;
    _initialized = await _speech.initialize(
      onError: (_) {},
      onStatus: (_) {},
    );
    return _initialized;
  }

  bool get isListening => _speech.isListening;

  Future<void> start({
    required void Function(String transcript) onResult,
    String localeId = 'pt_PT',
  }) async {
    if (!await _init()) return;
    if (_speech.isListening) {
      await _speech.stop();
      return;
    }
    await _speech.listen(
      localeId: localeId,
      onResult: (r) => onResult(r.recognizedWords),
      listenFor: const Duration(seconds: 12),
      pauseFor: const Duration(seconds: 3),
    );
  }

  Future<void> stop() async => _speech.stop();
}

/// Síntese de voz (leitura).
class Tts {
  Tts._();
  static final Tts instance = Tts._();

  final FlutterTts _tts = FlutterTts();
  bool _configured = false;

  Future<void> _ensure() async {
    if (_configured) return;
    await _tts.setLanguage('pt-PT');
    await _tts.setPitch(1.0);
    await _tts.setSpeechRate(0.5);
    _configured = true;
  }

  Future<void> speak(String text) async {
    if (text.trim().isEmpty) return;
    await _ensure();
    await _tts.stop();
    await _tts.speak(text);
  }

  Future<void> stop() async {
    await _tts.stop();
  }
}
