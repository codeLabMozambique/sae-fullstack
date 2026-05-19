export type QuestionType = 'ESPECIALIZADO' | 'COLABORATIVO';
export type QuestionStatus = 'ABERTA' | 'FECHADA';
export type ValidationStatus = 'PENDENTE' | 'VALIDADA';
export type ForumScope = 'TURMA' | 'DISCIPLINA';

export interface ExpertAnswer {
  id: number;
  conteudo: string;
  questionId: number;
  answeredBy: string;
  accepted: boolean;
  attachmentId?: string | null;
  aiGenerated?: boolean;
  createdAt: string;
}

export interface CollaborativeAnswer {
  id: number;
  conteudo: string;
  questionId: number;
  answeredBy: string;
  validationStatus: ValidationStatus;
  validatedBy: string | null;
  validatedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  attachmentId?: string | null;
  aiGenerated?: boolean;
  createdAt: string;
}

export type DisciplinaEnum =
  | 'MATEMATICA'
  | 'FISICA'
  | 'QUIMICA'
  | 'BIOLOGIA'
  | 'PORTUGUES'
  | 'HISTORIA'
  | 'GEOGRAFIA'
  | 'INGLES'
  | 'FILOSOFIA'
  | 'INFORMATICA'
  | 'GERAL';

export const DISCIPLINA_LABELS: Record<DisciplinaEnum, string> = {
  MATEMATICA: 'Matemática',
  FISICA: 'Física',
  QUIMICA: 'Química',
  BIOLOGIA: 'Biologia',
  PORTUGUES: 'Português',
  HISTORIA: 'História',
  GEOGRAFIA: 'Geografia',
  INGLES: 'Inglês',
  FILOSOFIA: 'Filosofia',
  INFORMATICA: 'Informática',
  GERAL: 'Geral',
};

export const DISCIPLINA_EMOJI: Record<DisciplinaEnum, string> = {
  MATEMATICA: '📐',
  FISICA: '⚗️',
  QUIMICA: '🧪',
  BIOLOGIA: '🌿',
  PORTUGUES: '📖',
  HISTORIA: '📜',
  GEOGRAFIA: '🌍',
  INGLES: '🇬🇧',
  FILOSOFIA: '🤔',
  INFORMATICA: '💻',
  GERAL: '💬',
};

export const DISCIPLINA_COLOR: Record<DisciplinaEnum, string> = {
  MATEMATICA: '#2563EB',
  FISICA: '#7C3AED',
  QUIMICA: '#059669',
  BIOLOGIA: '#16A34A',
  PORTUGUES: '#DC2626',
  HISTORIA: '#B45309',
  GEOGRAFIA: '#0891B2',
  INGLES: '#4F46E5',
  FILOSOFIA: '#6B7280',
  INFORMATICA: '#EA580C',
  GERAL: '#374151',
};

export const ALL_DISCIPLINAS: DisciplinaEnum[] = [
  'MATEMATICA', 'FISICA', 'QUIMICA', 'BIOLOGIA', 'PORTUGUES',
  'HISTORIA', 'GEOGRAFIA', 'INGLES', 'FILOSOFIA', 'INFORMATICA', 'GERAL',
];

export interface ForumMember {
  username: string;
  fullname: string;
  role: 'PROFESSOR' | 'STUDENT';
  online: boolean;
}

export interface SubjectInfo {
  id: number;
  name: string;
  code: string;
  description?: string;
}

export interface ForumQuestion {
  id: number;
  titulo: string;
  descricao: string;
  tags: string | null;
  // Novo modelo
  forumScope?: ForumScope;
  subjectId?: number | null;
  classroomId?: number | null;
  schoolId?: number | null;
  mentionedProfessorUsername?: string | null;
  professorFullName?: string | null;
  // Legado
  disciplina: DisciplinaEnum;
  questionType: QuestionType;
  status: QuestionStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  expertAnswers?: ExpertAnswer[];
  collaborativeAnswers?: CollaborativeAnswer[];
  responseTimeMinutes?: number | null;
}

export interface ForumStatsOverview {
  totalQuestions: number;
  totalByDisciplina: Record<string, number>;
  totalByType: Record<string, number>;
  totalByStatus: Record<string, number>;
  avgResponseTimeMinutes: number | null;
}

export interface ProfessorAssistanceStats {
  username: string;
  totalAnswered: number;
  totalAccepted: number;
  acceptanceRate: number;
  avgResponseTimeMinutes: number | null;
  assistancePercentage: number;
  disciplinas: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface NotificationPayload {
  event: 'NEW_QUESTION' | 'NEW_ANSWER' | 'ANSWER_ACCEPTED' | 'ANSWER_VALIDATED';
  id: number;
  questionId?: number;
  summary?: string;
  type?: string;
}

export interface CreateQuestionRequest {
  titulo: string;
  descricao: string;
  // Novo modelo
  forumScope?: ForumScope;
  subjectId?: number | null;
  classroomId?: number | null;
  schoolId?: number | null;
  mentionedProfessorUsername?: string | null;
  // Legado
  disciplina?: DisciplinaEnum;
  questionType?: QuestionType;
}

export interface CreateAnswerRequest {
  conteudo: string;
  attachmentId?: string | null;
}

export interface ProfessorInfo {
  username: string;
  fullname: string;
  online: boolean;
  lastSeen?: string;
  specialization: string;
}
