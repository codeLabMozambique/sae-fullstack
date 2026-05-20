import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  sources: string[];
}

export const aiService = {
  sendMessage: async (message: string, sessionId: string, subject?: string): Promise<ChatResponse> => {
    const { data } = await api.post('/ai/api/v1/chat', { message, session_id: sessionId, subject });
    return data;
  },

  clearHistory: async (sessionId: string): Promise<void> => {
    await api.delete(`/ai/api/v1/chat/history/${sessionId}`);
  },
};
