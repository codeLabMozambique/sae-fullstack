import api from './api';

export interface ReadingSuggestion {
  id: number;
  contentId: string;
  contentTitle: string;
  contentThumbnailUrl: string | null;
  classroomId: number;
  professorUsername: string;
  professorName: string | null;
  note: string | null;
  startPage: number | null;
  endPage: number | null;
  chapterRange: string | null;
  createdAt: string;
}

export interface CreateSuggestionPayload {
  contentId: string;
  classroomIds: number[];
  note?: string;
  startPage?: number;
  endPage?: number;
  chapterRange?: string;
}

export async function createSuggestion(payload: CreateSuggestionPayload): Promise<ReadingSuggestion[]> {
  const { data } = await api.post<ReadingSuggestion[]>('/content/api/professor/suggestions', payload);
  return data;
}

export async function listMySuggestions(): Promise<ReadingSuggestion[]> {
  const { data } = await api.get<ReadingSuggestion[]>('/content/api/professor/suggestions');
  return data;
}

export async function deleteSuggestion(id: number): Promise<void> {
  await api.delete(`/content/api/professor/suggestions/${id}`);
}

export async function listStudentSuggestions(classroomIds: number[]): Promise<ReadingSuggestion[]> {
  const { data } = await api.get<ReadingSuggestion[]>('/content/api/student/suggestions', {
    params: { classroomIds: classroomIds.join(',') },
  });
  return data;
}
