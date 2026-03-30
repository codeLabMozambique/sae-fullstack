class AccessibilityService:
    @staticmethod
    def text_to_speech(text: str, voice: str, speed: float) -> bytes:
        # Simulando geração de áudio (Mock)
        # Em produção, integraria com AWS Polly, Google TTS ou Azure TTS
        # Retornamos bytes simulando um buffer WAV ou MP3
        return b"MOCK_AUDIO_DATA_FOR: " + text.encode("utf-8")

    @staticmethod
    def speech_to_text(audio_data: bytes) -> str:
        # Simulando transcrição de áudio
        # Em produção, integraria com Whisper ou serviço similar da cloud
        return "Este é um texto transcrito simulado a partir do áudio fornecido."

accessibility_service = AccessibilityService()
