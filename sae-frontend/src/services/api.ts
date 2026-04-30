import axios from 'axios';

const TOKEN_KEY = 'sae_token';
const USER_KEY = 'sae_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  if (!navigator.onLine) {
    console.warn('Offline mode: Using cached data if available');
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/app')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const testBackendConnection = async () => {
  try {
    const response = await api.get('/auth/health');
    console.log('%c✅ BACKEND E FRONT CONECTADOS!', 'color: #4CAF50; font-weight: bold; font-size: 14px', '\nGateway repondeu com status:', response.status);
    return true;
  } catch (error: any) {
    if (error.response) {
      console.log('%c✅ BACKEND E FRONT CONECTADOS!', 'color: #4CAF50; font-weight: bold; font-size: 14px', '\nGateway repondeu com status:', error.response.status);
      return true;
    } else if (error.request) {
      console.error('%c❌ FALHA DE CONEXÃO COM BACKEND!', 'color: #F44336; font-weight: bold; font-size: 14px', '\nGateway esta indisponível (http://localhost:8080).');
      return false;
    } else {
      console.error('Erro de request:', error.message);
      return false;
    }
  }
};

export default api;
