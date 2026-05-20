from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from app.schemas.chat import ChatRequest, ChatResponse, ChatHistoryResponse, ChatHistoryMessage
from app.services.openai_service import openai_service
from app.services.redis_service import redis_service
from app.services import rag_service
from app.services.auth import get_username, get_role

router = APIRouter(prefix="/chat", tags=["Chat"])

_ROLE_SUFFIX = {
    "PROFESSOR": " O utilizador é um professor — podes usar linguagem mais técnica e pedagógica.",
    "ADMIN": " O utilizador é um administrador do sistema.",
    "STUDENT": " O utilizador é um aluno — usa linguagem simples e exemplos práticos.",
    "GUEST": " O utilizador é um visitante — apresenta o sistema brevemente se necessário.",
}


@router.post("", response_model=ChatResponse)
async def chat_with_ai(request_body: ChatRequest, request: Request):
    username = get_username(request)
    role = get_role(request)

    history = await redis_service.get_chat_history(request_body.session_id)
    history.append({"role": "user", "content": request_body.message})

    # RAG: search library books for relevant context
    rag_results = rag_service.search(
        query=request_body.message,
        discipline=request_body.subject,
        n=4,
    )
    context = ""
    sources: List[str] = []
    if rag_results:
        parts = []
        for r in rag_results:
            title = r["meta"].get("title", "")
            if title and title not in sources:
                sources.append(title)
            parts.append(f"[{title}]: {r['text']}")
        context = "\n\n".join(parts)

    # Build extra context: role hint + RAG book excerpts
    extra = _ROLE_SUFFIX.get(role, "")
    if context:
        extra += f"\n\nContexto dos livros da biblioteca:\n{context}"

    response_text = await openai_service.generate_educational_chat_response(
        history, extra_context=extra
    )
    history.append({"role": "assistant", "content": response_text})
    await redis_service.save_chat_history(request_body.session_id, history)

    return ChatResponse(response=response_text, session_id=request_body.session_id, sources=sources)


@router.get("/history/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: str):
    history = await redis_service.get_chat_history(session_id)
    messages = [ChatHistoryMessage(**msg) for msg in history]
    return ChatHistoryResponse(session_id=session_id, messages=messages)


@router.delete("/history/{session_id}")
async def clear_chat_history(session_id: str):
    await redis_service.clear_chat_history(session_id)
    return {"message": "Histórico limpo com sucesso"}
