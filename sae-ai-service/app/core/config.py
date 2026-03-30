from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # OpenAI
    OPENAI_API_KEY: str = "your-api-key-here"
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    OPENAI_MAX_TOKENS: int = 500
    OPENAI_TEMPERATURE: float = 0.7
    
    # Banco de Dados
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/smartsae"
    MONGODB_URL: str = "mongodb://localhost:27017"
    REDIS_URL: str = "redis://localhost:6379"
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    # Cache
    CACHE_TTL: int = 3600  # 1 hora
    
    # Limites
    MAX_MESSAGE_LENGTH: int = 1000
    MAX_QUIZ_QUESTIONS: int = 20

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
