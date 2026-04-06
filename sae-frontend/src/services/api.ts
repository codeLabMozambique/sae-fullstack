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

export const testBackendConnection = async () => {
  try {
    // Attempt to hit the auth service through the api gateway.
    // Even if it returns 404 or 401, a status code response means the gateway is running and connected!
    const response = await api.get('/auth/health');
    console.log('%c✅ BACKEND E FRONT CONECTADOS!', 'color: #4CAF50; font-weight: bold; font-size: 14px', '\nGateway repondeu com status:', response.status);
    return true;
  } catch (error: any) {
    if (error.response) {
      // The gateway responded but with an error status code... STILL SUCCESS in terms of connection!
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
}

export default api;
