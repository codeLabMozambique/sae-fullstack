import redis.asyncio as redis
from app.core.config import settings
import json
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

# In-memory fallback when Redis is unavailable
_memory_store: Dict[str, List] = {}


class RedisService:
    def __init__(self):
        self._client = None
        self._available = False
        self._try_connect()

    def _try_connect(self):
        try:
            self._client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            self._available = True
        except Exception as e:
            logger.warning("Redis indisponível — usando memória: %s", e)
            self._available = False

    async def get_chat_history(self, session_id: str) -> list:
        if self._available:
            try:
                data = await self._client.get(f"chat:{session_id}")
                return json.loads(data) if data else []
            except Exception:
                pass
        return _memory_store.get(session_id, [])

    async def save_chat_history(self, session_id: str, messages: list):
        if self._available:
            try:
                await self._client.setex(
                    f"chat:{session_id}", settings.CACHE_TTL, json.dumps(messages)
                )
                return
            except Exception:
                pass
        _memory_store[session_id] = messages[-20:]  # keep last 20 messages

    async def clear_chat_history(self, session_id: str):
        if self._available:
            try:
                await self._client.delete(f"chat:{session_id}")
                return
            except Exception:
                pass
        _memory_store.pop(session_id, None)


redis_service = RedisService()
