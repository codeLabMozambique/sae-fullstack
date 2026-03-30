from openai import AsyncOpenAI
from app.core.config import settings
import json

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

class OpenAIService:
    @staticmethod
    async def generate_educational_chat_response(messages: list, context: str = "") -> str:
        system_prompt = (
            "Você é um tutor educacional do SAE Moçambique, focado no currículo do Ensino Secundário. "
            "Sempre responda em português de Moçambique, de forma didática e encorajadora."
        )
        if context:
            system_prompt += f"\nContexto adicional da sessão: {context}"
            
        api_messages = [{"role": "system", "content": system_prompt}]
        api_messages.extend(messages)
        
        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=api_messages,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=settings.OPENAI_TEMPERATURE
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"[Resposta simulada da IA]: Detetámos um problema em processar o prompt. Erro: {str(e)}"

    @staticmethod
    async def generate_quiz(topic: str, difficulty: str, num_questions: int) -> dict:
        prompt = (
            f"Gere um quiz de múltipla escolha sobre '{topic}' com dificuldade '{difficulty}'. "
            f"O quiz deve conter exatamente {num_questions} perguntas. "
            "Formato: JSON bruto com chave 'questions' (lista). Cada questão tem 'question_text', "
            "'options' (lista de 4 itens), 'correct_answer', 'explanation'."
        )
        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "Você é um gerador de quizzes JSON para Moçambique. Retorne apenas JSON válido sem formatação markdown markdown."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500,
                temperature=0.7,
                response_format={ "type": "json_object" }
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            return {
                "questions": [
                    {
                        "question_text": f"Pergunta de teste sobre {topic} - erro API: {str(e)}",
                        "options": ["A", "B", "C", "D"],
                        "correct_answer": "A",
                        "explanation": "Explicação simulada."
                    }
                ]
            }

openai_service = OpenAIService()
