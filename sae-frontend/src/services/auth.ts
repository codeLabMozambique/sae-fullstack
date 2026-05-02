import api from './api';

const TOKEN_KEY = 'sae_token';
const USER_KEY = 'sae_user';

export interface AuthUser {
  fullName: string;
  username: string;
  token: string;
  role: string;
  menus?: unknown[];
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface StudentSignupPayload {
  nTelefone: string;
  email: string;
  password: string;
  fullname: string;
  schoolId: number;
  classroomId: number;
  grade?: string;
  age?: number;
}

export interface ProfessorSignupPayload {
  nTelefone: string;
  email: string;
  password: string;
  fullname: string;
  schoolId: number;
  department?: string;
  specialization?: string;
  institutionalContact?: string;
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>('/auth/users/login', payload);
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data));
  return data;
}

export async function signupStudent(payload: StudentSignupPayload) {
  const { data } = await api.post('/auth/users/signup/student', payload);
  return data;
}

export async function signupProfessor(payload: ProfessorSignupPayload) {
  const { data } = await api.post('/auth/users/signup/professor', payload);
  return data;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
