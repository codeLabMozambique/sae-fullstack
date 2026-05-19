import api from './api';

// ────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────

export interface Content {
  id: string;
  title: string;
  description: string | null;
  discipline: string | null;
  level: string | null;
  year: number | null;
  isbn: string | null;
  publisher: string | null;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  totalPages: number | null;
  tags: string[] | null;
  categoryId: string | null;
  uploadedBy: string | null;
  uploadedByRole: string | null;
  uploadedByName: string | null;
  targetClassroomIds: number[] | null;
  targetForumIds: string[] | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface Discipline {
  id: number;
  name: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  children: Category[] | null;
}

export interface ListContentsParams {
  discipline?: string;
  level?: string;
  classroomId?: number;
  uploadedBy?: string;
  page?: number;
  size?: number;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

const CONTENT_BASE = (import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080') + '/content';

/**
 * Constrói URL absoluto para um caminho relativo retornado pelo backend.
 * Ex: "/api/contents/abc/read" → "http://localhost:8080/content/api/contents/abc/read"
 */
export function absoluteContentUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return CONTENT_BASE + path;
}

// ────────────────────────────────────────────────────────────
// Catálogo público (não exige token, mas o axios envia se houver)
// ────────────────────────────────────────────────────────────

export async function listContents(params: ListContentsParams = {}): Promise<PageResponse<Content>> {
  const { data } = await api.get<PageResponse<Content>>('/content/api/contents', { params });
  return data;
}

export async function searchContents(q: string, page = 0, size = 20): Promise<PageResponse<Content>> {
  const { data } = await api.get<PageResponse<Content>>('/content/api/contents/search', {
    params: { q, page, size },
  });
  return data;
}

export async function getContentById(id: string): Promise<Content> {
  const { data } = await api.get<Content>(`/content/api/contents/${id}`);
  return data;
}

export async function listDisciplines(): Promise<Discipline[]> {
  const { data } = await api.get<Discipline[]>('/content/api/disciplines');
  return data;
}

export async function listCategoriesTree(): Promise<Category[]> {
  const { data } = await api.get<Category[]>('/content/api/categories');
  return data;
}

/**
 * URL absoluto para abrir/streaming do PDF.
 * Para usar em <iframe src> ou abrir nova janela.
 * O endpoint é público mas devolve `Content-Disposition: inline`.
 */
export function readUrl(contentId: string): string {
  return `${CONTENT_BASE}/api/contents/${contentId}/read`;
}

// ────────────────────────────────────────────────────────────
// User: favoritos
// ────────────────────────────────────────────────────────────

export async function listFavorites(): Promise<Content[]> {
  const { data } = await api.get<Content[]>('/content/api/user/favorites');
  return data;
}

export async function addFavorite(contentId: string): Promise<void> {
  await api.post(`/content/api/user/favorites/${contentId}`);
}

export async function removeFavorite(contentId: string): Promise<void> {
  await api.delete(`/content/api/user/favorites/${contentId}`);
}

// ────────────────────────────────────────────────────────────
// User: progresso de leitura
// ────────────────────────────────────────────────────────────

export interface ReadingProgressView {
  id: string;
  userId: string;
  contentId: string;
  contentTitle: string;
  thumbnailUrl: string | null;
  currentPage: number | null;
  totalPages: number | null;
  percentageComplete: number | null;
  totalReadingTimeSeconds: number;
  lastReadAt: string;
}

export async function listProgress(sortBy = 'lastReadAt,desc'): Promise<ReadingProgressView[]> {
  const { data } = await api.get<ReadingProgressView[]>('/content/api/user/progress', {
    params: { sortBy },
  });
  return data;
}

export async function getProgress(contentId: string): Promise<ReadingProgressView> {
  const { data } = await api.get<ReadingProgressView>(`/content/api/user/progress/${contentId}`);
  return data;
}

export async function upsertProgress(
  contentId: string,
  currentPage: number,
  readingTimeSecondsDelta = 0
): Promise<ReadingProgressView> {
  const { data } = await api.put<ReadingProgressView>(`/content/api/user/progress/${contentId}`, {
    currentPage,
    readingTimeSecondsDelta,
  });
  return data;
}

// ────────────────────────────────────────────────────────────
// User: histórico
// ────────────────────────────────────────────────────────────

export interface ReadingHistory {
  id: string;
  userId: string;
  contentId: string;
  contentTitle: string | null;
  discipline: string;
  pagesRead: number;
  durationSeconds: number;
  readAt: string;
}

export async function getHistory(filters?: { discipline?: string; from?: string; to?: string }): Promise<ReadingHistory[]> {
  const { data } = await api.get<ReadingHistory[]>('/content/api/user/history', { params: filters });
  return data;
}

export async function recordHistory(contentId: string, pagesRead: number, durationSeconds: number): Promise<void> {
  await api.post('/content/api/user/history', { contentId, pagesRead, durationSeconds });
}

export async function deleteHistory(id: string): Promise<void> {
  await api.delete(`/content/api/user/history/${id}`);
}

// ────────────────────────────────────────────────────────────
// User: metas de estudo
// ────────────────────────────────────────────────────────────

export interface StudyGoal {
  id: string;
  userId: string;
  goalType: string | null;        // BOOK, PAGES, DISCIPLINE, CATEGORY
  goalUnit: string | null;        // PAGES or TIME
  contentId: string | null;
  contentTitle: string | null;
  contentThumbnail: string | null;
  discipline: string | null;
  category: string | null;
  title: string;
  targetPages: number;
  currentPages: number;
  dailyPagesTarget: number;
  targetMinutes: number;
  currentMinutes: number;
  dailyMinutesTarget: number;
  deadline: string;
  startedAt: string | null;
  status: string;                 // ACTIVE, PAUSED, COMPLETED
  active: boolean;
  reminderEmail: string | null;
  reminderEnabled: boolean;
  reminderFrequency: string;      // DAILY, EVERY_2_DAYS, WEEKLY, BEFORE_DEADLINE
  reminderDaysBefore: number;
  reminderTime: string;
  lastReminderSentAt: string | null;
}

export async function listGoals(params?: { active?: boolean; status?: string }): Promise<StudyGoal[]> {
  const { data } = await api.get<StudyGoal[]>('/content/api/user/goals', { params });
  return data;
}

export async function createGoal(payload: {
  title: string;
  targetPages?: number;
  dailyPagesTarget?: number;
  targetMinutes?: number;
  dailyMinutesTarget?: number;
  deadline: string;
  goalType?: string;
  goalUnit?: string;
  contentId?: string;
  contentTitle?: string;
  contentThumbnail?: string;
  discipline?: string;
  category?: string;
}): Promise<StudyGoal> {
  const { data } = await api.post<StudyGoal>('/content/api/user/goals', payload);
  return data;
}

export async function updateGoal(id: string, payload: Partial<StudyGoal>): Promise<StudyGoal> {
  const { data } = await api.patch<StudyGoal>(`/content/api/user/goals/${id}`, payload);
  return data;
}

export async function addGoalProgress(id: string, pages: number, minutes?: number): Promise<void> {
  await api.post(`/content/api/user/goals/${id}/progress`, { pages, ...(minutes ? { minutes } : {}) });
}

export async function pauseGoal(id: string): Promise<StudyGoal> {
  const { data } = await api.put<StudyGoal>(`/content/api/user/goals/${id}/pause`);
  return data;
}

export async function resumeGoal(id: string): Promise<StudyGoal> {
  const { data } = await api.put<StudyGoal>(`/content/api/user/goals/${id}/resume`);
  return data;
}

export async function resetGoal(id: string): Promise<StudyGoal> {
  const { data } = await api.put<StudyGoal>(`/content/api/user/goals/${id}/reset`);
  return data;
}

export async function deleteGoal(id: string): Promise<void> {
  await api.delete(`/content/api/user/goals/${id}`);
}

export async function setGoalReminder(
  id: string,
  payload: { email: string; frequency: string; daysBefore?: number; time?: string }
): Promise<StudyGoal> {
  const { data } = await api.put<StudyGoal>(`/content/api/user/goals/${id}/reminder`, payload);
  return data;
}

export async function removeGoalReminder(id: string): Promise<StudyGoal> {
  const { data } = await api.delete<StudyGoal>(`/content/api/user/goals/${id}/reminder`);
  return data;
}

// ────────────────────────────────────────────────────────────
// User: anexos genéricos
// ────────────────────────────────────────────────────────────

export interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  context: string | null;
  contextId: string | null;
  createdAt: string | null;
}

export async function uploadAttachment(file: File, context?: string, contextId?: string): Promise<Attachment> {
  const fd = new FormData();
  fd.append('file', file);
  const params: Record<string, string> = {};
  if (context) params.context = context;
  if (contextId) params.contextId = contextId;
  const { data } = await api.post<Attachment>('/content/api/user/uploads', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params,
  });
  return data;
}

export function attachmentUrl(attachmentId: string): string {
  return `${CONTENT_BASE}/api/user/uploads/${attachmentId}`;
}

// ────────────────────────────────────────────────────────────
// Professor / Admin: upload de conteúdos
// ────────────────────────────────────────────────────────────

export interface ContentMetadata {
  title: string;
  description?: string;
  discipline?: string;
  level?: string;
  year?: number;
  isbn?: string;
  publisher?: string;
  tags?: string[];
  categoryId?: string;
  targetClassroomIds?: number[];
  targetForumIds?: string[];
}

export async function uploadAsProfessor(file: File, metadata: ContentMetadata): Promise<Content> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  const { data } = await api.post<Content>('/content/api/professor/contents', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function uploadAsAdmin(file: File, metadata: ContentMetadata): Promise<Content> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  const { data } = await api.post<Content>('/content/api/admin/contents', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteProfessorContent(id: string): Promise<void> {
  await api.delete(`/content/api/professor/contents/${id}`);
}

export async function deleteAdminContent(id: string): Promise<void> {
  await api.delete(`/content/api/admin/contents/${id}`);
}

// ────────────────────────────────────────────────────────────
// Secções de conteúdo (divisão por trimestre/capítulo)
// ────────────────────────────────────────────────────────────

export interface ContentSection {
  id: string;
  contentId: string;
  sectionName: string;
  trimester?: number;
  startPage: number;
  endPage: number;
  position?: number;
  quizId?: number;
}

export interface SectionProgress {
  id?: string;
  userId?: string;
  sectionId: string;
  contentId?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completed: boolean;
  quizAttemptId?: number;
  completedAt?: string;
}

export async function listSections(contentId: string): Promise<ContentSection[]> {
  const { data } = await api.get<ContentSection[]>(`/content/api/contents/${contentId}/sections`);
  return data;
}

export async function createSection(contentId: string, section: Omit<ContentSection, 'id' | 'contentId'>): Promise<ContentSection> {
  const { data } = await api.post<ContentSection>(`/content/api/contents/${contentId}/sections`, section);
  return data;
}

export async function updateSection(contentId: string, sectionId: string, section: Partial<ContentSection>): Promise<ContentSection> {
  const { data } = await api.put<ContentSection>(`/content/api/contents/${contentId}/sections/${sectionId}`, section);
  return data;
}

export async function deleteSection(contentId: string, sectionId: string): Promise<void> {
  await api.delete(`/content/api/contents/${contentId}/sections/${sectionId}`);
}

export async function linkQuizToSection(contentId: string, sectionId: string, quizId: number): Promise<ContentSection> {
  const { data } = await api.patch<ContentSection>(`/content/api/contents/${contentId}/sections/${sectionId}/quiz`, { quizId });
  return data;
}

// Progresso por secção
export async function listSectionProgress(contentId: string): Promise<SectionProgress[]> {
  const { data } = await api.get<SectionProgress[]>('/content/api/user/section-progress', { params: { contentId } });
  return data;
}

export async function getSectionProgress(sectionId: string): Promise<SectionProgress> {
  const { data } = await api.get<SectionProgress>(`/content/api/user/section-progress/${sectionId}`);
  return data;
}

export async function completeSectionProgress(
  sectionId: string,
  payload: { contentId: string; score: number; totalQuestions: number; correctAnswers: number; quizAttemptId?: number }
): Promise<SectionProgress> {
  const { data } = await api.post<SectionProgress>(`/content/api/user/section-progress/${sectionId}/complete`, payload);
  return data;
}

// ────────────────────────────────────────────────────────────
// Analytics — conteúdo mais acedido (ADMIN / PROFESSOR)
// ────────────────────────────────────────────────────────────

export interface ContentStats {
  contentId: string;
  contentTitle: string;
  discipline: string | null;
  accessCount: number;
  uniqueUsers: number;
  totalReadingTimeSeconds: number;
}

export async function getMostAccessed(period = 'month', limit = 10): Promise<ContentStats[]> {
  const { data } = await api.get<ContentStats[]>('/content/api/analytics/most-accessed', {
    params: { period, limit },
  });
  return data;
}

export interface AccessModeStats {
  onlineCount: number;
  offlineCount: number;
  totalCount: number;
  offlinePercentage: number;
}

export async function getAccessModeStats(period = 'month'): Promise<AccessModeStats> {
  const { data } = await api.get<AccessModeStats>('/content/api/analytics/access-mode', {
    params: { period },
  });
  return data;
}
