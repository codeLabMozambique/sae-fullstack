from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    session_id: str
    message: str
    subject: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class ChatHistoryMessage(BaseModel):
    role: str
    content: str

class ChatHistoryResponse(BaseModel):
    session_id: str
    messages: List[ChatHistoryMessage]
