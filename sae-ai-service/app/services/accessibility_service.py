import edge_tts
import io
import logging

logger = logging.getLogger(__name__)

VOICES = {
    "pt-PT-masculino": "pt-PT-DuarteNeural",
    "pt-PT-feminino": "pt-PT-RaquelNeural",
    "pt-MZ-Standard-A": "pt-PT-RaquelNeural",
    "pt-MZ-Standard-B": "pt-PT-DuarteNeural",
}


class AccessibilityService:
    @staticmethod
    async def text_to_speech(text: str, voice: str = "pt-PT-masculino", speed: float = 1.0) -> bytes:
        voice_id = VOICES.get(voice, "pt-PT-DuarteNeural")
        rate = f"+{int((speed - 1) * 50)}%" if speed >= 1 else f"{int((speed - 1) * 50)}%"
        try:
            communicate = edge_tts.Communicate(text[:5000], voice_id, rate=rate)
            audio_chunks = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_chunks.append(chunk["data"])
            return b"".join(audio_chunks)
        except Exception as e:
            logger.error("TTS error: %s", e)
            raise

    @staticmethod
    def speech_to_text(audio_data: bytes) -> str:
        return "Transcrição de áudio não disponível nesta versão."


accessibility_service = AccessibilityService()
