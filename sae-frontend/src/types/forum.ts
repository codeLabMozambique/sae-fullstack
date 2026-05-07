export type QuestionType = 'ESPECIALIZADO' | 'COLABORATIVO';
export type QuestionStatus = 'ABERTA' | 'FECHADA';
export type ValidationStatus = 'PENDENTE' | 'VALIDADA';

export interface ExpertAnswer {
  id: number;
  conteudo: string;
  questionId: number;
  answeredBy: string;
  accepted: boolean;
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

export interface ForumQuestion {
  id: number;
  titulo: string;
  descricao: string;
  tags: string | null;
  disciplina: DisciplinaEnum;
  questionType: QuestionType;
  status: QuestionStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  expertAnswers?: ExpertAnswer[];
  collaborativeAnswers?: CollaborativeAnswer[];
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
  disciplina: DisciplinaEnum;
  questionType: QuestionType;
}

export interface CreateAnswerRequest {
  conteudo: string;
}

export interface ProfessorInfo {
  username: string;
  fullname: string;
  online: boolean;
  specialization: string;
}
