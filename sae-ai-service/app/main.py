from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import chat, quiz, recommendations, accessibility

app = FastAPI(
    title="SmartSAE AI Microservice",
    description="Serviço de Inteligência Artificial para o Sistema de Apoio de Aprendizagem ao Estudante (SAE) de Moçambique.",
    version="1.0.0",
    docs_url="/api/docs"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/v1")
app.include_router(quiz.router, prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(accessibility.router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

@app.get("/metrics", tags=["Health"])
async def get_metrics():
    # Placeholder for actual metrics
    return {"uptime": 100, "requests": 5000}
