import React, { useState, useRef, useEffect } from 'react';
import {
  Box, TextField, IconButton, Typography, Paper, Avatar,
  List, ListItem, Chip, CircularProgress, Alert, Tooltip, Divider,
} from '@mui/material';
import {
  Send as SendIcon, SmartToy as BotIcon, Person as UserIcon,
  DeleteOutline as ClearIcon, ContentCopy as CopyIcon,
  MenuBook as BookIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import VoiceRecorderButton from '../components/VoiceRecorderButton';
import { aiService } from '../services/aiService';

interface Message {
  text: string;
  isBot: boolean;
  sources?: string[];
  ts: Date;
}

const SESSION_KEY = 'sae_ai_session_id';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function newSessionId(): string {
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

const WELCOME: Message = {
  text: 'Olá! Sou o assistente de IA do SAE.\n\nPosso ajudar com:\n• Explicações de matéria (Matemática, Física, Química, História…)\n• Resumos de capítulos\n• Preparação para exames\n• Dúvidas sobre o currículo nacional moçambicano\n\nEscreve a tua dúvida académica ou usa os atalhos abaixo.',
  isBot: true,
  ts: new Date(),
};

const SUGGESTIONS = [
  'Explica a lei de Ohm com exemplos',
  'Resumo sobre a Independência de Moçambique',
  'Como resolver equações do 2.º grau?',
  'O que é a fotossíntese?',
];

interface BookContext {
  bookTitle?: string;
  subject?: string;
  initialMessage?: string;
}

const ChatIA: React.FC = () => {
  const location = useLocation();
  const bookCtx = (location.state as BookContext | null) ?? null;

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [activeBook, setActiveBook] = useState<string | null>(null);
  const sessionId = useRef(getSessionId());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bookCtxUsed = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Pre-fill from book context (only once per navigation)
  useEffect(() => {
    if (!bookCtx?.initialMessage || bookCtxUsed.current) return;
    bookCtxUsed.current = true;
    setActiveBook(bookCtx.bookTitle ?? null);
    setInput(bookCtx.initialMessage);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [bookCtx]);

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { text: msg, isBot: false, ts: new Date() }]);
    setLoading(true);
    try {
      const subject = bookCtx?.subject ?? undefined;
      const res = await aiService.sendMessage(msg, sessionId.current, subject);
      setMessages(prev => [...prev, { text: res.response, isBot: true, sources: res.sources, ts: new Date() }]);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Erro ao contactar o assistente. Verifica a ligação.';
      setError(detail);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClear = async () => {
    sessionId.current = newSessionId();
    setMessages([{ ...WELCOME, ts: new Date() }]);
    setError(null);
    setActiveBook(null);
    bookCtxUsed.current = false;
    try { await aiService.clearHistory(sessionId.current); } catch {}
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#00A651', width: 40, height: 40 }}><BotIcon /></Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>Assistente IA · SAE</Typography>
            <Typography variant="caption" color="text.secondary">Restrito a temas académicos</Typography>
          </Box>
        </Box>
        <Tooltip title="Nova conversa">
          <IconButton onClick={handleClear} size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ mb: activeBook ? 1.5 : 2 }} />

      {/* Book context banner */}
      {activeBook && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 2, py: 1.25, bgcolor: 'rgba(0,166,81,0.07)', border: '1px solid rgba(0,166,81,0.2)', borderRadius: 2 }}>
          <BookIcon sx={{ fontSize: 16, color: '#00A651', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: '#00A651', fontWeight: 600, flex: 1, lineHeight: 1.4 }}>
            Contexto: <Box component="span" sx={{ color: '#374151', fontWeight: 500 }}>{activeBook}</Box>
          </Typography>
          <Tooltip title="Remover contexto do livro">
            <IconButton size="small" onClick={() => setActiveBook(null)} sx={{ p: 0.25, color: '#9CA3AF', '&:hover': { color: '#374151' } }}>
              <ClearIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Messages */}
      <Paper elevation={0} sx={{ flexGrow: 1, mb: 2, p: 2, display: 'flex', flexDirection: 'column', overflowY: 'auto', bgcolor: '#F8FAFC', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <List disablePadding>
          {messages.map((msg, idx) => (
            <ListItem key={idx} disablePadding sx={{ flexDirection: msg.isBot ? 'row' : 'row-reverse', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
              <Avatar sx={{ bgcolor: msg.isBot ? '#001B33' : '#00A651', width: 34, height: 34, flexShrink: 0, mt: 0.5 }}>
                {msg.isBot ? <BotIcon sx={{ fontSize: 18 }} /> : <UserIcon sx={{ fontSize: 18 }} />}
              </Avatar>

              <Box sx={{ maxWidth: '78%' }}>
                <Paper elevation={0} sx={{
                  p: 2,
                  bgcolor: msg.isBot ? '#fff' : '#00A651',
                  color: msg.isBot ? 'text.primary' : '#fff',
                  borderRadius: msg.isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  border: msg.isBot ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  position: 'relative',
                }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                    {msg.text}
                  </Typography>
                  {msg.isBot && (
                    <Tooltip title={copied === idx ? 'Copiado!' : 'Copiar'}>
                      <IconButton size="small" onClick={() => handleCopy(msg.text, idx)}
                        sx={{ position: 'absolute', top: 4, right: 4, opacity: 0.3, '&:hover': { opacity: 1 }, color: 'text.secondary', p: 0.5 }}>
                        <CopyIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Paper>

                {msg.sources && msg.sources.length > 0 && (
                  <Box sx={{ mt: 0.75, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.disabled" sx={{ mr: 0.5, alignSelf: 'center' }}>Fontes:</Typography>
                    {msg.sources.map((s, i) => (
                      <Chip key={i} label={`📖 ${s}`} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.65rem', height: 22 }} />
                    ))}
                  </Box>
                )}

                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5, textAlign: msg.isBot ? 'left' : 'right', px: 0.5 }}>
                  {msg.isBot ? '🤖 IA' : '👤 Tu'} · {fmtTime(msg.ts)}
                </Typography>
              </Box>
            </ListItem>
          ))}

          {loading && (
            <ListItem disablePadding sx={{ flexDirection: 'row', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
              <Avatar sx={{ bgcolor: '#001B33', width: 34, height: 34, flexShrink: 0, mt: 0.5 }}><BotIcon sx={{ fontSize: 18 }} /></Avatar>
              <Paper elevation={0} sx={{ p: 2, bgcolor: '#fff', borderRadius: '4px 16px 16px 16px', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={14} sx={{ color: '#00A651' }} />
                <Typography variant="body2" color="text.secondary">A pensar…</Typography>
              </Paper>
            </ListItem>
          )}
        </List>
        <div ref={bottomRef} />
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Suggestions */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        {SUGGESTIONS.map(s => (
          <Chip key={s} label={s} onClick={() => handleSend(s)} clickable size="small" variant="outlined"
            sx={{ fontSize: '0.75rem', '&:hover': { bgcolor: 'rgba(0,166,81,0.08)', borderColor: '#00A651' } }} />
        ))}
      </Box>

      {/* Input */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', bgcolor: '#fff', p: 1.5, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
        <VoiceRecorderButton
          onTranscript={text => setInput(prev => prev ? prev + ' ' + text : text)}
          language="pt-PT"
          accentColor="#00A651"
          tooltip="Falar em vez de escrever"
        />
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          minRows={1}
          maxRows={5}
          placeholder="Coloca a tua dúvida académica…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          variant="standard"
          InputProps={{ disableUnderline: true }}
          sx={{ '& .MuiInputBase-root': { px: 1, py: 0.5, fontSize: '0.95rem' } }}
        />
        <Tooltip title={loading ? 'A aguardar resposta…' : 'Enviar (Enter)'}>
          <span>
            <IconButton onClick={() => handleSend()} disabled={loading || !input.trim()}
              sx={{
                bgcolor: loading || !input.trim() ? 'grey.200' : '#00A651',
                color: loading || !input.trim() ? 'grey.500' : '#fff',
                borderRadius: 2, width: 44, height: 44, transition: 'all 0.2s',
                '&:hover': { bgcolor: '#008C44', transform: 'translateY(-1px)' },
                '&.Mui-disabled': { bgcolor: 'grey.200', color: 'grey.400' },
              }}>
              <SendIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ChatIA;
