import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Typography, Stack, Paper, Chip, Avatar,
  Button, Dialog, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Divider, IconButton, Alert, Tooltip, Badge,
  InputAdornment, useTheme, useMediaQuery, Drawer,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SendIcon from '@mui/icons-material/Send';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QuizIcon from '@mui/icons-material/Quiz';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useAuth } from '../../context/AuthContext';
import { forumService } from '../../services/forumService';
import { professorAssignmentService } from '../../services/academicService';
import api from '../../services/api';
import type { ForumQuestion, DisciplinaEnum, ExpertAnswer, CollaborativeAnswer } from '../../types/forum';
import { DISCIPLINA_LABELS, DISCIPLINA_COLOR, DISCIPLINA_EMOJI } from '../../types/forum';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LS_SEEN_KEY = 'forum_last_seen';

function getSeenMap(): Record<number, string> {
  try { return JSON.parse(localStorage.getItem(LS_SEEN_KEY) ?? '{}'); }
  catch { return {}; }
}

function markSeen(id: number) {
  const map = getSeenMap();
  map[id] = new Date().toISOString();
  localStorage.setItem(LS_SEEN_KEY, JSON.stringify(map));
}

function hasUnread(q: ForumQuestion): boolean {
  const allAnswers = [...(q.expertAnswers ?? []), ...(q.collaborativeAnswers ?? [])];
  if (allAnswers.length === 0) return false;
  const lastSeen = getSeenMap()[q.id];
  if (!lastSeen) return true;
  const latestAt = allAnswers.reduce((max, a) =>
    new Date(a.createdAt) > new Date(max) ? a.createdAt : max,
    allAnswers[0].createdAt
  );
  return new Date(latestAt) > new Date(lastSeen);
}

function normalizeStr(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const DISCIPLINA_KEYS: DisciplinaEnum[] = [
  'MATEMATICA', 'FISICA', 'QUIMICA', 'BIOLOGIA', 'PORTUGUES',
  'HISTORIA', 'GEOGRAFIA', 'INGLES', 'FILOSOFIA', 'INFORMATICA', 'GERAL',
];

function subjectToDisciplina(name: string): DisciplinaEnum | null {
  const n = normalizeStr(name);
  for (const key of DISCIPLINA_KEYS) {
    const k = normalizeStr(key);
    if (n.includes(k) || k.includes(n)) return key;
  }
  return null;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

interface AttachmentInfo { id: string; originalName: string; contentType: string; size: number }

async function uploadAttachment(file: File, context: string, contextId?: string): Promise<AttachmentInfo> {
  const form = new FormData();
  form.append('file', file);
  if (context) form.append('context', context);
  if (contextId) form.append('contextId', contextId);
  const res = await api.post<AttachmentInfo>('/content/api/user/uploads', form);
  return res.data;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

const SIDEBAR_W = 340;
const DETAIL_W = 300;

// ─── Sidebar conversation item ─────────────────────────────────────────────────

function SidebarItem({ q, active, onClick }: { q: ForumQuestion; active: boolean; onClick: () => void }) {
  const isExpert = q.questionType === 'ESPECIALIZADO';
  const accent = isExpert ? '#2563EB' : '#10B981';
  const allAnswers = [...(q.expertAnswers ?? []), ...(q.collaborativeAnswers ?? [])];
  const lastMsg = allAnswers.slice(-1)[0]?.conteudo ?? q.descricao;
  const preview = lastMsg === '_' ? 'Aguardando início...' : lastMsg;
  const unread = hasUnread(q);

  return (
    <Box
      onClick={onClick}
      sx={{
        px: 2, py: 1.8, cursor: 'pointer',
        bgcolor: active ? 'rgba(0,0,0,0.04)' : 'transparent',
        position: 'relative',
        transition: 'all .2s ease',
        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
        '&::before': active ? {
          content: '""',
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 4,
          bgcolor: accent,
          borderRadius: '0 4px 4px 0'
        } : {}
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ position: 'relative' }}>
          <Avatar sx={{ 
            width: 50, height: 50, 
            bgcolor: isExpert ? '#DBEAFE' : '#D1FAE5', 
            color: accent,
            border: `1.5px solid ${active ? accent : 'transparent'}`,
            transition: 'border 0.3s'
          }}>
            {isExpert ? <SchoolIcon /> : <GroupsIcon />}
          </Avatar>
          {q.status === 'ABERTA' && (
            <Box sx={{ 
              position: 'absolute', bottom: 2, right: 2, 
              width: 12, height: 12, borderRadius: '50%', 
              bgcolor: '#10B981', border: '2px solid white' 
            }} />
          )}
        </Box>
        
        <Box flex={1} minWidth={0}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.4}>
            <Typography variant="body2" fontWeight={700} noWrap sx={{ color: '#1E293B', fontSize: 14 }}>
              {q.titulo}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, fontWeight: 500 }}>
              {timeAgo(q.createdAt)}
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="caption" sx={{ 
              color: '#64748B', 
              fontSize: 12, 
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flex: 1,
              fontWeight: active ? 600 : 400
            }}>
              {preview}
            </Typography>
            {isExpert && <Chip label="Prof" size="small" sx={{ height: 16, fontSize: 9, bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700 }} />}
            {unread && (
              <Box sx={{
                width: 10, height: 10, borderRadius: '50%',
                bgcolor: '#EF4444', border: '1.5px solid white', flexShrink: 0,
              }} />
            )}
            {!unread && allAnswers.length > 0 && (
              <Box sx={{
                px: 0.7, py: 0.2, borderRadius: 10,
                bgcolor: accent + '30', color: accent,
                fontSize: 10, fontWeight: 900, minWidth: 16, textAlign: 'center',
              }}>
                {allAnswers.length}
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

// ─── Chat messages ─────────────────────────────────────────────────────────────

function ChatMessages({
  q, currentUser, isOwner, onAccept, accepting, onRefresh,
}: {
  q: ForumQuestion; currentUser: string; isOwner: boolean;
  onAccept: (id: number) => void; accepting: number | null;
  onRefresh?: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const isExpert = q.questionType === 'ESPECIALIZADO';
  const ownBg = isExpert ? '#2563EB' : '#10B981';
  const ownColor = 'white';
  const [allProfOffline, setAllProfOffline] = useState(false);
  const [requestingAI, setRequestingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  const messages = [
    ...(q.expertAnswers ?? []),
    ...(q.collaborativeAnswers ?? []),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    if (messages.length > 0) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  useEffect(() => {
    if (!isExpert || messages.length > 0) { setAllProfOffline(false); return; }
    forumService.getProfessorsByDisciplina(q.disciplina)
      .then(profs => setAllProfOffline(profs.length > 0 && profs.every(p => !p.online)))
      .catch(() => {});
  }, [q.id, isExpert, messages.length]);

  const handleAskAI = async () => {
    setRequestingAI(true); setAiError('');
    try {
      await forumService.requestAIAnswer(q.id);
      onRefresh?.();
    } catch (e: any) {
      setAiError(e?.response?.data?.message ?? 'Não foi possível contactar o assistente IA');
    } finally { setRequestingAI(false); }
  };

  return (
    <Box sx={{ 
      flex: 1, overflowY: 'auto', p: 3, 
      display: 'flex', flexDirection: 'column', gap: 2, 
      bgcolor: '#F1F5F9', // WhatsApp light mode bg
      backgroundImage: 'radial-gradient(#CBD5E1 0.5px, transparent 0.5px)', // Subtle pattern
      backgroundSize: '20px 20px'
    }}>
      {/* Date Divider (Simplified for first message) */}
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <Chip 
          label={new Date(q.createdAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })} 
          size="small" 
          sx={{ bgcolor: 'rgba(255,255,255,0.8)', color: '#64748B', fontWeight: 700, fontSize: 11, backdropFilter: 'blur(4px)' }} 
        />
      </Box>

      {/* Original question */}
      {q.descricao && q.descricao !== '_' && (
        <Stack alignItems="flex-end">
          <Paper sx={{
            p: '8px 14px', maxWidth: '85%',
            borderRadius: '16px 16px 2px 16px',
            bgcolor: ownBg, color: ownColor,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            position: 'relative'
          }}>
            <Typography sx={{ fontSize: 14.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', fontWeight: 500 }}>{q.descricao}</Typography>
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.8, fontSize: 10, fontWeight: 700 }}>
              {new Date(q.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Paper>
        </Stack>
      )}

      {messages.map((a, idx) => {
        const isOwn = a.answeredBy === currentUser;
        const expertA = 'accepted' in a ? (a as ExpertAnswer) : null;
        const collabA = !expertA ? (a as CollaborativeAnswer) : null;
        const accepted = expertA?.accepted;

        return (
          <Stack key={a.id} alignItems={isOwn ? 'flex-end' : 'flex-start'}>
            {!isOwn && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5, ml: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: 11 }}>
                  {a.aiGenerated ? '🤖 Assistente IA' : a.answeredBy}
                </Typography>
                {expertA && !a.aiGenerated && <Chip label="Professor" size="small" sx={{ height: 14, fontSize: 8, bgcolor: '#DBEAFE', color: '#2563EB', fontWeight: 800 }} />}
                {a.aiGenerated && <Chip label="IA" size="small" sx={{ height: 14, fontSize: 8, bgcolor: '#E0E7FF', color: '#4F46E5', fontWeight: 800 }} />}
              </Stack>
            )}

            <Paper sx={{
              p: '8px 14px',
              maxWidth: '85%',
              borderRadius: isOwn ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
              bgcolor: isOwn ? ownBg : 'white',
              color: isOwn ? ownColor : '#1E293B',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              border: accepted ? `2px solid #10B981` : 'none',
              position: 'relative'
            }}>
              <Typography sx={{ fontSize: 14.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', fontWeight: 500 }}>{a.conteudo}</Typography>
              
              {a.attachmentId && (
                <Box sx={{ 
                  mt: 1, p: 1, borderRadius: 1.5, 
                  bgcolor: isOwn ? 'rgba(0,0,0,0.1)' : '#F1F5F9',
                  display: 'flex', alignItems: 'center', gap: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: isOwn ? 'rgba(0,0,0,0.15)' : '#E2E8F0' }
                }} component="a" href={`/content/api/user/uploads/${a.attachmentId}`} target="_blank">
                  <InsertDriveFileIcon sx={{ fontSize: 18, color: isOwn ? 'white' : '#64748B' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: isOwn ? 'white' : '#1E293B' }}>Ver Anexo</Typography>
                </Box>
              )}

              <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" mt={0.5}>
                {accepted && <CheckCircleIcon sx={{ fontSize: 12, color: isOwn ? 'white' : '#10B981' }} />}
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: 10, fontWeight: 700 }}>
                  {new Date(a.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Stack>
            </Paper>

            {/* Actions area below bubble */}
            {(accepted || (collabA?.validationStatus) || (isOwner && expertA && !accepted && q.status === 'ABERTA')) && (
              <Stack direction="row" spacing={0.5} mt={0.5} sx={{ px: 1 }}>
                {collabA?.validationStatus && (
                  <Chip
                    label={collabA.validationStatus === 'VALIDADA' ? 'Validada' : 'Pendente'}
                    size="small"
                    sx={{ 
                      height: 16, fontSize: 9, fontWeight: 800,
                      bgcolor: collabA.validationStatus === 'VALIDADA' ? '#D1FAE5' : '#FEF3C7',
                      color: collabA.validationStatus === 'VALIDADA' ? '#065F46' : '#92400E'
                    }}
                  />
                )}
                {isOwner && expertA && !accepted && q.status === 'ABERTA' && (
                  <Button
                    size="small"
                    onClick={() => onAccept(a.id)}
                    disabled={accepting === a.id}
                    sx={{ 
                      height: 18, fontSize: 9, fontWeight: 800, 
                      textTransform: 'none', color: '#2563EB',
                      bgcolor: '#EFF6FF', '&:hover': { bgcolor: '#DBEAFE' }
                    }}
                  >
                    {accepting === a.id ? 'A processar...' : 'Aceitar Solução'}
                  </Button>
                )}
              </Stack>
            )}
          </Stack>
        );
      })}

      {/* AI button — shown when expert room has no replies and all professors offline */}
      {isExpert && messages.length === 0 && allProfOffline && q.status === 'ABERTA' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
          {aiError && <Alert severity="error" sx={{ mb: 1, width: '100%', borderRadius: 2 }}>{aiError}</Alert>}
          <Typography variant="caption" color="text.secondary" mb={1} textAlign="center">
            O professor está offline. Podes pedir ajuda ao Assistente IA enquanto aguardas.
          </Typography>
          <Button
            variant="outlined"
            disabled={requestingAI}
            onClick={handleAskAI}
            startIcon={requestingAI ? <CircularProgress size={14} /> : <span>🤖</span>}
            sx={{
              borderColor: '#4F46E5', color: '#4F46E5', textTransform: 'none',
              fontWeight: 700, borderRadius: 2,
              '&:hover': { bgcolor: '#EEF2FF', borderColor: '#4338CA' },
            }}
          >
            {requestingAI ? 'A consultar IA...' : 'Perguntar ao Assistente IA'}
          </Button>
        </Box>
      )}

      <div ref={endRef} />
    </Box>
  );
}

// ─── Chat input bar ───────────────────────────────────────────────────────────

function ChatInput({ questionId, questionType, onSent, prefillText, onPrefillConsumed }: {
  questionId: number; questionType: string; onSent: () => void;
  prefillText?: string; onPrefillConsumed?: () => void;
}) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const isExpert = questionType === 'ESPECIALIZADO';
  const isProfessor = user?.role === 'Professor';
  const accent = isExpert ? '#2563EB' : '#10B981';

  useEffect(() => {
    if (prefillText) {
      setText(prefillText);
      onPrefillConsumed?.();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [prefillText]);

  const handleSend = async () => {
    if (!text.trim() && !file) return;
    setSending(true); setError('');
    try {
      let attachmentId: string | null = null;
      if (file) {
        setUploading(true);
        const att = await uploadAttachment(file, 'forum', String(questionId));
        attachmentId = att.id;
        setUploading(false);
      }
      // Expert rooms: professors reply via expert-answers; students send follow-ups via collaborative
      if (isExpert && isProfessor) await forumService.createExpertAnswer(questionId, { conteudo: text, attachmentId });
      else await forumService.createCollaborativeAnswer(questionId, { conteudo: text, attachmentId });
      setText(''); setFile(null); onSent();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao enviar.');
    } finally { setSending(false); setUploading(false); }
  };

  return (
    <Box sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.07)', bgcolor: '#F8FAFC' }}>
      {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{error}</Alert>}
      
      {file && (
        <Stack direction="row" spacing={1.5} alignItems="center" mb={2}
          sx={{ p: 1.2, bgcolor: 'white', borderRadius: 2.5, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <Box sx={{ p: 0.8, bgcolor: '#F1F5F9', borderRadius: 1.5 }}>
            <AttachFileIcon sx={{ fontSize: 18, color: accent }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap fontSize={13}>{file.name}</Typography>
            <Typography variant="caption" color="text.secondary">{formatBytes(file.size)}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setFile(null)}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
        </Stack>
      )}

      <Stack direction="row" spacing={1.5} alignItems="flex-end">
        <input ref={fileRef} type="file" style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); e.target.value = ''; }} />
        
        <Tooltip title="Anexar">
          <IconButton onClick={() => fileRef.current?.click()}
            sx={{ 
              color: '#64748B', mb: 0.5, 
              bgcolor: 'white', border: '1px solid #E2E8F0',
              '&:hover': { bgcolor: '#F1F5F9' } 
            }}>
            <AttachFileIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        <Paper sx={{ 
          flex: 1, borderRadius: 4, px: 2, py: 0.8, 
          bgcolor: 'white', border: '1px solid #E2E8F0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <TextField
            fullWidth multiline maxRows={5}
            placeholder={isProfessor && isExpert ? 'Escreve a tua resposta ao aluno...' : 'Escreva a sua mensagem...'}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            variant="standard"
            inputRef={inputRef}
            InputProps={{ disableUnderline: true }}
            sx={{ '& .MuiInputBase-root': { fontSize: 14.5, fontWeight: 500 } }}
          />
        </Paper>

        <IconButton
          onClick={handleSend}
          disabled={(!text.trim() && !file) || sending || uploading}
          sx={{
            mb: 0.5,
            bgcolor: accent,
            color: 'white',
            width: 44, height: 44,
            boxShadow: `0 4px 12px ${accent}40`,
            '&:hover': { bgcolor: isExpert ? '#1E40AF' : '#059669', transform: 'scale(1.05)' },
            '&.Mui-disabled': { bgcolor: '#E2E8F0', color: '#94A3B8', boxShadow: 'none' },
            transition: 'all 0.2s'
          }}
        >
          {sending || uploading ? <CircularProgress size={20} color="inherit" /> : <SendIcon sx={{ fontSize: 20, ml: 0.4 }} />}
        </IconButton>
      </Stack>
    </Box>
  );
}

// ─── Right panel — Professor question (Tanka style) ───────────────────────────

function DetailPanelExpert({ q, onSuggestionClick }: { q: ForumQuestion; onSuggestionClick: (text: string) => void }) {
  const discColor = DISCIPLINA_COLOR[q.disciplina] ?? '#666';

  const suggestions = [
    'Pode explicar com exemplos práticos?',
    'Como resolver isso passo a passo?',
    'Onde posso encontrar mais informações?',
    'Não entendi a explicação, pode reformular?',
  ];

  const formatResponseTime = (min: number) =>
    min < 60 ? `${min} min` : `${Math.round(min / 60)}h ${min % 60 > 0 ? `${min % 60}min` : ''}`.trim();

  return (
    <Box sx={{
      width: DETAIL_W, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid rgba(0,0,0,0.08)', bgcolor: 'white', overflow: 'hidden',
    }}>
      <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid #F1F5F9' }}>
        <Avatar sx={{
          width: 70, height: 70, bgcolor: '#DBEAFE', color: '#2563EB', mx: 'auto', mb: 2,
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)', border: '2px solid white'
        }}>
          <SchoolIcon sx={{ fontSize: 35 }} />
        </Avatar>
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0F172A' }}>Sessão Especialista</Typography>
        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Chat Privado</Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, mb: 2, display: 'block' }}>
          Informações da Questão
        </Typography>

        <Stack spacing={2.5}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>Disciplina</Typography>
            <Chip
              label={`${DISCIPLINA_EMOJI[q.disciplina]} ${DISCIPLINA_LABELS[q.disciplina]}`}
              size="small"
              sx={{ bgcolor: discColor + '10', color: discColor, fontWeight: 800, borderRadius: 1 }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>Criado por</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: '#1E293B' }}>{initials(q.createdBy)}</Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{q.createdBy}</Typography>
            </Stack>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>Estado</Typography>
            <Chip
              label={q.status === 'ABERTA' ? 'Em aberto' : 'Encerrada'}
              size="small"
              sx={{
                bgcolor: q.status === 'ABERTA' ? '#DCFCE7' : '#F1F5F9',
                color: q.status === 'ABERTA' ? '#15803D' : '#64748B',
                fontWeight: 800
              }}
            />
          </Box>

          {q.responseTimeMinutes != null && (
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>Tempo de resposta</Typography>
              <Chip
                label={`⚡ ${formatResponseTime(q.responseTimeMinutes)}`}
                size="small"
                sx={{ bgcolor: '#FFF7ED', color: '#C2410C', fontWeight: 800, borderRadius: 1 }}
              />
            </Box>
          )}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, mb: 2, display: 'block' }}>
          Sugestões de Apoio
        </Typography>
        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1.5 }}>
          Clica para pré-preencher a mensagem
        </Typography>
        <Stack spacing={1}>
          {suggestions.map(s => (
            <Paper key={s} elevation={0} onClick={() => onSuggestionClick(s)} sx={{
              p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0',
              cursor: 'pointer', transition: 'all 0.2s',
              '&:hover': { bgcolor: '#EFF6FF', borderColor: '#BFDBFE', transform: 'translateX(2px)' }
            }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E293B' }}>{s}</Typography>
            </Paper>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

// ─── Right panel — Collaborative question (Crisp style) ───────────────────────

function DetailPanelCollab({ q }: { q: ForumQuestion }) {
  const discColor = DISCIPLINA_COLOR[q.disciplina] ?? '#666';
  const participants = [
    q.createdBy,
    ...(q.collaborativeAnswers ?? []).map(a => a.answeredBy),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <Box sx={{
      width: DETAIL_W, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid rgba(0,0,0,0.08)', bgcolor: 'white', overflow: 'hidden',
    }}>
      <Box sx={{ p: 4, textAlign: 'center', borderBottom: '1px solid #F1F5F9', background: '#F0FDF4' }}>
        <Avatar sx={{ 
          width: 80, height: 80, bgcolor: 'white', color: '#10B981', mx: 'auto', mb: 2,
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)', border: '3px solid white'
        }}>
          {initials(q.createdBy)}
        </Avatar>
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#065F46' }}>{q.createdBy}</Typography>
        <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>Autor da Questão</Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, mb: 2, display: 'block' }}>
          Informações do Fórum
        </Typography>

        <Stack spacing={2.5}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>Disciplina</Typography>
            <Chip 
              label={`${DISCIPLINA_EMOJI[q.disciplina]} ${DISCIPLINA_LABELS[q.disciplina]}`} 
              size="small" 
              sx={{ bgcolor: discColor + '10', color: discColor, fontWeight: 800, borderRadius: 1 }} 
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>Participantes</Typography>
            <Stack direction="row" spacing={-1} sx={{ mb: 1 }}>
              {participants.slice(0, 5).map((p, i) => (
                <Avatar key={p} sx={{ 
                  width: 28, height: 28, fontSize: 10, bgcolor: i % 2 === 0 ? '#10B981' : '#3B82F6',
                  border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {initials(p)}
                </Avatar>
              ))}
              {participants.length > 5 && (
                <Avatar sx={{ width: 28, height: 28, fontSize: 10, bgcolor: '#94A3B8', border: '2px solid white' }}>
                  +{participants.length - 5}
                </Avatar>
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">{participants.length} pessoas interagindo</Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 4 }} />

        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, mb: 2, display: 'block' }}>
          Lista de Participantes
        </Typography>
        <Stack spacing={1.5}>
          {participants.map((p, i) => (
            <Stack key={p} direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 32, height: 32, fontSize: 11, bgcolor: i === 0 ? '#10B981' : '#F1F5F9', color: i === 0 ? 'white' : '#64748B' }}>
                {initials(p)}
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }} noWrap>{p}</Typography>
                {i === 0 && <Typography variant="caption" color="#10B981" fontWeight={700}>Autor</Typography>}
              </Box>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

// ─── New Question Dialog ──────────────────────────────────────────────────────

function NewQuestionDialog({ open, onClose, availableDisciplinas, onCreated }: {
  open: boolean; onClose: () => void;
  availableDisciplinas: { disciplina: DisciplinaEnum; professorName?: string }[];
  onCreated: () => void;
}) {
  const [step, setStep] = useState(1);
  const [disciplina, setDisciplina] = useState<DisciplinaEnum | ''>('');
  const [type, setType] = useState<'ESPECIALIZADO' | 'COLABORATIVO' | null>(null);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { 
    setStep(1); setDisciplina(''); setType(null); setMessage(''); setFile(null); setError(''); 
  };
  
  const selected = availableDisciplinas.find(d => d.disciplina === disciplina);

  const handleSubmit = async () => {
    if (!disciplina || !type || !message.trim()) return;
    setSaving(true); setError('');
    try {
      let attachmentId: string | null = null;
      if (file) {
        const att = await uploadAttachment(file, 'forum');
        attachmentId = att.id;
      }
      const titulo = message.split('\n')[0].substring(0, 150).trim()
        || `Dúvida sobre ${DISCIPLINA_LABELS[disciplina as DisciplinaEnum]}`;
      await forumService.createQuestion({ titulo, descricao: message.trim(), disciplina: disciplina as DisciplinaEnum, questionType: type });
      reset(); onCreated(); onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao criar a pergunta.');
    } finally { setSaving(false); }
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' } }}>

      {/* Header with gradient */}
      <Box sx={{ 
        px: 3, pt: 3, pb: 3, 
        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
        color: 'white',
        position: 'relative'
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography fontWeight={800} variant="h6">Nova Conversa</Typography>
          <IconButton size="small" onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.6)' }}><CloseIcon /></IconButton>
        </Stack>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {step === 1 ? 'Qual é a disciplina da tua dúvida?' : step === 2 ? 'Como gostarias de obter ajuda?' : 'Escreve a tua mensagem'}
        </Typography>
        
        {/* Progress indicator */}
        <Stack direction="row" spacing={1} mt={2.5}>
          {[1, 2, 3].map(s => (
            <Box key={s} sx={{ 
              height: 4, flex: 1, borderRadius: 2, 
              bgcolor: s <= step ? '#38bdf8' : 'rgba(255,255,255,0.1)',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </Stack>
      </Box>

      <DialogContent sx={{ p: 4, minHeight: 300, display: 'flex', flexDirection: 'column' }}>
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        {/* STEP 1: Disciplina Selection */}
        {step === 1 && (
          <Box className="animate-fade-in">
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 2, display: 'block', textTransform: 'uppercase' }}>
              Seleciona a Disciplina
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 1.5 }}>
              {availableDisciplinas.map(({ disciplina: d }) => (
                <Paper
                  key={d}
                  variant="outlined"
                  onClick={() => { setDisciplina(d); setStep(2); }}
                  sx={{
                    p: 2, borderRadius: 3, cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.2s',
                    borderColor: disciplina === d ? '#38bdf8' : 'divider',
                    bgcolor: disciplina === d ? 'rgba(56, 189, 248, 0.05)' : 'white',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', borderColor: '#38bdf8' }
                  }}
                >
                  <Typography sx={{ fontSize: 32, mb: 1 }}>{DISCIPLINA_EMOJI[d]}</Typography>
                  <Typography variant="body2" fontWeight={700}>{DISCIPLINA_LABELS[d]}</Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* STEP 2: Type Selection */}
        {step === 2 && (
          <Box className="animate-fade-in">
            <Button size="small" onClick={() => setStep(1)} sx={{ mb: 2, color: 'text.secondary', textTransform: 'none' }}>
              ← Voltar para disciplinas
            </Button>
            <Typography variant="h6" fontWeight={800} mb={3}>Escolhe o formato da ajuda</Typography>
            
            <Stack spacing={2}>
              <Paper 
                variant="outlined" 
                onClick={() => { setType('ESPECIALIZADO'); setStep(3); }}
                sx={{
                  p: 2.5, borderRadius: 4, cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '2px solid',
                  borderColor: type === 'ESPECIALIZADO' ? '#1565c0' : 'divider',
                  bgcolor: type === 'ESPECIALIZADO' ? 'rgba(21, 101, 192, 0.05)' : 'white',
                  '&:hover': { transform: 'scale(1.01)', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', borderColor: '#1565c0' },
                  display: 'flex', alignItems: 'center', gap: 3
                }}
              >
                <Avatar sx={{ width: 60, height: 60, bgcolor: '#e0f2fe', color: '#1565c0' }}>
                  <SchoolIcon sx={{ fontSize: 30 }} />
                </Avatar>
                <Box>
                  <Typography fontWeight={800} variant="subtitle1" color="#1565c0">Conversa com Professor</Typography>
                  <Typography variant="body2" color="text.secondary">Privado · Direto ao especialista da área</Typography>
                  {selected?.professorName && (
                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: '#1565c0', fontWeight: 600 }}>
                      Professor: {selected.professorName}
                    </Typography>
                  )}
                </Box>
              </Paper>

              <Paper 
                variant="outlined" 
                onClick={() => { setType('COLABORATIVO'); setStep(3); }}
                sx={{
                  p: 2.5, borderRadius: 4, cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '2px solid',
                  borderColor: type === 'COLABORATIVO' ? '#00A651' : 'divider',
                  bgcolor: type === 'COLABORATIVO' ? 'rgba(0, 166, 81, 0.05)' : 'white',
                  '&:hover': { transform: 'scale(1.01)', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', borderColor: '#00A651' },
                  display: 'flex', alignItems: 'center', gap: 3
                }}
              >
                <Avatar sx={{ width: 60, height: 60, bgcolor: '#f0fdf4', color: '#00A651' }}>
                  <GroupsIcon sx={{ fontSize: 30 }} />
                </Avatar>
                <Box>
                  <Typography fontWeight={800} variant="subtitle1" color="#00A651">Fórum Coletivo</Typography>
                  <Typography variant="body2" color="text.secondary">Público · Ajuda de toda a turma</Typography>
                </Box>
              </Paper>
            </Stack>
          </Box>
        )}

        {/* STEP 3: Message Input */}
        {step === 3 && (
          <Box className="animate-fade-in" sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Button size="small" onClick={() => setStep(2)} sx={{ mb: 2, color: 'text.secondary', textTransform: 'none', alignSelf: 'flex-start' }}>
              ← Alterar formato de ajuda
            </Button>
            
            <Box sx={{ 
              p: 2, mb: 2, borderRadius: 3, 
              bgcolor: type === 'COLABORATIVO' ? 'rgba(0, 166, 81, 0.05)' : 'rgba(21, 101, 192, 0.05)',
              display: 'flex', alignItems: 'center', gap: 1.5,
              border: '1px solid',
              borderColor: type === 'COLABORATIVO' ? 'rgba(0, 166, 81, 0.1)' : 'rgba(21, 101, 192, 0.1)'
            }}>
              {type === 'COLABORATIVO' ? <GroupsIcon sx={{ color: '#00A651' }} /> : <SchoolIcon sx={{ color: '#1565c0' }} />}
              <Typography variant="body2" fontWeight={700} color={type === 'COLABORATIVO' ? '#00A651' : '#1565c0'}>
                {type === 'COLABORATIVO' ? 'Nova Publicação no Fórum' : 'Mensagem Privada ao Professor'}
              </Typography>
              <Chip label={DISCIPLINA_LABELS[disciplina as DisciplinaEnum]} size="small" sx={{ ml: 'auto', fontWeight: 700 }} />
            </Box>

            <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TextField 
                fullWidth multiline minRows={5} maxRows={12}
                placeholder="Escreve a tua dúvida detalhadamente aqui..."
                value={message} onChange={e => setMessage(e.target.value)}
                variant="standard" InputProps={{ disableUnderline: true, sx: { fontSize: 15 } }} 
              />
              
              {file && (
                <Stack direction="row" spacing={1.2} alignItems="center" mt={2}
                  sx={{ p: 1.2, bgcolor: '#f1f5f9', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <InsertDriveFileIcon fontSize="small" sx={{ color: '#64748b' }} />
                  <Typography variant="caption" fontWeight={600} flex={1}>{file.name}</Typography>
                  <IconButton size="small" onClick={() => setFile(null)}><CloseIcon fontSize="small" /></IconButton>
                </Stack>
              )}

              <input ref={fileRef} type="file" style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); e.target.value = ''; }} />
              
              <Divider sx={{ my: 2 }} />
              
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Button 
                  startIcon={<AttachFileIcon />} 
                  onClick={() => fileRef.current?.click()}
                  sx={{ textTransform: 'none', color: '#64748b' }}
                >
                  Anexar ficheiro
                </Button>
                <Button
                  variant="contained"
                  disabled={!message.trim() || saving}
                  onClick={handleSubmit}
                  sx={{ 
                    borderRadius: 3, px: 4, py: 1, fontWeight: 800,
                    bgcolor: type === 'COLABORATIVO' ? '#00A651' : '#1565c0',
                    '&:hover': { bgcolor: type === 'COLABORATIVO' ? '#008f44' : '#0d47a1' }
                  }}
                >
                  {saving ? <CircularProgress size={20} color="inherit" /> : 'Publicar Agora'}
                </Button>
              </Stack>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentForumPage() {
  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  const isProfessor = user?.role === 'Professor';

  // Student state
  const [myQuestions, setMyQuestions] = useState<ForumQuestion[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [generalQuestions, setGeneralQuestions] = useState<ForumQuestion[]>([]);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [availableDisciplinas, setAvailableDisciplinas] = useState<{ disciplina: DisciplinaEnum; professorName?: string }[]>([]);
  const [loadingDisciplinas, setLoadingDisciplinas] = useState(false);

  // Professor state
  const [pendingQuestions, setPendingQuestions] = useState<ForumQuestion[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<ForumQuestion[]>([]);
  const [loadingAnswered, setLoadingAnswered] = useState(false);

  const [activeQ, setActiveQ] = useState<ForumQuestion | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'mine_all' | 'mine_answered' | 'forum' | 'pending' | 'answered'>(
    isProfessor ? 'pending' : 'mine_all'
  );
  const [newOpen, setNewOpen] = useState(false);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [prefillText, setPrefillText] = useState('');

  const loadMyQuestions = () => {
    setLoadingMy(true);
    forumService.getMyQuestions().then(setMyQuestions).finally(() => setLoadingMy(false));
  };

  const loadGeneralQuestions = () => {
    setLoadingGeneral(true);
    forumService.listQuestions({ status: 'ABERTA', size: 50 })
      .then(r => setGeneralQuestions(r.content))
      .finally(() => setLoadingGeneral(false));
  };

  const loadProfessorPending = () => {
    setLoadingPending(true);
    forumService.listProfessorPending().then(setPendingQuestions).finally(() => setLoadingPending(false));
  };

  const loadProfessorAnswered = () => {
    setLoadingAnswered(true);
    forumService.listProfessorAnswered().then(setAnsweredQuestions).finally(() => setLoadingAnswered(false));
  };

  useEffect(() => {
    if (isProfessor) {
      loadProfessorPending();
      loadProfessorAnswered();
    } else {
      loadMyQuestions();
      loadGeneralQuestions();
    }
  }, []);

  // Auto-open a question when navigated here from Dashboard (e.g. recent questions click)
  const navState = location.state as { openQuestionId?: number } | null;
  useEffect(() => {
    const qid = navState?.openQuestionId;
    if (!qid) return;
    setLoadingDetail(true);
    forumService.getQuestion(qid)
      .then(detail => { setActiveQ(detail); })
      .finally(() => setLoadingDetail(false));
    // Clear state so back-navigation doesn't re-open
    window.history.replaceState({}, '');
  }, [navState?.openQuestionId]);

  useEffect(() => {
    if (!user) return;
    setLoadingDisciplinas(true);
    api.get<{ classroomId: number }>('/auth/users/my-student-profile')
      .then(async res => {
        const classroomId = res.data?.classroomId;
        if (!classroomId) { setAvailableDisciplinas([]); return; }
        const assignments = await professorAssignmentService.findByClassroom(classroomId);
        const seen = new Set<DisciplinaEnum>();
        const list: { disciplina: DisciplinaEnum; professorName?: string }[] = [];
        for (const a of assignments) {
          const d = subjectToDisciplina(a.subjectName);
          if (d && !seen.has(d)) {
            seen.add(d);
            try {
              const profs = await forumService.getProfessorsByDisciplina(d);
              list.push({ disciplina: d, professorName: profs[0]?.fullname });
            } catch { list.push({ disciplina: d }); }
          }
        }
        setAvailableDisciplinas(list);
      })
      .catch(() => setAvailableDisciplinas([]))
      .finally(() => setLoadingDisciplinas(false));
  }, [user]);

  const handleSelectQuestion = (q: ForumQuestion, fromTab?: string) => {
    setActiveQ(q);
    setLoadingDetail(true);
    forumService.getQuestion(q.id).then(detail => {
      setActiveQ(detail);
      // Mark as read and move to the appropriate tab
      if (fromTab === 'mine_answered') {
        markSeen(q.id);
        setSidebarTab(q.questionType === 'ESPECIALIZADO' ? 'mine_all' : 'forum');
      }
    }).finally(() => setLoadingDetail(false));
  };

  const reloadActiveQ = () => {
    if (!activeQ) return;
    forumService.getQuestion(activeQ.id).then(detail => {
      setActiveQ(detail);
      if (isProfessor) {
        loadProfessorPending();
        loadProfessorAnswered();
      } else {
        setMyQuestions(prev => prev.map(q => q.id === detail.id ? detail : q));
        setGeneralQuestions(prev => prev.map(q => q.id === detail.id ? detail : q));
      }
    });
  };

  const handleAccept = async (answerId: number) => {
    setAccepting(answerId);
    try { await forumService.acceptAnswer(answerId); reloadActiveQ(); }
    finally { setAccepting(null); }
  };

  const isOwner = activeQ?.createdBy === user?.username;

  const getFilteredList = () => {
    let list: ForumQuestion[] = [];
    if (isProfessor) {
      list = sidebarTab === 'pending' ? pendingQuestions : answeredQuestions;
    } else if (sidebarTab === 'mine_all') {
      list = myQuestions.filter(q => q.questionType === 'ESPECIALIZADO');
    } else if (sidebarTab === 'mine_answered') {
      list = myQuestions.filter(hasUnread);
    } else {
      list = generalQuestions.filter(q => q.questionType === 'COLABORATIVO');
    }
    return list
      .filter(q => q.createdBy?.toLowerCase() !== 'system')
      .filter(q => !search || q.titulo.toLowerCase().includes(search.toLowerCase())
        || DISCIPLINA_LABELS[q.disciplina].toLowerCase().includes(search.toLowerCase()));
  };

  const sidebarList = getFilteredList();

  const countPending = pendingQuestions.filter(q => q.createdBy?.toLowerCase() !== 'system').length;
  const countProfAnswered = answeredQuestions.filter(q => q.createdBy?.toLowerCase() !== 'system').length;
  const countAnswered = myQuestions.filter(q =>
    q.createdBy?.toLowerCase() !== 'system' && hasUnread(q)
  ).length;
  const countMine = myQuestions.filter(q => q.createdBy?.toLowerCase() !== 'system' && q.questionType === 'ESPECIALIZADO').length;
  const countForum = generalQuestions.filter(q => q.createdBy?.toLowerCase() !== 'system' && q.questionType === 'COLABORATIVO').length;

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden', position: 'relative' }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <Box sx={{
        width: isMobile ? '100%' : SIDEBAR_W,
        display: isMobile && activeQ ? 'none' : 'flex',
        flexDirection: 'column',
        bgcolor: 'white', borderRight: '1px solid rgba(0,0,0,0.08)',
        zIndex: 20, flexShrink: 0
      }}>
        <Box sx={{ 
          px: 3, pt: 3, pb: 2,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative element */}
          <Box sx={{ 
            position: 'absolute', top: -40, right: -40, width: 120, height: 120, 
            borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)' 
          }} />

          <Stack spacing={2.5} sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ 
                  p: 1, borderRadius: 2, 
                  bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <QuizIcon sx={{ color: '#38BDF8', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography fontWeight={800} color="white" variant="subtitle1" sx={{ lineHeight: 1.1, fontSize: 16 }}>smartSAE</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: 0.5 }}>
                    {isProfessor ? 'PORTAL DO PROFESSOR' : 'PORTAL DE SUPORTE'}
                  </Typography>
                </Box>
              </Stack>

              {!isProfessor && (
                <Tooltip title="Nova Pergunta">
                  <IconButton
                    onClick={() => setNewOpen(true)}
                    sx={{
                      bgcolor: '#38BDF8', color: '#0F172A',
                      '&:hover': { bgcolor: '#7DD3FC', transform: 'rotate(90deg)' },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      width: 40, height: 40, borderRadius: 2
                    }}
                  >
                    <AddCircleIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>

            <TextField
              size="small" fullWidth placeholder="Pesquisar..."
              value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 3, color: 'white',
                  '& fieldset': { border: '1px solid rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#38BDF8', borderWidth: 1.5 },
                  '& input': { py: 1, fontSize: 13, '&::placeholder': { color: 'rgba(255,255,255,0.3)', opacity: 1 } }
                },
              }}
            />
          </Stack>
        </Box>

        {/* Horizontal Session Filters */}
        {(() => {
          const tabs = isProfessor
            ? [
                { key: 'pending',  label: 'Pendentes',   count: countPending },
                { key: 'answered', label: 'Respondidas', count: countProfAnswered },
              ]
            : [
                { key: 'mine_all',      label: 'Minhas',          count: countMine },
                { key: 'mine_answered', label: 'Respondidas',     count: countAnswered },
                { key: 'forum',         label: 'Fórum da Turma',  count: countForum },
              ];
          const activeColor = isProfessor ? '#7C3AED' : '#2563EB';
          const activeHover = isProfessor ? '#6D28D9' : '#1E40AF';
          return (
            <Box sx={{
              px: 1, py: 1.5, bgcolor: '#F8FAFC', borderBottom: '1px solid rgba(0,0,0,0.05)',
              display: 'flex', gap: 0.2, whiteSpace: 'nowrap',
              overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }
            }}>
              {tabs.map((item) => (
                <Chip
                  key={item.key}
                  label={`${item.label}${item.count > 0 ? ` (${item.count})` : ''}`}
                  onClick={() => setSidebarTab(item.key as any)}
                  sx={{
                    px: 0, height: 32, borderRadius: 2,
                    bgcolor: sidebarTab === item.key ? activeColor : 'transparent',
                    color: sidebarTab === item.key ? 'white' : '#64748B',
                    fontWeight: 800, fontSize: 10.5,
                    border: '1px solid',
                    borderColor: sidebarTab === item.key ? activeColor : 'transparent',
                    '&:hover': { bgcolor: sidebarTab === item.key ? activeHover : 'rgba(0,0,0,0.05)' },
                    transition: 'all 0.2s',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              ))}
            </Box>
          );
        })()}

        {/* Question list */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {(isProfessor
            ? (sidebarTab === 'pending' ? loadingPending : loadingAnswered)
            : (sidebarTab === 'mine_all' || sidebarTab === 'mine_answered' ? loadingMy : loadingGeneral)
          ) ? (
            <Box display="flex" justifyContent="center" pt={4}><CircularProgress size={24} /></Box>
          ) : sidebarList.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {search ? 'Sem resultados.' : 'Sem conversas.'}
              </Typography>
            </Box>
          ) : sidebarList.map(q => (
            <SidebarItem
              key={q.id}
              q={q}
              active={activeQ?.id === q.id}
              onClick={() => handleSelectQuestion(q, sidebarTab)}
            />
          ))}
        </Box>
      </Box>

      {/* ── CENTER CHAT ──────────────────────────────────────────────────────── */}
      {activeQ ? (
        <Box sx={{ 
          flex: 1, display: isMobile && !activeQ ? 'none' : 'flex', 
          flexDirection: 'column', overflow: 'hidden', bgcolor: 'white' 
        }}>
          {/* Chat header */}
          <Box sx={{
            px: { xs: 2, md: 3 }, py: 1.8, borderBottom: '1px solid rgba(0,0,0,0.07)',
            bgcolor: 'white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            zIndex: 10
          }}>
            <Stack direction="row" spacing={2} alignItems="center">
              {isMobile && (
                <IconButton onClick={() => setActiveQ(null)} sx={{ color: '#64748B', ml: -1 }}>
                  <ArrowBackIcon />
                </IconButton>
              )}
              <Avatar sx={{
                width: { xs: 36, md: 44 }, height: { xs: 36, md: 44 }, flexShrink: 0,
                bgcolor: activeQ.questionType === 'ESPECIALIZADO' ? '#DBEAFE' : '#D1FAE5',
                color: activeQ.questionType === 'ESPECIALIZADO' ? '#2563EB' : '#10B981',
                border: '1px solid rgba(0,0,0,0.05)'
              }}>
                {activeQ.questionType === 'ESPECIALIZADO' ? <SchoolIcon /> : <GroupsIcon />}
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ color: '#0F172A', lineHeight: 1.2, fontSize: { xs: 14, md: 16 } }}>
                  {activeQ.titulo}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                  <Box sx={{ 
                    width: 8, height: 8, borderRadius: '50%', 
                    bgcolor: activeQ.status === 'ABERTA' ? '#10B981' : '#94A3B8' 
                  }} />
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: { xs: 10, md: 12 } }}>
                    {activeQ.status === 'ABERTA' ? 'Ativo' : 'Encerrada'}
                  </Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto', mx: 0.5 }} />
                  <Typography variant="caption" sx={{ color: activeQ.questionType === 'ESPECIALIZADO' ? '#2563EB' : '#10B981', fontWeight: 700, fontSize: { xs: 10, md: 12 } }}>
                    {activeQ.questionType === 'ESPECIALIZADO' ? 'Prof.' : 'Turma'}
                  </Typography>
                </Stack>
              </Box>
              
              <Stack direction="row" spacing={1}>
                {!isMobile && (
                  <Tooltip title="Informações">
                    <IconButton size="small" sx={{ color: '#64748B' }}>
                      <InsertDriveFileIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                )}
                {activeQ.status === 'ABERTA' && (
                  <Chip 
                    label="Aberta" 
                    size="small" 
                    sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: 10 }} 
                  />
                )}
              </Stack>
            </Stack>
          </Box>

          {loadingDetail ? (
            <Box flex={1} display="flex" justifyContent="center" alignItems="center">
              <CircularProgress />
            </Box>
          ) : (
            <ChatMessages
              q={activeQ}
              currentUser={user?.username ?? ''}
              isOwner={isOwner}
              onAccept={handleAccept}
              accepting={accepting}
              onRefresh={reloadActiveQ}
            />
          )}

          {!loadingDetail && activeQ.status === 'ABERTA' && (
            <ChatInput
              questionId={activeQ.id}
              questionType={activeQ.questionType}
              onSent={reloadActiveQ}
              prefillText={prefillText}
              onPrefillConsumed={() => setPrefillText('')}
            />
          )}
        </Box>
      ) : (
        <Box sx={{ 
          flex: 1, display: isMobile ? 'none' : 'flex', 
          alignItems: 'center', justifyContent: 'center', 
          bgcolor: '#F8FAFC', position: 'relative', overflow: 'hidden' 
        }}>
          <Stack alignItems="center" spacing={3} sx={{ textAlign: 'center', p: 4, zIndex: 1, maxWidth: 400 }}>
            <Box sx={{ 
              width: 100, height: 100, borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%', 
              bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
              animation: 'morph 8s ease-in-out infinite'
            }}>
              <QuizIcon sx={{ fontSize: 45, color: '#2563EB' }} />
            </Box>
            <style>{`
              @keyframes morph {
                0% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
                50% { border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%; }
                100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
              }
            `}</style>
            <Typography variant="h6" fontWeight={700} color="#1E293B">
              Selecione uma conversa
            </Typography>
            <Typography variant="body2" color="#64748B">
              Escolha uma pergunta na lista ou crie uma nova para começar
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={() => setNewOpen(true)}
              sx={{ borderRadius: 3, bgcolor: '#1565c0', '&:hover': { bgcolor: '#0d47a1' }, px: 3 }}
            >
              Nova Pergunta
            </Button>
          </Stack>
        </Box>
      )}

      {/* ── DETAIL PANEL — hidden on mobile and tablet ───────────────────────── */}
      {!isMobile && !isTablet && activeQ && (
        activeQ.questionType === 'ESPECIALIZADO'
          ? <DetailPanelExpert q={activeQ} onSuggestionClick={setPrefillText} />
          : <DetailPanelCollab q={activeQ} />
      )}

      {/* ── NEW QUESTION DIALOG ─────────────────────────────────────────────── */}
      <NewQuestionDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        availableDisciplinas={loadingDisciplinas ? [] : availableDisciplinas}
        onCreated={() => { loadMyQuestions(); setSidebarTab('mine_all'); }}
      />
    </Box>
  );
}
