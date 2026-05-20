from fastapi import APIRouter, Request, HTTPException, Header
from pydantic import BaseModel
from app.services import rag_service
from app.services.auth import require_role
from app.core.config import settings
from typing import Optional

router = APIRouter(prefix="/ingest", tags=["Ingest"])


class IngestRequest(BaseModel):
    content_id: str
    file_url: str
    title: str
    discipline: str = ""


def _is_internal(x_service_key: Optional[str]) -> bool:
    return x_service_key == settings.INTERNAL_SERVICE_KEY


@router.post("")
async def ingest_content(
    body: IngestRequest,
    request: Request,
    x_service_key: Optional[str] = Header(default=None),
):
    """
    Ingere um PDF na base de dados vectorial (ChromaDB).
    Aceita JWT com role PROFESSOR/ADMIN/ROOT ou header X-Service-Key para chamadas internas.
    """
    if not _is_internal(x_service_key):
        require_role(request, "PROFESSOR", "ADMIN", "ROOT")
    try:
        chunks = await rag_service.ingest(
            content_id=body.content_id,
            file_url=body.file_url,
            title=body.title,
            discipline=body.discipline,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na ingestão: {str(e)}")
    return {"message": "Ingestão concluída", "content_id": body.content_id, "chunks": chunks}


@router.delete("/{content_id}")
async def remove_content(
    content_id: str,
    request: Request,
    x_service_key: Optional[str] = Header(default=None),
):
    """Remove todos os chunks de um conteúdo do ChromaDB."""
    if not _is_internal(x_service_key):
        require_role(request, "PROFESSOR", "ADMIN", "ROOT")
    try:
        col = rag_service.get_collection()
        col.delete(where={"content_id": content_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao remover: {str(e)}")
    return {"message": "Conteúdo removido do índice", "content_id": content_id}
