from fastapi import APIRouter, File, UploadFile
from fastapi.responses import Response
from app.schemas.accessibility import TTSRequest
from app.services.accessibility_service import accessibility_service

router = APIRouter(tags=["Accessibility"])

@router.post("/text-to-speech")
async def text_to_speech(request: TTSRequest):
    audio_bytes = accessibility_service.text_to_speech(
        text=request.text,
        voice=request.voice,
        speed=request.speed
    )
    return Response(content=audio_bytes, media_type="audio/mpeg")

@router.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):
    audio_data = await audio.read()
    text = accessibility_service.speech_to_text(audio_data)
    return {"transcription": text}
