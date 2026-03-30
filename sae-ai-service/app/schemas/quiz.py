from pydantic import BaseModel
from typing import List

class QuizGenerateRequest(BaseModel):
    topic: str
    difficulty: str  # e.g. facil, medio, dificil
    num_questions: int

class QuizQuestion(BaseModel):
    question_text: str
    options: List[str]
    correct_answer: str
    explanation: str

class QuizGenerateResponse(BaseModel):
    topic: str
    difficulty: str
    questions: List[QuizQuestion]

class QuizSubmitRequest(BaseModel):
    user_id: str
    topic: str
    answers: dict  # e.g., mapping question text to answer, or index to answer

class QuizSubmitResponse(BaseModel):
    score: int
    total: int
    feedback: str
