from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from typing import List, Optional
from app.schemas.chat import ChatRequest, ChatResponse, ChatHistoryResponse, ChatHistoryMessage
from app.services.openai_service import openai_service
from app.services.redis_service import redis_service
from app.services import rag_service
from app.services.auth import get_username, get_role
import fitz

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

    # RAG: search library books — filter by specific book if content_id provided
    # When a specific book is open, return more chunks to cover more pages
    n_chunks = 15 if request_body.content_id else 5
    rag_results = rag_service.search(
        query=request_body.message,
        discipline=request_body.subject,
        content_id=request_body.content_id,
        n=n_chunks,
    )
    context = ""
    sources: List[str] = []
    if rag_results:
        parts = []
        for r in rag_results:
            title = r["meta"].get("title", "")
            chunk_idx = r["meta"].get("chunk", "")
            if title and title not in sources:
                sources.append(title)
            label = f"[{title} — página ~{chunk_idx + 1}]" if chunk_idx != "" else f"[{title}]"
            parts.append(f"{label}: {r['text']}")
        context = "\n\n".join(parts)

    extra = _ROLE_SUFFIX.get(role, "")
    if context:
        if request_body.content_id:
            extra += (
                "\n\nO utilizador está a ler um livro específico da biblioteca. "
                "Usa EXCLUSIVAMENTE o conteúdo das páginas abaixo para responder. "
                "Explica com detalhe, citando a secção do livro quando relevante. "
                "Se a resposta não estiver nas páginas fornecidas, diz isso claramente.\n\n"
                f"Páginas do livro:\n{context}"
            )
        else:
            extra += f"\n\nContexto dos livros da biblioteca:\n{context}"

    response_text = await openai_service.generate_educational_chat_response(
        history, extra_context=extra
    )
    history.append({"role": "assistant", "content": response_text})
    await redis_service.save_chat_history(request_body.session_id, history)

    return ChatResponse(response=response_text, session_id=request_body.session_id, sources=sources)


@router.post("/extract-text")
async def extract_text_from_file(file: UploadFile = File(...)):
    """Extrai texto de um PDF ou ficheiro de texto para usar como contexto no chat."""
    content_type = file.content_type or ""
    filename = file.filename or ""

    data = await file.read()
    if len(data) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=413, detail="Ficheiro demasiado grande (máximo 10 MB)")

    text = ""
    if "pdf" in content_type or filename.lower().endswith(".pdf"):
        try:
            doc = fitz.open(stream=data, filetype="pdf")
            pages_text = []
            for page in doc:
                pages_text.append(page.get_text())
            text = "\n".join(pages_text)
            doc.close()
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Erro ao processar PDF: {str(e)}")
    elif "text" in content_type or filename.lower().endswith((".txt", ".md")):
        try:
            text = data.decode("utf-8", errors="replace")
        except Exception:
            raise HTTPException(status_code=422, detail="Não foi possível ler o ficheiro de texto")
    else:
        raise HTTPException(status_code=415, detail="Tipo de ficheiro não suportado. Use PDF ou texto.")

    # Trim to avoid huge context (first ~8000 chars = ~2000 tokens)
    if len(text) > 8000:
        text = text[:8000] + "\n[... conteúdo truncado ...]"

    return {"text": text.strip(), "filename": filename, "chars": len(text)}


@router.get("/history/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: str):
    history = await redis_service.get_chat_history(session_id)
    messages = [ChatHistoryMessage(**msg) for msg in history]
    return ChatHistoryResponse(session_id=session_id, messages=messages)


@router.delete("/history/{session_id}")
async def clear_chat_history(session_id: str):
    await redis_service.clear_chat_history(session_id)
    return {"message": "Histórico limpo com sucesso"}
