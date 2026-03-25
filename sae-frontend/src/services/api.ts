import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for Offline support (simplified)
api.interceptors.request.use(async (config) => {
  if (!navigator.onLine) {
    // Logic to check local cache could go here
    console.warn('Offline mode: Using cached data if available');
  }
  return config;
});

export default api;
