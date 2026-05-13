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
  professorCode?: string;
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
  classLevelId?: number;
  schoolId?: number;
}

export interface ClassroomDTO {
  id?: number;
  name: string;
  schoolId: number;
  classLevelId: number;
  shift: string;
  academicYear: string;
  directorId?: number | null;
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
  findBySchool: (schoolId: number) => api.get<SubjectDTO[]>(`/academic/subject/by-school/${schoolId}`).then(r => r.data),
  findByClassLevel: (classLevelId: number) => api.get<SubjectDTO[]>(`/academic/subject/by-class-level/${classLevelId}`).then(r => r.data),
  findBySchoolAndClassLevel: (schoolId: number, classLevelId: number) =>
    api.get<SubjectDTO[]>(`/academic/subject/by-school/${schoolId}/by-class-level/${classLevelId}`).then(r => r.data),
  save: (dto: SubjectDTO) => api.post<SubjectDTO>('/academic/subject/save', dto).then(r => r.data),
  update: (dto: SubjectDTO) => api.post<SubjectDTO>('/academic/subject/update', dto).then(r => r.data),
  deactivate: (id: number) => api.post('/academic/subject/deactivate', { id }),
};

export const classroomService = {
  findAll: () => api.get<ClassroomDTO[]>('/academic/classroom/all').then(r => r.data),
  findBySchool: (schoolId: number) => api.get<ClassroomDTO[]>(`/academic/classroom/by-school/${schoolId}`).then(r => r.data),
  findByDirector: (directorId: number) => api.get<ClassroomDTO>(`/academic/classroom/by-director`, { params: { directorId } }).then(r => r.data),
  save: (dto: ClassroomDTO) => api.post<ClassroomDTO>('/academic/classroom/save', dto).then(r => r.data),
  update: (dto: ClassroomDTO) => api.post<ClassroomDTO>('/academic/classroom/update', dto).then(r => r.data),
  deactivate: (id: number) => api.post('/academic/classroom/deactivate', { id }),
  setDirector: (classroomId: number, directorId: number | null) =>
    api.put<ClassroomDTO>('/academic/classroom/set-director', { classroomId, directorId }).then(r => r.data),
};

export const professorAssignmentService = {
  findAll: () => api.get<ProfessorAssignmentDTO[]>('/academic/professor-assignment/all').then(r => r.data),
  save: (dto: ProfessorAssignmentDTO) => api.post<ProfessorAssignmentDTO>('/academic/professor-assignment/save', dto).then(r => r.data),
  update: (dto: ProfessorAssignmentDTO) => api.post<ProfessorAssignmentDTO>('/academic/professor-assignment/update', dto).then(r => r.data),
  deactivate: (id: number) => api.post('/academic/professor-assignment/deactivate', { id }),
  findByProfessor: (professorId: number) =>
    api.get<ProfessorAssignmentDetailDTO[]>(`/academic/professor-assignment/professor/${professorId}`).then(r => r.data),
  findByClassroom: (classroomId: number) =>
    api.get<ProfessorAssignmentDetailDTO[]>(`/academic/professor-assignment/classroom/${classroomId}`).then(r => r.data),
};

export const professorService = {
  findAll: () => api.get<ProfessorDTO[]>('/auth/users/professors').then(r => r.data),
};


export interface ProfessorAssignmentDetailDTO {
  id: number;
  professorId: number;
  classroomId: number;
  classroomName: string;
  classroomShift: string;
  classroomAcademicYear: string;
  classLevelName: string;
  subjectId: number;
  subjectName: string;
}


export interface StudentProfileDTO {
  userId: number;
  fullName: string;
  username: string;
  email?: string;
  schoolId?: number;
  classroomId?: number;
  grade?: string;
  age?: number;
  enrollmentCode?: string;
}

export const studentService = {
  findAll: () => api.get<StudentProfileDTO[]>('/auth/users/students').then(r => r.data),
  findByClassroom: (classroomId: number) =>
    api.get<StudentProfileDTO[]>('/auth/users/students-by-classroom', { params: { classroomId } }).then(r => r.data),
  findBySchool: (schoolId: number) =>
    api.get<StudentProfileDTO[]>('/auth/users/students-by-school', { params: { schoolId } }).then(r => r.data),
  findByUsername: (username: string) =>
    api.get<StudentProfileDTO>('/auth/users/student-profile-by-username', { params: { username } }).then(r => r.data),
  assignToClassroom: (userId: number, classroomId: number | null) =>
    api.put<StudentProfileDTO>('/auth/users/student-profile', { userId, classroomId }).then(r => r.data),
};

export interface GradeDTO {
  id?: number;
  studentId: number;
  studentName?: string;
  studentUsername?: string;
  classroomId: number;
  subjectId: number;
  academicYear: string;
  nota1?: number | null;
  nota2?: number | null;
  nota3?: number | null;
  acp1?: number | null;
  acp2?: number | null;
  miniteste1?: number | null;
  miniteste2?: number | null;
  exameFinal?: number | null;
  media?: number | null;
}

export const gradeService = {
  findByClassroomAndSubject: (classroomId: number, subjectId: number, academicYear: string) =>
    api.get<GradeDTO[]>('/academic/grades', { params: { classroomId, subjectId, academicYear } }).then(r => r.data),
  findByClassroom: (classroomId: number, academicYear: string) =>
    api.get<GradeDTO[]>('/academic/grades', { params: { classroomId, academicYear } }).then(r => r.data),
  save: (dto: GradeDTO) => api.post<GradeDTO>('/academic/grades', dto).then(r => r.data),
};
