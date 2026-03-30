from pydantic import BaseModel

class TTSRequest(BaseModel):
    text: str
    voice: str = "pt-MZ-Standard-A"
    speed: float = 1.0
