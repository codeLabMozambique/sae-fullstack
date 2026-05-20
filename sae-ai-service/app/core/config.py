from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import json

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

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
    ]

    MAX_MESSAGE_LENGTH: int = 2000
    MAX_QUIZ_QUESTIONS: int = 20

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                return json.loads(v)
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
