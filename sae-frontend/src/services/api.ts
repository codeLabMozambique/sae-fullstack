import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (!navigator.onLine) {
    console.warn('Offline mode: Using cached data if available');
  }
  const token = localStorage.getItem('sae_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sae_token');
      localStorage.removeItem('sae_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
