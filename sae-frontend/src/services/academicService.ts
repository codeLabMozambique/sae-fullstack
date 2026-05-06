import api from './api';

export interface ProfessorDTO {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  schoolId?: number;
  department?: string;
  specialization?: string;
  institutionalContact?: string;
  online?: boolean;
}

export interface ClassLevelDTO {
  id?: number;
  name: string;
}

export interface SchoolDTO {
  id?: number;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface SubjectDTO {
  id?: number;
  name: string;
  description?: string;
  code?: string;
}

export interface ClassroomDTO {
  id?: number;
  name: string;
  schoolId: number;
  classLevelId: number;
  shift: string;
  academicYear: string;
}

export interface ProfessorAssignmentDTO {
  id?: number;
  professorId: number;
  classroomId: number;
  subjectId: number;
}

export const classLevelService = {
  findAll: () => api.get<ClassLevelDTO[]>('/academic/class-level/all').then(r => r.data),
  save: (dto: ClassLevelDTO) => api.post<ClassLevelDTO>('/academic/class-level/save', dto).then(r => r.data),
  update: (dto: ClassLevelDTO) => api.post<ClassLevelDTO>('/academic/class-level/update', dto).then(r => r.data),
  deactivate: (id: number) => api.post('/academic/class-level/deactivate', { id }),
};

export const schoolService = {
  findAll: () => api.get<SchoolDTO[]>('/academic/school/all').then(r => r.data),
  save: (dto: SchoolDTO) => api.post<SchoolDTO>('/academic/school/save', dto).then(r => r.data),
  update: (dto: SchoolDTO) => api.post<SchoolDTO>('/academic/school/update', dto).then(r => r.data),
  deactivate: (id: number) => api.post('/academic/school/deactivate', { id }),
};

export const subjectService = {
  findAll: () => api.get<SubjectDTO[]>('/academic/subject/all').then(r => r.data),
  save: (dto: SubjectDTO) => api.post<SubjectDTO>('/academic/subject/save', dto).then(r => r.data),
  update: (dto: SubjectDTO) => api.post<SubjectDTO>('/academic/subject/update', dto).then(r => r.data),
  deactivate: (id: number) => api.post('/academic/subject/deactivate', { id }),
};

export const classroomService = {
  findAll: () => api.get<ClassroomDTO[]>('/academic/classroom/all').then(r => r.data),
  save: (dto: ClassroomDTO) => api.post<ClassroomDTO>('/academic/classroom/save', dto).then(r => r.data),
  update: (dto: ClassroomDTO) => api.post<ClassroomDTO>('/academic/classroom/update', dto).then(r => r.data),
  deactivate: (id: number) => api.post('/academic/classroom/deactivate', { id }),
};

export const professorAssignmentService = {
  findAll: () => api.get<ProfessorAssignmentDTO[]>('/academic/professor-assignment/all').then(r => r.data),
  save: (dto: ProfessorAssignmentDTO) => api.post<ProfessorAssignmentDTO>('/academic/professor-assignment/save', dto).then(r => r.data),
  update: (dto: ProfessorAssignmentDTO) => api.post<ProfessorAssignmentDTO>('/academic/professor-assignment/update', dto).then(r => r.data),
  deactivate: (id: number) => api.post('/academic/professor-assignment/deactivate', { id }),
};

export const professorService = {
  findAll: () => api.get<ProfessorDTO[]>('/auth/users/professors').then(r => r.data),
};
