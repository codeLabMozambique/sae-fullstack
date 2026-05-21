from openai import AsyncOpenAI
from app.core.config import settings
import json

_client: AsyncOpenAI | None = None

def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client

# ──────────────────────────────────────────────────────────────────
# Prompt base: assistente geral da plataforma SAE
# ──────────────────────────────────────────────────────────────────
_ACADEMIC_SYSTEM = """És o assistente de IA do SAE (Sistema de Apoio ao Estudante) de Moçambique.
Ajudas estudantes, professores e utilizadores com qualquer dúvida ou questão que coloquem.

REGRAS:
1. Responde SEMPRE em Português de Moçambique.
2. Sê útil, didáctico, encorajador e claro nas respostas.
3. Quando usares informação de livros da biblioteca, cita o título da fonte.
4. Nunca respondas a pedidos de código malicioso ou conteúdo que cause dano a pessoas."""


class OpenAIService:

    @staticmethod
    async def generate_educational_chat_response(
        messages: list,
        extra_context: str = "",
    ) -> str:
        system = _ACADEMIC_SYSTEM
        if extra_context:
            system += f"\n\n{extra_context}"

        api_messages = [{"role": "system", "content": system}]
        api_messages.extend(messages)

        response = await _get_client().chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=api_messages,
            max_tokens=settings.OPENAI_MAX_TOKENS,
            temperature=settings.OPENAI_TEMPERATURE,
        )
        return response.choices[0].message.content or ""

    @staticmethod
    async def generate_quiz(topic: str, difficulty: str, num_questions: int) -> dict:
        system = (
            _ACADEMIC_SYSTEM
            + "\n\nResponde APENAS com JSON válido, sem markdown nem explicações extra."
        )
        prompt = (
            f"Gera {num_questions} questões de múltipla escolha sobre o seguinte tópico académico:\n"
            f"{topic}\n"
            f"Dificuldade: {difficulty}.\n"
            "Formato JSON obrigatório:\n"
            '{"questions": [{"question_text": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], '
            '"correct_answer": "A", "explanation": "..."}]}'
        )
        try:
            response = await _get_client().chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=2000,
                temperature=0.7,
                response_format={"type": "json_object"},
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            return {
                "questions": [
                    {
                        "question_text": f"Erro ao gerar questão: {str(e)}",
                        "options": ["A) —", "B) —", "C) —", "D) —"],
                        "correct_answer": "A",
                        "explanation": "",
                    }
                ]
            }


openai_service = OpenAIService()
