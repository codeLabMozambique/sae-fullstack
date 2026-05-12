import api from './api';

// ────────────────────────────────────────────────────────────
// Tipos
// ────────────────────────────────────────────────────────────

export type SubmissionState = 'pendente' | 'avaliado';

export interface Submission {
  id: number;
  assignmentId: number;
  studentUsername: string;
  studentName: string | null;
  comment: string | null;
  fileName: string | null;
  fileOriginalName: string | null;
  fileUrl: string | null;
  submittedAt: string;
  grade: number | null;
  gradedAt: string | null;
  state: SubmissionState;
}

export interface Assignment {
  id: number;
  classroomId: number;
  title: string;
  description: string | null;
  deadline: string;
  maxScore: number;
  fileName: string | null;
  fileOriginalName: string | null;
  fileUrl: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  mySubmission?: Submission | null;
  submissionCount?: number;
  gradedCount?: number;
}

export interface CreateAssignmentPayload {
  classroomId: number;
  title: string;
  description?: string;
  deadline: string;  // ISO
  maxScore: number;
  file?: File | null;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

const BASE = (import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080') + '/content';

/** URL absoluto para descarregar o ficheiro de uma submissão. */
export function submissionFileUrl(submissionId: number): string {
  return `${BASE}/api/assignments/submissions/${submissionId}/file`;
}

/** URL absoluto para descarregar o ficheiro de suporte de uma tarefa. */
export function assignmentFileUrl(assignmentId: number): string {
  return `${BASE}/api/assignments/${assignmentId}/file`;
}

// ────────────────────────────────────────────────────────────
// Professor
// ────────────────────────────────────────────────────────────

export async function createAssignment(payload: CreateAssignmentPayload): Promise<Assignment> {
  const { data } = await api.post<Assignment>('/content/api/professor/assignments', {
    classroomId: payload.classroomId,
    title: payload.title,
    description: payload.description ?? null,
    deadline: payload.deadline,
    maxScore: payload.maxScore,
  });
  return data;
}

export async function listProfessorAssignments(classroomId?: number): Promise<Assignment[]> {
  const { data } = await api.get<Assignment[]>('/content/api/professor/assignments', {
    params: classroomId ? { classroomId } : {},
  });
  return data;
}

export async function getProfessorAssignment(id: number): Promise<Assignment> {
  const { data } = await api.get<Assignment>(`/content/api/professor/assignments/${id}`);
  return data;
}

export async function deleteAssignment(id: number): Promise<void> {
  await api.delete(`/content/api/professor/assignments/${id}`);
}

export async function listAssignmentSubmissions(assignmentId: number): Promise<Submission[]> {
  const { data } = await api.get<Submission[]>(
    `/content/api/professor/assignments/${assignmentId}/submissions`
  );
  return data;
}

export async function gradeSubmission(submissionId: number, grade: number): Promise<Submission> {
  const { data } = await api.patch<Submission>(
    `/content/api/professor/assignments/submissions/${submissionId}/grade`,
    { grade }
  );
  return data;
}

// ────────────────────────────────────────────────────────────
// Estudante
// ────────────────────────────────────────────────────────────

export async function listStudentAssignments(classroomIds: number[]): Promise<Assignment[]> {
  const { data } = await api.get<Assignment[]>('/content/api/student/assignments', {
    params: { classroomIds: classroomIds.join(',') },
  });
  return data;
}

export async function getStudentAssignment(id: number, classroomIds: number[]): Promise<Assignment> {
  const { data } = await api.get<Assignment>(`/content/api/student/assignments/${id}`, {
    params: { classroomIds: classroomIds.join(',') },
  });
  return data;
}

export async function submitAssignment(
  assignmentId: number,
  payload: { comment?: string; file?: File | null; classroomIds: number[] }
): Promise<Submission> {
  const fd = new FormData();
  if (payload.comment) {
    fd.append('comment', new Blob([payload.comment], { type: 'text/plain' }));
  }
  if (payload.file) fd.append('file', payload.file);

  const { data } = await api.post<Submission>(
    `/content/api/student/assignments/${assignmentId}/submit`,
    fd,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { classroomIds: payload.classroomIds.join(',') },
    }
  );
  return data;
}

export async function listMySubmissions(): Promise<Submission[]> {
  const { data } = await api.get<Submission[]>('/content/api/student/assignments/submissions/mine');
  return data;
}
