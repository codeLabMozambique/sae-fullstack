import api from './api';
import type {
  ForumQuestion, ExpertAnswer, CollaborativeAnswer,
  PageResponse, CreateQuestionRequest, CreateAnswerRequest,
  QuestionType, QuestionStatus,
} from '../types/forum';

const BASE = '/forum';

export const forumService = {
  // EP-1 / EP-6: Criar pergunta
  createQuestion: (data: CreateQuestionRequest): Promise<ForumQuestion> => {
    const endpoint = data.questionType === 'COLABORATIVO'
      ? `${BASE}/questions/collaborative`
      : `${BASE}/questions`;
    return api.post<ForumQuestion>(endpoint, data).then(r => r.data);
  },

  // EP-2: Listar perguntas com filtros
  listQuestions: (params?: {
    area?: string;
    questionType?: QuestionType;
    status?: QuestionStatus;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ForumQuestion>> =>
    api.get<PageResponse<ForumQuestion>>(`${BASE}/questions`, { params }).then(r => r.data),

  // EP-3: Detalhe de pergunta com respostas
  getQuestion: (id: number): Promise<ForumQuestion> =>
    api.get<ForumQuestion>(`${BASE}/questions/${id}`).then(r => r.data),

  // EP-4: Resposta de especialista
  createExpertAnswer: (questionId: number, data: CreateAnswerRequest): Promise<ExpertAnswer> =>
    api.post<ExpertAnswer>(`${BASE}/questions/${questionId}/expert-answers`, data).then(r => r.data),

  // EP-5: Aceitar resposta
  acceptAnswer: (answerId: number): Promise<ExpertAnswer> =>
    api.put<ExpertAnswer>(`${BASE}/expert-answers/${answerId}/accept`).then(r => r.data),

  // EP-7: Resposta colaborativa
  createCollaborativeAnswer: (questionId: number, data: CreateAnswerRequest): Promise<CollaborativeAnswer> =>
    api.post<CollaborativeAnswer>(`${BASE}/collaborative/questions/${questionId}/answers`, data).then(r => r.data),

  // EP-8: Listar pendentes
  listPendingAnswers: (params?: { page?: number; size?: number }): Promise<PageResponse<CollaborativeAnswer>> =>
    api.get<PageResponse<CollaborativeAnswer>>(`${BASE}/collaborative/answers/pending`, { params }).then(r => r.data),

  // EP-9: Validar resposta
  validateAnswer: (answerId: number): Promise<CollaborativeAnswer> =>
    api.put<CollaborativeAnswer>(`${BASE}/collaborative/answers/${answerId}/validate`).then(r => r.data),

  // EP-10: Rejeitar resposta
  rejectAnswer: (answerId: number): Promise<CollaborativeAnswer> =>
    api.put<CollaborativeAnswer>(`${BASE}/collaborative/answers/${answerId}/reject`).then(r => r.data),
};
