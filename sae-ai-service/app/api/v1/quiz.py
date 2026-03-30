from fastapi import APIRouter
from app.schemas.quiz import QuizGenerateRequest, QuizGenerateResponse, QuizSubmitRequest, QuizSubmitResponse, QuizQuestion
from app.services.openai_service import openai_service
from typing import List

router = APIRouter(prefix="/quiz", tags=["Quiz"])

@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(request: QuizGenerateRequest):
    quiz_data = await openai_service.generate_quiz(
        topic=request.topic,
        difficulty=request.difficulty,
        num_questions=request.num_questions
    )
    
    questions = []
    if "questions" in quiz_data:
        for q in quiz_data["questions"]:
            questions.append(QuizQuestion(**q))
            
    return QuizGenerateResponse(
        topic=request.topic,
        difficulty=request.difficulty,
        questions=questions
    )

@router.post("/submit", response_model=QuizSubmitResponse)
async def submit_quiz(request: QuizSubmitRequest):
    # Lógica simplificada de avaliação
    total = len(request.answers)
    score = sum([1 for k, v in request.answers.items() if v])  # MOCK: conta quantos são truthy
    return QuizSubmitResponse(
        score=score,
        total=total,
        feedback="Bom trabalho! Continue a praticar."
    )

@router.get("/results/{user_id}")
async def get_results(user_id: str):
    # Mock de resultados do utilizador
    return {"user_id": user_id, "history": []}
