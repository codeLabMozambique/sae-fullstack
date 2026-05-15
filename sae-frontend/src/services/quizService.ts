import api from './api';
import type {
  QuizSummary, Quiz, QuizAdmin,
  StartAttemptResponse, SubmitAttemptDTO, QuizResult,
  CreateQuizDTO, CreateQuestionDTO, GenerateFromContentDTO, StudyPrepRequestDTO,
  OralTestRequestDTO, OralTestEvaluateDTO, OralTestResult,
} from '../types/quiz';

const BASE = '/quiz';

export const quizService = {
  listQuizzes: (disciplina?: string): Promise<QuizSummary[]> =>
    api.get<QuizSummary[]>(`${BASE}/quizzes`, { params: disciplina ? { disciplina } : {} }).then(r => r.data),

  getQuiz: (id: number): Promise<Quiz> =>
    api.get<Quiz>(`${BASE}/quizzes/${id}`).then(r => r.data),

  getQuizForAdmin: (id: number): Promise<QuizAdmin> =>
    api.get<QuizAdmin>(`${BASE}/quizzes/${id}/manage`).then(r => r.data),

  createQuiz: (dto: CreateQuizDTO): Promise<QuizAdmin> =>
    api.post<QuizAdmin>(`${BASE}/quizzes`, dto).then(r => r.data),

  updateQuiz: (id: number, dto: CreateQuizDTO): Promise<QuizAdmin> =>
    api.put<QuizAdmin>(`${BASE}/quizzes/${id}`, dto).then(r => r.data),

  deleteQuiz: (id: number): Promise<void> =>
    api.delete(`${BASE}/quizzes/${id}`).then(() => {}),

  toggleActive: (id: number): Promise<QuizSummary> =>
    api.put<QuizSummary>(`${BASE}/quizzes/${id}/toggle-active`).then(r => r.data),

  addQuestion: (quizId: number, dto: CreateQuestionDTO): Promise<QuizAdmin> =>
    api.post<QuizAdmin>(`${BASE}/quizzes/${quizId}/questions`, dto).then(r => r.data),

  deleteQuestion: (quizId: number, questionId: number): Promise<void> =>
    api.delete(`${BASE}/quizzes/${quizId}/questions/${questionId}`).then(() => {}),

  startAttempt: (quizId: number): Promise<StartAttemptResponse> =>
    api.post<StartAttemptResponse>(`${BASE}/attempts/start`, null, { params: { quizId } }).then(r => r.data),

  submitAttempt: (attemptId: number, dto: SubmitAttemptDTO): Promise<QuizResult> =>
    api.post<QuizResult>(`${BASE}/attempts/${attemptId}/submit`, dto).then(r => r.data),

  getAttemptResult: (attemptId: number): Promise<QuizResult> =>
    api.get<QuizResult>(`${BASE}/attempts/${attemptId}/result`).then(r => r.data),

  getMyAttempts: (): Promise<QuizSummary[]> =>
    api.get<QuizSummary[]>(`${BASE}/attempts/my`).then(r => r.data),

  generateFromContent: (dto: GenerateFromContentDTO): Promise<QuizAdmin> =>
    api.post<QuizAdmin>(`${BASE}/quizzes/generate-from-content`, dto).then(r => r.data),

  generateStudyPrep: (dto: StudyPrepRequestDTO): Promise<QuizAdmin> =>
    api.post<QuizAdmin>(`${BASE}/quizzes/study-prep`, dto).then(r => r.data),

  getDisciplinesAll: (): Promise<string[]> =>
    api.get<string[]>('/quiz/disciplines/all').then(r => r.data),

  generateOralTest: (dto: OralTestRequestDTO): Promise<QuizAdmin> =>
    api.post<QuizAdmin>(`${BASE}/quizzes/oral-test/generate`, dto).then(r => r.data),

  evaluateOralTest: (dto: OralTestEvaluateDTO): Promise<OralTestResult> =>
    api.post<OralTestResult>(`${BASE}/quizzes/oral-test/evaluate`, dto).then(r => r.data),
};
