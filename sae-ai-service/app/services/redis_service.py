import redis.asyncio as redis
from app.core.config import settings
import json
import logging

logger = logging.getLogger(__name__)

class RedisService:
    def __init__(self):
        self.redis_client = None
        self.connect()

    def connect(self):
        try:
            self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception as e:
            logger.error(f"Erro ao conectar ao Redis (modo simulado ativo): {e}")

    async def get_chat_history(self, session_id: str) -> list:
        if not self.redis_client: return []
        try:
            data = await self.redis_client.get(f"chat:{session_id}")
            return json.loads(data) if data else []
        except Exception:
            return []

    async def save_chat_history(self, session_id: str, messages: list):
        if not self.redis_client: return
        try:
            await self.redis_client.setex(
                f"chat:{session_id}",
                settings.CACHE_TTL,
                json.dumps(messages)
            )
        except Exception as e:
            logger.error(f"Erro ao salvar no Redis: {e}")

    async def clear_chat_history(self, session_id: str):
        if not self.redis_client: return
        try:
            await self.redis_client.delete(f"chat:{session_id}")
        except Exception:
            pass

redis_service = RedisService()
