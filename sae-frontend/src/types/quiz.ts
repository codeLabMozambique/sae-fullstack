export interface QuizSummary {
  id: number;
  titulo: string;
  descricao: string;
  disciplina: string;
  disciplinaLabel: string;
  questionCount: number;
  tempoLimiteMinutos: number | null;
  active: boolean;
  createdBy: string;
  createdAt: string;
  myAttempts: number;
  bestScore: number | null;
  contentId?: string;
  startPage?: number;
  endPage?: number;
  aiGenerated?: boolean;
}

export interface ContentSection {
  id: string;
  contentId: string;
  sectionName: string;
  trimester?: number;
  startPage: number;
  endPage: number;
  position?: number;
}

export interface GenerateFromContentDTO {
  contentId: string;
  disciplina?: string;
  startPage: number;
  endPage: number;
  numQuestions?: number;
  tempoLimiteMinutos?: number;
  sectionName?: string;
}

export interface QuizOption {
  id: number;
  texto: string;
  letra: string;
}

export interface QuizQuestion {
  id: number;
  enunciado: string;
  ordemNumero: number;
  options: QuizOption[];
}

export interface Quiz {
  id: number;
  titulo: string;
  descricao: string;
  disciplina: string;
  disciplinaLabel: string;
  tempoLimiteMinutos: number | null;
  questions: QuizQuestion[];
}

export interface QuizOptionAdmin extends QuizOption {
  correta: boolean;
}

export interface QuizQuestionAdmin {
  id: number;
  enunciado: string;
  ordemNumero: number;
  options: QuizOptionAdmin[];
}

export interface QuizAdmin {
  id: number;
  titulo: string;
  descricao: string;
  disciplina: string;
  disciplinaLabel: string;
  tempoLimiteMinutos: number | null;
  active: boolean;
  createdBy: string;
  createdAt: string;
  questions: QuizQuestionAdmin[];
}

export interface StartAttemptResponse {
  attemptId: number;
  quiz: Quiz;
}

export interface AttemptAnswer {
  questionId: number;
  selectedOptionId: number | null;
}

export interface SubmitAttemptDTO {
  answers: AttemptAnswer[];
}

export interface QuestionResult {
  questionId: number;
  enunciado: string;
  selectedOptionId: number | null;
  selectedOptionLetra: string | null;
  selectedOptionTexto: string | null;
  correctOptionId: number;
  correctOptionLetra: string;
  correctOptionTexto: string;
  correct: boolean;
}

export interface QuizResult {
  attemptId: number;
  quizId: number;
  quizTitulo: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  questionResults: QuestionResult[];
}

export interface CreateQuizDTO {
  titulo: string;
  descricao: string;
  disciplina: string;
  tempoLimiteMinutos: number | null;
}

export interface CreateOptionDTO {
  texto: string;
  letra: string;
  correta: boolean;
}

export interface CreateQuestionDTO {
  enunciado: string;
  options: CreateOptionDTO[];
}

export const DISCIPLINAS = [
  { value: 'MATEMATICA',  label: 'Matemática' },
  { value: 'FISICA',      label: 'Física' },
  { value: 'QUIMICA',     label: 'Química' },
  { value: 'BIOLOGIA',    label: 'Biologia' },
  { value: 'PORTUGUES',   label: 'Português' },
  { value: 'HISTORIA',    label: 'História' },
  { value: 'GEOGRAFIA',   label: 'Geografia' },
  { value: 'INGLES',      label: 'Inglês' },
  { value: 'FILOSOFIA',   label: 'Filosofia' },
  { value: 'INFORMATICA', label: 'Informática' },
  { value: 'PROGRAMACAO', label: 'Programação' },
  { value: 'ECONOMIA',    label: 'Economia' },
  { value: 'GERAL',       label: 'Geral' },
];
