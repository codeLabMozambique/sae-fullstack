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

export interface ExtractTextResponse {
  text: string;
  filename: string;
  chars: number;
}

export const aiService = {
  sendMessage: async (
    message: string,
    sessionId: string,
    subject?: string,
    contentId?: string,
  ): Promise<ChatResponse> => {
    const { data } = await api.post('/ai/api/v1/chat', {
      message,
      session_id: sessionId,
      subject,
      content_id: contentId ?? undefined,
    });
    return data;
  },

  clearHistory: async (sessionId: string): Promise<void> => {
    await api.delete(`/ai/api/v1/chat/history/${sessionId}`);
  },

  extractFileText: async (file: File): Promise<ExtractTextResponse> => {
    const form = new FormData();
    form.append('file', file);
    // Não definir Content-Type manualmente — axios gera o boundary correcto automaticamente
    const { data } = await api.post('/ai/api/v1/chat/extract-text', form);
    return data;
  },
};
