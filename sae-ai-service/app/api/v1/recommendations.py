from fastapi import APIRouter, Request, Query
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse, RecommendedContent
from app.services import rag_service
from app.services.auth import get_username
from app.core.config import settings
import httpx
import logging

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])
logger = logging.getLogger(__name__)


@router.post("", response_model=RecommendationResponse)
async def get_recommendations(request_body: RecommendationRequest, request: Request):
    """
    Recomendações inteligentes baseadas no histórico do utilizador + similaridade semântica (ChromaDB).
    """
    username = request_body.user_id or get_username(request)
    auth_header = request.headers.get("Authorization", "")

    # Get user's recent reading history from content service
    recent_titles: list[str] = []
    content_ids_seen: set[str] = set()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{settings.CONTENT_SERVICE_URL}/contents/history",
                params={"username": username, "size": 5},
                headers={"Authorization": auth_header},
            )
            if resp.status_code == 200:
                items = resp.json() if isinstance(resp.json(), list) else resp.json().get("content", [])
                for item in items:
                    if item.get("title"):
                        recent_titles.append(item["title"])
                    if item.get("contentId") or item.get("id"):
                        content_ids_seen.add(item.get("contentId") or item.get("id"))
    except Exception as e:
        logger.warning("Não foi possível obter histórico: %s", e)

    query = " ".join(filter(None, [request_body.subject] + recent_titles[:3])) or request_body.subject
    if not query:
        return RecommendationResponse(user_id=username, recommendations=[])

    rag_results = rag_service.search(query=query, discipline=request_body.subject, n=10)

    seen_content_ids: set[str] = set(content_ids_seen)
    recs: list[RecommendedContent] = []
    for r in rag_results:
        cid = r["meta"].get("content_id", "")
        if cid in seen_content_ids:
            continue
        seen_content_ids.add(cid)
        recs.append(
            RecommendedContent(
                title=r["meta"].get("title", ""),
                description=r["text"][:120] + "…",
                content_type="pdf",
                url=f"{settings.CONTENT_SERVICE_URL}/contents/{cid}/file",
            )
        )
        if len(recs) >= 5:
            break

    return RecommendationResponse(user_id=username, recommendations=recs)


@router.get("/popular")
async def get_popular():
    return []
