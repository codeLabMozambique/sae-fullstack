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

export interface ForumQuestion {
  id: number;
  titulo: string;
  descricao: string;
  tags: string | null;
  area: string;
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
  tags?: string;
  questionType: QuestionType;
}

export interface CreateAnswerRequest {
  conteudo: string;
}
