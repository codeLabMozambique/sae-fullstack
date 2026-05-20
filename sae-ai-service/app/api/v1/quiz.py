from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from app.schemas.quiz import QuizGenerateResponse, QuizSubmitRequest, QuizSubmitResponse, QuizQuestion
from app.services.openai_service import openai_service
from app.services.auth import require_role
from typing import Optional
import json

router = APIRouter(prefix="/quiz", tags=["Quiz"])


class QuizGenerateRequest(BaseModel):
    topic: str
    discipline: Optional[str] = None
    level: Optional[str] = None          # e.g. "10ª Classe"
    difficulty: str = "medio"             # facil | medio | dificil
    num_questions: int = Field(default=5, ge=1, le=20)


@router.post("/generate", response_model=QuizGenerateResponse)
async def generate_quiz(request_body: QuizGenerateRequest, request: Request):
    """
    Gera questões de múltipla escolha via OpenAI.
    Roles: PROFESSOR, ADMIN, ROOT
    """
    require_role(request, "PROFESSOR", "ADMIN", "ROOT")

    discipline_label = request_body.discipline or request_body.topic
    level_label = f", nível {request_body.level}" if request_body.level else ""
    prompt = (
        f"Gera {request_body.num_questions} questões de múltipla escolha sobre "
        f"'{request_body.topic}' da disciplina {discipline_label}{level_label}. "
        f"Dificuldade: {request_body.difficulty}. "
        "Responde APENAS com JSON válido no formato: "
        '{"questions": [{"question_text": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], '
        '"correct_answer": "A", "explanation": "..."}]}'
    )

    quiz_data = await openai_service.generate_quiz(
        topic=prompt,
        difficulty=request_body.difficulty,
        num_questions=request_body.num_questions,
    )

    questions = [QuizQuestion(**q) for q in quiz_data.get("questions", [])]
    return QuizGenerateResponse(
        topic=request_body.topic,
        difficulty=request_body.difficulty,
        questions=questions,
    )


@router.post("/submit", response_model=QuizSubmitResponse)
async def submit_quiz(request_body: QuizSubmitRequest):
    total = len(request_body.answers)
    score = sum(1 for v in request_body.answers.values() if v)
    pct = round(score / total * 100) if total else 0
    if pct >= 80:
        feedback = "Excelente! Continua assim."
    elif pct >= 60:
        feedback = "Bom resultado! Revê os erros para melhorar."
    else:
        feedback = "Precisas de estudar mais este tema. Não desistas!"
    return QuizSubmitResponse(score=score, total=total, feedback=feedback)


@router.get("/results/{user_id}")
async def get_results(user_id: str):
    return {"user_id": user_id, "history": []}
