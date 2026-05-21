import axios from 'axios';

const TOKEN_KEY = 'sae_token';
const USER_KEY  = 'sae_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(config => {
  if (!navigator.onLine) {
    console.warn('Offline mode: Using cached data if available');
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: clear session on 401 ───────────────────────────────
// Guard flag so that only the first 401 triggers the redirect — prevents
// a cascade of duplicate redirects when multiple requests fire simultaneously.
let sessionExpiredHandled = false;

api.interceptors.response.use(
  response => {
    sessionExpiredHandled = false; // reset on any success
    return response;
  },
  error => {
    if (error.response?.status === 401 && !sessionExpiredHandled) {
      sessionExpiredHandled = true;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Signal to the login page that the session expired (not a manual logout)
      sessionStorage.setItem('session_expired', '1');
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/app')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ── Gateway health check ──────────────────────────────────────────────────────
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
