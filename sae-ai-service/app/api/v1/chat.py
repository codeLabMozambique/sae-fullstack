from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.chat import ChatRequest, ChatResponse, ChatHistoryResponse, ChatHistoryMessage
from app.services.openai_service import openai_service
from app.services.redis_service import redis_service

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    # Recupera histórico
    history = await redis_service.get_chat_history(request.session_id)
    
    # Adiciona a nova mensagem do utilizador
    history.append({"role": "user", "content": request.message})
    
    # Gera a resposta
    context = f"Disciplina/Tópico: {request.subject}" if request.subject else ""
    response_text = await openai_service.generate_educational_chat_response(history, context)
    
    # Atualiza histórico com resposta da IA
    history.append({"role": "assistant", "content": response_text})
    
    # Salva no Redis
    await redis_service.save_chat_history(request.session_id, history)
    
    return ChatResponse(response=response_text, session_id=request.session_id)

@router.get("/history/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: str):
    history = await redis_service.get_chat_history(session_id)
    messages = [ChatHistoryMessage(**msg) for msg in history]
    return ChatHistoryResponse(session_id=session_id, messages=messages)

@router.delete("/history/{session_id}")
async def clear_chat_history(session_id: str):
    await redis_service.clear_chat_history(session_id)
    return {"message": "Histórico limpo com sucesso"}
