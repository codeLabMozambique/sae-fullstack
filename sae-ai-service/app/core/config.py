from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_MAX_TOKENS: int = 1000
    OPENAI_TEMPERATURE: float = 0.3

    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600

    CHROMA_PERSIST_DIR: str = "./chroma_db"
    CONTENT_SERVICE_URL: str = "http://localhost:8082"
<<<<<<< HEAD
    INTERNAL_SERVICE_KEY: str = "sae-internal-key-2024"
=======
>>>>>>> bf8014b08160ac16714bfdd47fd2aa9f10097119

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
    ]

    MAX_MESSAGE_LENGTH: int = 2000
    MAX_QUIZ_QUESTIONS: int = 20

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
