from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from app.services import rag_service
from app.services.auth import require_role

router = APIRouter(prefix="/ingest", tags=["Ingest"])


class IngestRequest(BaseModel):
    content_id: str
    file_url: str
    title: str
    discipline: str = ""


@router.post("")
async def ingest_content(body: IngestRequest, request: Request):
    """
    Ingere um PDF na base de dados vectorial (ChromaDB).
    Chamado automaticamente após upload de conteúdo pelo professor/admin.
    Roles: PROFESSOR, ADMIN, ROOT
    """
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
