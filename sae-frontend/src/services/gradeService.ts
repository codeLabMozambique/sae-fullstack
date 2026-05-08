import api from './api';

export interface GradeDTO {
  id: number;
  studentId: number;
  classroomId: number;
  subjectId: number;
  period: string;
  score: number | null;
  gradedBy: number;
  updatedAt: string;
}

export interface SaveGradeDTO {
  studentId: number;
  classroomId: number;
  subjectId: number;
  period: string;
  score: number | null;
}

export const gradeService = {
  getGrades: (classroomId: number, subjectId: number, period: string): Promise<GradeDTO[]> =>
    api.get<GradeDTO[]>('/auth/grades', { params: { classroomId, subjectId, period } }).then(r => r.data),

  saveGrade: (dto: SaveGradeDTO): Promise<GradeDTO> =>
    api.put<GradeDTO>('/auth/grades', dto).then(r => r.data),
};

export const PERIODS = ['T1', 'T2', 'T3'] as const;
export type Period = typeof PERIODS[number];

export const PERIOD_LABELS: Record<string, string> = {
  T1: '1º Trimestre',
  T2: '2º Trimestre',
  T3: '3º Trimestre',
};
