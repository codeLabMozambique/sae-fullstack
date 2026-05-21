import chromadb
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from app.core.config import settings
import fitz  # PyMuPDF
import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_collection = None

def get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        ef = OpenAIEmbeddingFunction(
            api_key=settings.OPENAI_API_KEY,
            model_name=settings.OPENAI_EMBEDDING_MODEL,
        )
        _collection = client.get_or_create_collection("books", embedding_function=ef)
    return _collection


def _extract_text(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    return "\n".join(page.get_text() for page in doc)


def _chunk(text: str, size: int = 1000, overlap: int = 150) -> list[str]:
    chunks, start = [], 0
    while start < len(text):
        chunks.append(text[start : start + size])
        start += size - overlap
    return [c for c in chunks if len(c.strip()) > 50]


async def ingest(content_id: str, file_url: str, title: str, discipline: str = "") -> int:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(file_url)
        resp.raise_for_status()
        pdf_bytes = resp.content

    text = _extract_text(pdf_bytes)
    chunks = _chunk(text)
    if not chunks:
        return 0

    col = get_collection()
    try:
        col.delete(where={"content_id": content_id})
    except Exception:
        pass

    ids = [f"{content_id}_{i}" for i in range(len(chunks))]
    metas = [
        {"content_id": content_id, "title": title, "discipline": discipline, "chunk": i}
        for i in range(len(chunks))
    ]
    col.add(documents=chunks, ids=ids, metadatas=metas)
    logger.info("Ingested %d chunks for content_id=%s", len(chunks), content_id)
    return len(chunks)


def search(query: str, discipline: Optional[str] = None, content_id: Optional[str] = None, n: int = 5) -> list[dict]:
    col = get_collection()
    # content_id filter takes priority — search only that specific book
    if content_id:
        where = {"content_id": content_id}
    elif discipline:
        where = {"discipline": discipline}
    else:
        where = None
    try:
        results = col.query(query_texts=[query], n_results=n, where=where)
    except Exception:
        return []
    docs = results["documents"][0] if results.get("documents") else []
    metas = results["metadatas"][0] if results.get("metadatas") else []
    return [{"text": d, "meta": m} for d, m in zip(docs, metas)]
