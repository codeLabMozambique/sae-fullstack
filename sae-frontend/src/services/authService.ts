import api from './api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface StudentRegisterRequest {
  nTelefone: string;
  email: string;
  password: string;
  fullname: string;
  schoolId: number;
  classroomId: number;
  grade?: string;
  age?: number;
}

export interface ProfessorRegisterRequest {
  nTelefone: string;
  email: string;
  password: string;
  fullname: string;
  schoolId: number;
  department?: string;
  specialization?: string;
  institutionalContact?: string;
}

export interface MenuItemDTO {
  code: string;
  label: string;
  routerLink: string;
}

export interface MenuDTO {
  code: string;
  label: string;
  routerLink: string;
  items: MenuItemDTO[];
}

export interface AuthResponse {
  token: string;
  username: string;
  fullName: string;
  role: string;
  menus: MenuDTO[];
}

export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/users/login', data);
  return response.data;
}

export async function registerStudent(data: StudentRegisterRequest): Promise<any> {
  const response = await api.post('/auth/users/signup/student', data);
  return response.data;
}

export async function registerProfessor(data: ProfessorRegisterRequest): Promise<any> {
  const response = await api.post('/auth/users/signup/professor', data);
  return response.data;
}
