from fastapi import APIRouter
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse, RecommendedContent

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.post("", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    # Mock de recomendações
    recs = [
        RecommendedContent(
            title=f"Video Aula: {request.subject} Avançado",
            description="Aprofunde os seus conhecimentos nesta área.",
            content_type="video",
            url=f"https://exemplo.mz/video/{request.subject}"
        )
    ]
    return RecommendationResponse(user_id=request.user_id, recommendations=recs)

@router.get("/popular")
async def get_popular_recommendations():
    return [
        {
            "title": "Matemática: Preparação para Exames",
            "content_type": "pdf",
            "url": "https://exemplo.mz/conteudo/mat_exames.pdf"
        }
    ]
