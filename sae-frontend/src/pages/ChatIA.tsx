import React, { useState, useRef, useEffect } from 'react';
import {
  Box, TextField, IconButton, Typography, Paper, Avatar,
  List, ListItem, Chip, CircularProgress, Tooltip, Divider,
} from '@mui/material';
import {
  Send as SendIcon, SmartToy as BotIcon, Person as UserIcon,
  DeleteOutline as ClearIcon, ContentCopy as CopyIcon,
  MenuBook as BookIcon, AttachFile as AttachIcon,
  ReplayRounded as RetryIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import VoiceRecorderButton from '../components/VoiceRecorderButton';
import { aiService } from '../services/aiService';
import type { ChatResponse } from '../services/aiService';

interface Message {
  text: string;
  isBot: boolean;
  isError?: boolean;
  sources?: string[];
  ts: Date;
  attachment?: string;
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
  text: 'Olá! Sou o **Assistente IA** do SAE.\n\nPosso ajudar com:\n- Explicações de matéria (Matemática, Física, Química, História…)\n- Resumos e sínteses de capítulos\n- Preparação para exames nacionais\n- Dúvidas sobre o currículo moçambicano\n\nEscreve a tua dúvida académica, usa os atalhos abaixo, ou anexa um ficheiro PDF.',
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
  contentId?: string;
  bookTitle?: string;
  subject?: string;
  initialMessage?: string;
}

// Markdown styles for bot messages
const mdSx = {
  '& p': { m: 0, fontSize: '0.875rem', lineHeight: 1.85, '& + p': { mt: 0.75 } },
  '& ul, & ol': { pl: 2.5, my: 0.5, fontSize: '0.875rem' },
  '& li': { lineHeight: 1.85, mb: 0.2 },
  '& h1': { fontSize: '1.05rem', fontWeight: 700, mt: 1.5, mb: 0.75, lineHeight: 1.4 },
  '& h2': { fontSize: '0.95rem', fontWeight: 700, mt: 1.25, mb: 0.5, lineHeight: 1.4 },
  '& h3': { fontSize: '0.875rem', fontWeight: 700, mt: 1, mb: 0.5, lineHeight: 1.4 },
  '& strong': { fontWeight: 700 },
  '& em': { fontStyle: 'italic' },
  '& code': {
    bgcolor: 'rgba(0,0,0,0.05)',
    px: 0.75, py: 0.15,
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontFamily: '"Fira Code", "Consolas", monospace',
  },
  '& pre': {
    bgcolor: 'rgba(0,0,0,0.04)',
    p: 1.5, borderRadius: 1.5,
    overflow: 'auto', my: 1,
    border: '1px solid rgba(0,0,0,0.07)',
    '& code': { bgcolor: 'transparent', p: 0 },
  },
  '& blockquote': {
    borderLeft: '3px solid #00A651',
    pl: 1.5, ml: 0, my: 0.75,
    color: 'text.secondary',
  },
  '& table': { borderCollapse: 'collapse', width: '100%', my: 1, fontSize: '0.8rem' },
  '& th, & td': { border: '1px solid rgba(0,0,0,0.12)', px: 1, py: 0.5 },
  '& th': { bgcolor: 'rgba(0,0,0,0.04)', fontWeight: 700 },
  '& hr': { border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', my: 1 },
};

const BotContent: React.FC<{ text: string; isError?: boolean }> = ({ text, isError }) => {
  if (isError) {
    return (
      <Typography variant="body2" sx={{ color: 'warning.dark', lineHeight: 1.75 }}>
        {text}
      </Typography>
    );
  }
  return (
    <Box sx={mdSx}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </Box>
  );
};

const ChatIA: React.FC = () => {
  const location = useLocation();
  const bookCtx = (location.state as BookContext | null) ?? null;

  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [activeBook, setActiveBook] = useState<string | null>(null);
  const [activeContentId, setActiveContentId] = useState<string | null>(null);

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [extractingFile, setExtractingFile] = useState(false);
  const [fileContext, setFileContext] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sessionId = useRef(getSessionId());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bookCtxUsed = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!bookCtx?.initialMessage || bookCtxUsed.current) return;
    bookCtxUsed.current = true;
    setActiveBook(bookCtx.bookTitle ?? null);
    setActiveContentId(bookCtx.contentId ?? null);
    setInput(bookCtx.initialMessage);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [bookCtx]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setAttachedFile(file);
    setExtractingFile(true);
    try {
      const result = await aiService.extractFileText(file);
      setFileContext(result.text);
    } catch {
      setMessages(prev => [...prev, {
        text: 'Não foi possível extrair o texto do ficheiro. Usa um PDF de texto (não escaneado).',
        isBot: true, isError: true, ts: new Date(),
      }]);
      setAttachedFile(null);
      setFileContext(null);
    } finally {
      setExtractingFile(false);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setFileContext(null);
  };

  // Sends to AI with one silent retry before surfacing an error
  const callAI = async (
    msg: string, sid: string, subject?: string, contentId?: string,
  ): Promise<ChatResponse> => {
    try {
      return await aiService.sendMessage(msg, sid, subject, contentId);
    } catch {
      await new Promise(r => setTimeout(r, 2000));
      return await aiService.sendMessage(msg, sid, subject, contentId);
    }
  };

  const handleSend = async (text?: string) => {
    const rawMsg = (text ?? input).trim();
    if ((!rawMsg && !fileContext) || loading) return;

    let finalMsg = rawMsg;
    if (fileContext && !text) {
      const label = attachedFile?.name ?? 'ficheiro';
      finalMsg = rawMsg
        ? `${rawMsg}\n\n[Conteúdo de "${label}":\n${fileContext}]`
        : `[Conteúdo de "${label}":\n${fileContext}]`;
    }

    const displayMsg = rawMsg || `📎 ${attachedFile?.name}`;
    const attachmentName = !rawMsg && attachedFile ? attachedFile.name : undefined;

    setInput('');
    setAttachedFile(null);
    setFileContext(null);
    setMessages(prev => [...prev, { text: displayMsg, isBot: false, ts: new Date(), attachment: attachmentName }]);
    setLoading(true);

    try {
      const subject = bookCtx?.subject ?? undefined;
      const contentId = activeContentId ?? undefined;
      const res = await callAI(finalMsg, sessionId.current, subject, contentId);
      setMessages(prev => [...prev, { text: res.response, isBot: true, sources: res.sources, ts: new Date() }]);
    } catch {
      setMessages(prev => [...prev, {
        text: 'Não foi possível obter resposta neste momento. Verifica a ligação e tenta novamente.',
        isBot: true, isError: true, ts: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClear = async () => {
    sessionId.current = newSessionId();
    setMessages([{ ...WELCOME, ts: new Date() }]);
    setActiveBook(null);
    setActiveContentId(null);
    setAttachedFile(null);
    setFileContext(null);
    bookCtxUsed.current = false;
    try { await aiService.clearHistory(sessionId.current); } catch {}
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const canSend = !loading && (input.trim().length > 0 || (fileContext !== null && !extractingFile));

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#00A651', width: 42, height: 42, boxShadow: '0 0 0 3px rgba(0,166,81,0.15)' }}>
            <BotIcon sx={{ fontSize: 22 }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, fontSize: '1rem' }}>
              Assistente IA · SAE
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#00A651' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Online · Académico
              </Typography>
            </Box>
          </Box>
        </Box>
        <Tooltip title="Nova conversa">
          <IconButton onClick={handleClear} size="small"
            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ mb: activeBook ? 1.5 : 2 }} />

      {/* Book context banner */}
      {activeBook && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 2, py: 1.25, bgcolor: 'rgba(0,166,81,0.06)', border: '1px solid rgba(0,166,81,0.18)', borderRadius: 2 }}>
          <BookIcon sx={{ fontSize: 15, color: '#00A651', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: '#00A651', fontWeight: 600, flex: 1, lineHeight: 1.4 }}>
            Contexto:&nbsp;
            <Box component="span" sx={{ color: '#374151', fontWeight: 500 }}>{activeBook}</Box>
            {activeContentId && (
              <Box component="span" sx={{ color: '#9CA3AF', fontSize: '0.6rem', ml: 1 }}>· conteúdo indexado</Box>
            )}
          </Typography>
          <Tooltip title="Remover contexto do livro">
            <IconButton size="small" onClick={() => { setActiveBook(null); setActiveContentId(null); }}
              sx={{ p: 0.25, color: '#9CA3AF', '&:hover': { color: '#374151' } }}>
              <ClearIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Messages */}
      <Paper elevation={0} sx={{
        flexGrow: 1, mb: 2, p: 2,
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        bgcolor: '#F8FAFC',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}>
        <List disablePadding>
          {messages.map((msg, idx) => (
            <ListItem key={idx} disablePadding sx={{
              flexDirection: msg.isBot ? 'row' : 'row-reverse',
              alignItems: 'flex-start',
              gap: 1.5, mb: 2,
            }}>
              <Avatar sx={{
                bgcolor: msg.isBot ? (msg.isError ? '#FFF3E0' : '#001B33') : '#00A651',
                width: 34, height: 34, flexShrink: 0, mt: 0.5,
                border: msg.isError ? '1px solid #FFB74D' : 'none',
              }}>
                {msg.isBot
                  ? (msg.isError
                    ? <RetryIcon sx={{ fontSize: 17, color: '#F57C00' }} />
                    : <BotIcon sx={{ fontSize: 18 }} />)
                  : <UserIcon sx={{ fontSize: 18 }} />
                }
              </Avatar>

              <Box sx={{ maxWidth: '78%' }}>
                <Paper elevation={0} sx={{
                  p: 2,
                  bgcolor: msg.isBot
                    ? (msg.isError ? '#FFF8F0' : '#fff')
                    : '#00A651',
                  color: msg.isBot ? 'text.primary' : '#fff',
                  borderRadius: msg.isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  border: msg.isBot
                    ? (msg.isError ? '1px solid rgba(255,183,77,0.35)' : '1px solid rgba(0,0,0,0.05)')
                    : 'none',
                  position: 'relative',
                }}>
                  {msg.attachment && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, opacity: 0.8 }}>
                      <AttachIcon sx={{ fontSize: 14 }} />
                      <Typography variant="caption" sx={{ fontStyle: 'italic' }}>{msg.attachment}</Typography>
                    </Box>
                  )}

                  {msg.isBot
                    ? <BotContent text={msg.text} isError={msg.isError} />
                    : <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>{msg.text}</Typography>
                  }

                  {msg.isBot && !msg.isError && (
                    <Tooltip title={copied === idx ? 'Copiado!' : 'Copiar resposta'}>
                      <IconButton size="small" onClick={() => handleCopy(msg.text, idx)}
                        sx={{
                          position: 'absolute', top: 6, right: 6,
                          opacity: 0.25, '&:hover': { opacity: 1 },
                          color: 'text.secondary', p: 0.5,
                        }}>
                        <CopyIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Paper>

                {msg.sources && msg.sources.length > 0 && (
                  <Box sx={{ mt: 0.75, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.disabled" sx={{ mr: 0.5, alignSelf: 'center' }}>
                      Fontes:
                    </Typography>
                    {msg.sources.map((s, i) => (
                      <Chip key={i} label={`📖 ${s}`} size="small" variant="outlined" color="primary"
                        sx={{ fontSize: '0.65rem', height: 22 }} />
                    ))}
                  </Box>
                )}

                <Typography variant="caption" color="text.disabled" sx={{
                  display: 'block', mt: 0.5,
                  textAlign: msg.isBot ? 'left' : 'right',
                  px: 0.5, fontSize: '0.65rem', letterSpacing: 0.2,
                }}>
                  {msg.isBot ? 'IA' : 'Tu'} · {fmtTime(msg.ts)}
                </Typography>
              </Box>
            </ListItem>
          ))}

          {loading && (
            <ListItem disablePadding sx={{ flexDirection: 'row', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
              <Avatar sx={{ bgcolor: '#001B33', width: 34, height: 34, flexShrink: 0, mt: 0.5 }}>
                <BotIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Paper elevation={0} sx={{
                px: 2.5, py: 1.75,
                bgcolor: '#fff',
                borderRadius: '4px 16px 16px 16px',
                border: '1px solid rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', gap: 1.5,
              }}>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  {[0, 0.2, 0.4].map(delay => (
                    <Box key={delay} sx={{
                      width: 7, height: 7, borderRadius: '50%', bgcolor: '#00A651',
                      animation: 'bounce 1.2s ease-in-out infinite',
                      animationDelay: `${delay}s`,
                      '@keyframes bounce': {
                        '0%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
                        '50%': { transform: 'translateY(-5px)', opacity: 1 },
                      },
                    }} />
                  ))}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  A processar…
                </Typography>
              </Paper>
            </ListItem>
          )}
        </List>
        <div ref={bottomRef} />
      </Paper>

      {/* Attached file preview */}
      {(attachedFile || extractingFile) && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1, mb: 1,
          px: 1.5, py: 0.75,
          bgcolor: 'rgba(0,166,81,0.05)',
          border: '1px solid rgba(0,166,81,0.18)',
          borderRadius: 2,
        }}>
          {extractingFile
            ? <>
                <CircularProgress size={13} sx={{ color: '#00A651' }} />
                <Typography variant="caption" color="#00A651">A extrair texto do ficheiro…</Typography>
              </>
            : <>
                <AttachIcon sx={{ fontSize: 15, color: '#00A651' }} />
                <Typography variant="caption" sx={{ flex: 1, color: '#374151', fontWeight: 500 }}>
                  {attachedFile?.name}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {fileContext ? `${fileContext.length} caracteres` : ''}
                </Typography>
                <Tooltip title="Remover anexo">
                  <IconButton size="small" onClick={removeAttachment} sx={{ p: 0.25, color: '#9CA3AF' }}>
                    <ClearIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </>
          }
        </Box>
      )}

      {/* Suggestions */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        {SUGGESTIONS.map(s => (
          <Chip key={s} label={s} onClick={() => handleSend(s)} clickable size="small" variant="outlined"
            sx={{
              fontSize: '0.72rem',
              borderColor: 'rgba(0,0,0,0.15)',
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(0,166,81,0.06)', borderColor: '#00A651', color: '#00A651' },
              transition: 'all 0.2s',
            }} />
        ))}
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md"
        title="Anexar ficheiro PDF ou texto"
        aria-label="Anexar ficheiro PDF ou texto"
        className="sae-hidden-input"
        onChange={handleFileSelect}
      />

      {/* Input bar */}
      <Box sx={{
        display: 'flex', gap: 1, alignItems: 'flex-end',
        bgcolor: '#fff', p: 1.5,
        borderRadius: 3,
        boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
        border: '1px solid',
        borderColor: 'divider',
      }}>
        <VoiceRecorderButton
          onTranscript={text => setInput(prev => prev ? prev + ' ' + text : text)}
          language="pt-PT"
          accentColor="#00A651"
          tooltip="Falar em vez de escrever"
        />
        <Tooltip title="Anexar PDF ou ficheiro de texto">
          <IconButton
            size="small"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || extractingFile}
            sx={{ color: attachedFile ? '#00A651' : 'text.secondary', flexShrink: 0 }}
          >
            <AttachIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <TextField
          inputRef={inputRef}
          fullWidth multiline
          minRows={1} maxRows={5}
          placeholder={attachedFile ? 'Pergunta sobre o ficheiro (opcional)…' : 'Coloca a tua dúvida académica…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
          }}
          variant="standard"
          InputProps={{ disableUnderline: true }}
          sx={{ '& .MuiInputBase-root': { px: 1, py: 0.5, fontSize: '0.925rem' } }}
        />
        <Tooltip title={loading ? 'A aguardar resposta…' : 'Enviar (Enter)'}>
          <span>
            <IconButton
              onClick={() => handleSend()}
              disabled={!canSend}
              sx={{
                bgcolor: canSend ? '#00A651' : 'grey.200',
                color: canSend ? '#fff' : 'grey.400',
                borderRadius: 2, width: 42, height: 42,
                transition: 'all 0.2s',
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
