import api from './api';
import type {
  ForumQuestion, ExpertAnswer, CollaborativeAnswer,
  PageResponse, CreateQuestionRequest, CreateAnswerRequest,
  QuestionType, QuestionStatus, DisciplinaEnum, ProfessorInfo,
} from '../types/forum';

const BASE = '/forum';

export const forumService = {
  // EP-1 / EP-6: Criar pergunta manualmente (compatibilidade)
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
    disciplina?: DisciplinaEnum;
  }): Promise<PageResponse<ForumQuestion>> =>
    api.get<PageResponse<ForumQuestion>>(`${BASE}/questions`, { params }).then(r => r.data),

  // EP-3: Detalhe de pergunta com respostas
  getQuestion: (id: number): Promise<ForumQuestion> =>
    api.get<ForumQuestion>(`${BASE}/questions/${id}`).then(r => r.data),

  // EP-4: Resposta de especialista (professor)
  createExpertAnswer: (questionId: number, data: CreateAnswerRequest): Promise<ExpertAnswer> =>
    api.post<ExpertAnswer>(`${BASE}/questions/${questionId}/expert-answers`, data).then(r => r.data),

  // EP-5: Aceitar resposta (aluno)
  acceptAnswer: (answerId: number): Promise<ExpertAnswer> =>
    api.put<ExpertAnswer>(`${BASE}/expert-answers/${answerId}/accept`).then(r => r.data),

  // EP-7: Resposta colaborativa (qualquer utilizador autenticado)
  createCollaborativeAnswer: (questionId: number, data: CreateAnswerRequest): Promise<CollaborativeAnswer> =>
    api.post<CollaborativeAnswer>(`${BASE}/collaborative/questions/${questionId}/answers`, data).then(r => r.data),

  // EP-8: Listar pendentes (professor)
  listPendingAnswers: (params?: { page?: number; size?: number }): Promise<PageResponse<CollaborativeAnswer>> =>
    api.get<PageResponse<CollaborativeAnswer>>(`${BASE}/collaborative/answers/pending`, { params }).then(r => r.data),

  // EP-9: Validar resposta colaborativa
  validateAnswer: (answerId: number): Promise<CollaborativeAnswer> =>
    api.put<CollaborativeAnswer>(`${BASE}/collaborative/answers/${answerId}/validate`).then(r => r.data),

  // EP-10: Rejeitar resposta colaborativa
  rejectAnswer: (answerId: number): Promise<CollaborativeAnswer> =>
    api.put<CollaborativeAnswer>(`${BASE}/collaborative/answers/${answerId}/reject`).then(r => r.data),

  // EP-12: Obter ou criar sala colaborativa da turma (1 sala por disciplina)
  getCollaborativeRoom: (disciplina: DisciplinaEnum): Promise<ForumQuestion> =>
    api.get<ForumQuestion>(`${BASE}/questions/rooms/collaborative/${disciplina}`).then(r => r.data),

  // EP-13: Obter ou criar sala privada com professor (1 sala por aluno+disciplina)
  getExpertRoom: (disciplina: DisciplinaEnum): Promise<ForumQuestion> =>
    api.get<ForumQuestion>(`${BASE}/questions/rooms/expert/${disciplina}`).then(r => r.data),

  // EP-14: Definir primeira mensagem numa sala expert
  updateFirstMessage: (id: number, descricao: string): Promise<void> =>
    api.patch(`${BASE}/questions/${id}/message`, { descricao }).then(() => {}),

  // EP-15: Listar professores por disciplina
  getProfessorsByDisciplina: (disciplina: DisciplinaEnum): Promise<ProfessorInfo[]> =>
    api.get<ProfessorInfo[]>(`${BASE}/questions/professors/disciplina/${disciplina}`).then(r => r.data),

  // Listar questões abertas para professor (caixa de entrada)
  listProfessorInbox: (params?: {
    disciplina?: DisciplinaEnum;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ForumQuestion>> =>
    api.get<PageResponse<ForumQuestion>>(`${BASE}/questions`, {
      params: { questionType: 'ESPECIALIZADO', status: 'ABERTA', ...params },
    }).then(r => r.data),
};
