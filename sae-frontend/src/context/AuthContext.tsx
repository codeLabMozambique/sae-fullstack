import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { loginUser, registerStudent, registerProfessor } from '../services/authService';
import type { LoginRequest, StudentRegisterRequest, ProfessorRegisterRequest, AuthResponse } from '../services/authService';

interface AuthUser {
  username: string;
  fullName: string;
  role: string;
  menus: any[];
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signupStudent: (data: StudentRegisterRequest) => Promise<void>;
  signupProfessor: (data: ProfessorRegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sae_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('sae_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = !!token && !!user;

  const login = async (data: LoginRequest) => {
    const response: AuthResponse = await loginUser(data);
    const authUser: AuthUser = {
      username: response.username,
      fullName: response.fullName,
      role: response.role,
      menus: response.menus,
    };
    localStorage.setItem('sae_token', response.token);
    localStorage.setItem('sae_user', JSON.stringify(authUser));
    setToken(response.token);
    setUser(authUser);
  };

  const signupStudent = async (data: StudentRegisterRequest) => {
    await registerStudent(data);
  };

  const signupProfessor = async (data: ProfessorRegisterRequest) => {
    await registerProfessor(data);
  };

  const logout = () => {
    localStorage.removeItem('sae_token');
    localStorage.removeItem('sae_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, signupStudent, signupProfessor, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
