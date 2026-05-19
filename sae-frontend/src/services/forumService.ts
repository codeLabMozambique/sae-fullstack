import api from './api';
import type {
  ForumQuestion, ExpertAnswer, CollaborativeAnswer,
  PageResponse, CreateQuestionRequest, CreateAnswerRequest,
  QuestionType, QuestionStatus, DisciplinaEnum, ProfessorInfo,
  ForumStatsOverview, ProfessorAssistanceStats, ForumMember, SubjectInfo,
  AttendanceReport, ProfessorCertificate,
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

  // EP-12a: Sala colaborativa legada por DisciplinaEnum
  getCollaborativeRoom: (disciplina: DisciplinaEnum): Promise<ForumQuestion> =>
    api.get<ForumQuestion>(`${BASE}/questions/rooms/collaborative/${disciplina}`).then(r => r.data),

  // EP-12b: Sala colaborativa TURMA por subjectId (+ classroomId opcional)
  getCollaborativeRoomBySubject: (subjectId: number, classroomId?: number): Promise<ForumQuestion> =>
    api.get<ForumQuestion>(`${BASE}/questions/rooms/collaborative/subject/${subjectId}`, {
      params: classroomId ? { classroomId } : undefined,
    }).then(r => r.data),

  // EP-13a: Sala expert legada por DisciplinaEnum
  getExpertRoom: (disciplina: DisciplinaEnum): Promise<ForumQuestion> =>
    api.get<ForumQuestion>(`${BASE}/questions/rooms/expert/${disciplina}`).then(r => r.data),

  // EP-13b: Sala expert TURMA por subjectId (+ classroomId opcional)
  getExpertRoomBySubject: (subjectId: number, classroomId?: number): Promise<ForumQuestion> =>
    api.get<ForumQuestion>(`${BASE}/questions/rooms/expert/subject/${subjectId}`, {
      params: classroomId ? { classroomId } : undefined,
    }).then(r => r.data),

  // EP-18: Membros do fórum para autocomplete de @mention
  getForumMembers: (subjectId: number, classroomId?: number): Promise<ForumMember[]> =>
    api.get<ForumMember[]>(`${BASE}/questions/members`, {
      params: { subjectId, ...(classroomId ? { classroomId } : {}) },
    }).then(r => r.data),

  // Disciplinas de uma turma (chama academic service via forum gateway)
  getSubjectsForClassroom: (classroomId: number): Promise<SubjectInfo[]> =>
    api.get<SubjectInfo[]>(`/academic/subject/by-classroom`, { params: { classroomId } }).then(r => r.data),

  // EP-14: Definir primeira mensagem numa sala expert
  updateFirstMessage: (id: number, descricao: string): Promise<void> =>
    api.patch(`${BASE}/questions/${id}/message`, { descricao }).then(() => {}),

  // EP-15: Listar professores por disciplina
  getProfessorsByDisciplina: (disciplina: DisciplinaEnum): Promise<ProfessorInfo[]> =>
    api.get<ProfessorInfo[]>(`${BASE}/questions/professors/disciplina/${disciplina}`).then(r => r.data),

  // Listar questões abertas para professor (caixa de entrada) — legado
  listProfessorInbox: (params?: {
    disciplina?: DisciplinaEnum;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ForumQuestion>> =>
    api.get<PageResponse<ForumQuestion>>(`${BASE}/questions`, {
      params: { questionType: 'ESPECIALIZADO', status: 'ABERTA', ...params },
    }).then(r => r.data),

  // Perguntas do utilizador autenticado (aluno — "Minhas Perguntas")
  getMyQuestions: (): Promise<ForumQuestion[]> =>
    api.get<ForumQuestion[]>(`${BASE}/questions/mine`).then(r => r.data),

  // EP-16: Perguntas pendentes filtradas pela especialidade do professor
  listProfessorPending: (): Promise<ForumQuestion[]> =>
    api.get<ForumQuestion[]>(`${BASE}/questions/professor/pending`).then(r => r.data),

  // EP-17: Perguntas respondidas pelo professor (+ colaborativas com actividade)
  listProfessorAnswered: (): Promise<ForumQuestion[]> =>
    api.get<ForumQuestion[]>(`${BASE}/questions/professor/answered`).then(r => r.data),

  // Estatísticas globais do fórum (ADMIN)
  getStatsOverview: (): Promise<ForumStatsOverview> =>
    api.get<ForumStatsOverview>(`${BASE}/questions/stats/overview`).then(r => r.data),

  // Estatísticas de assistência de um professor (ADMIN / PROFESSOR)
  getProfessorAssistanceStats: (username: string): Promise<ProfessorAssistanceStats> =>
    api.get<ProfessorAssistanceStats>(`${BASE}/questions/professor/${username}/assistance-stats`).then(r => r.data),

  // Presença: heartbeat do professor (chamado a cada 90s enquanto online)
  professorHeartbeat: (): Promise<void> =>
    api.put('/auth/users/professor/heartbeat').then(() => {}),

  // Presença: marcar professor como offline (chamado no logout / unload)
  professorGoOffline: (): Promise<void> =>
    api.put('/auth/users/professor/go-offline').then(() => {}),

  // Assistente IA: gera resposta automática para uma questão especializada
  requestAIAnswer: (questionId: number): Promise<ExpertAnswer> =>
    api.post<ExpertAnswer>(`${BASE}/questions/${questionId}/ai-answer`).then(r => r.data),

  // Todas as disciplinas activas (para professores ou admin)
  getAllActiveSubjects: (): Promise<SubjectInfo[]> =>
    api.get<SubjectInfo[]>('/academic/subject/all').then(r => r.data),

  // Disciplinas filtradas pelo nível/grupo do utilizador autenticado (vem da BD)
  getDisciplinesForMe: (): Promise<string[]> =>
    api.get<string[]>(`${BASE}/disciplines/for-me`).then(r => r.data),

  // Estatísticas do fórum com filtro de escola (ADMIN / SCHOOL_ADMIN)
  getStatsFiltered: (schoolId?: number): Promise<ForumStatsOverview> =>
    api.get<ForumStatsOverview>(`${BASE}/questions/reports/stats`, {
      params: schoolId ? { schoolId } : undefined,
    }).then(r => r.data),

  // Relatório de atendimento por período
  getAttendanceReport: (params: {
    from: string; to: string; schoolId?: number; discipline?: string;
  }): Promise<AttendanceReport> =>
    api.get<AttendanceReport>(`${BASE}/questions/reports/attendance`, { params }).then(r => r.data),

  // Exportar relatório de atendimento
  exportAttendanceReport: (params: {
    from: string; to: string; schoolId?: number; discipline?: string; format: 'csv' | 'excel' | 'pdf';
  }): Promise<Blob> =>
    api.get(`${BASE}/questions/reports/attendance/export`, {
      params, responseType: 'blob',
    }).then(r => r.data),

  // Certificados do professor autenticado
  getMyCertificates: (): Promise<ProfessorCertificate[]> =>
    api.get<ProfessorCertificate[]>(`${BASE}/certificates/mine`).then(r => r.data),

  // Publicar certificado (professor)
  publishCertificate: (id: number): Promise<ProfessorCertificate> =>
    api.put<ProfessorCertificate>(`${BASE}/certificates/${id}/publish`).then(r => r.data),

  // Certificados de um professor (ADMIN/SCHOOL_ADMIN)
  getProfessorCertificates: (username: string): Promise<ProfessorCertificate[]> =>
    api.get<ProfessorCertificate[]>(`${BASE}/certificates/professor/${username}`).then(r => r.data),

  // Toggle publicação pelo admin
  adminPublishCertificate: (id: number): Promise<ProfessorCertificate> =>
    api.put<ProfessorCertificate>(`${BASE}/certificates/${id}/admin-publish`).then(r => r.data),

  // Certificados públicos (sem auth)
  getPublicCertificates: (): Promise<ProfessorCertificate[]> =>
    api.get<ProfessorCertificate[]>(`${BASE}/certificates/public`).then(r => r.data),
};
