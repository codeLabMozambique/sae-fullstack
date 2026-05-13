import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSubjects } from '../../hooks/useSubjects';
import {
  Box, Typography, Stack, Paper, Chip, Avatar,
  Button, Dialog, DialogContent, DialogActions,
  TextField, CircularProgress, Divider, IconButton, Alert, Tooltip,
  InputAdornment, useTheme, useMediaQuery, Drawer,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QuizIcon from '@mui/icons-material/Quiz';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useAuth } from '../../context/AuthContext';
import { forumService } from '../../services/forumService';
import api from '../../services/api';
import type { ForumQuestion, DisciplinaEnum, ExpertAnswer, CollaborativeAnswer, ProfessorInfo, ForumMember, SubjectInfo } from '../../types/forum';
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

// ─── Subject resolution helpers ───────────────────────────────────────────────

function getSubjectLabel(q: ForumQuestion, subjectsMap: Map<number, SubjectInfo>): string {
  if (q.subjectId != null) return subjectsMap.get(q.subjectId)?.name ?? `Disciplina #${q.subjectId}`;
  if (q.disciplina && q.disciplina !== 'GERAL') return DISCIPLINA_LABELS[q.disciplina] ?? q.disciplina;
  return 'Geral';
}

function getSubjectEmoji(q: ForumQuestion): string {
  if (q.disciplina && q.disciplina !== 'GERAL') return DISCIPLINA_EMOJI[q.disciplina] ?? '📚';
  return '📚';
}

function getQuestionTitle(q: ForumQuestion, subjectsMap: Map<number, SubjectInfo>): string {
  if (q.subjectId != null) {
    const name = subjectsMap.get(q.subjectId)?.name;
    if (name) return q.titulo.replace(/Disciplina\s*#?\d+/gi, name);
  }
  return q.titulo;
}

// ─── Sidebar conversation item ─────────────────────────────────────────────────

function SidebarItem({ q, active, onClick, subjectsMap }: {
  q: ForumQuestion; active: boolean; onClick: () => void;
  subjectsMap: Map<number, SubjectInfo>;
}) {
  const isExpert = q.questionType === 'ESPECIALIZADO';
  const allAnswers = [...(q.expertAnswers ?? []), ...(q.collaborativeAnswers ?? [])];
  const lastMsg = allAnswers.slice(-1)[0]?.conteudo ?? q.descricao;
  const preview = lastMsg === '_' ? 'A aguardar início...' : lastMsg;
  const unread = hasUnread(q);
  const subjectName = getSubjectLabel(q, subjectsMap);

  return (
    <Box
      onClick={onClick}
      sx={{
        px: 2, py: 1.4,
        cursor: 'pointer', position: 'relative',
        bgcolor: active ? 'rgba(0,166,81,0.07)' : 'transparent',
        borderLeft: `3px solid ${active ? '#00A651' : 'transparent'}`,
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: active ? 'rgba(0,166,81,0.09)' : 'rgba(0,166,81,0.04)' },
      }}
    >

      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar sx={{
            width: 42, height: 42,
            bgcolor: isExpert ? 'rgba(0,166,81,0.10)' : 'rgba(76,175,80,0.10)',
            color: '#00A651',
          }}>
            {isExpert ? <SchoolIcon sx={{ fontSize: 22 }} /> : <GroupsIcon sx={{ fontSize: 22 }} />}
          </Avatar>
          {q.status === 'ABERTA' && (
            <Box sx={{
              position: 'absolute', bottom: 1, right: 1,
              width: 11, height: 11, borderRadius: '50%',
              bgcolor: '#00A651', border: '2px solid white',
              boxShadow: '0 0 6px rgba(0,166,81,0.4)',
            }} />
          )}
        </Box>

        <Box flex={1} minWidth={0}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.3}>
            <Typography variant="body2" fontWeight={700} noWrap
              sx={{ color: active ? '#0d2318' : '#1E293B', fontSize: 13.5, flex: 1, mr: 1 }}>
              {getQuestionTitle(q, subjectsMap)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: 10.5, fontWeight: 500, flexShrink: 0 }}>
              {timeAgo(q.createdAt)}
            </Typography>
          </Stack>

          <Typography variant="caption" sx={{
            color: '#64748B', fontSize: 11.5,
            display: '-webkit-box', WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            fontWeight: active ? 600 : 400, mb: 0.5,
          }}>
            {preview}
          </Typography>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip
              label={`${getSubjectEmoji(q)} ${subjectName}`}
              size="small"
              sx={{
                height: 16, fontSize: 9.5,
                bgcolor: active ? 'rgba(0,166,81,0.12)' : 'rgba(0,166,81,0.06)',
                color: active ? '#005a2f' : '#00A651',
                fontWeight: 700, borderRadius: 1, border: 'none',
                '& .MuiChip-label': { px: 0.8 },
              }}
            />
            <Box sx={{ flex: 1 }} />
            {unread && (
              <Box sx={{
                width: 8, height: 8, borderRadius: '50%',
                bgcolor: '#EF4444', border: '1.5px solid white', flexShrink: 0,
              }} />
            )}
            {!unread && allAnswers.length > 0 && (
              <Box sx={{
                px: 0.7, py: 0.15, borderRadius: 10,
                bgcolor: 'rgba(0,166,81,0.12)', color: '#008f44',
                fontSize: 10, fontWeight: 900, minWidth: 16, textAlign: 'center',
              }}>
                {allAnswers.length}
              </Box>
            )}
            {isExpert && (
              <Chip label="Prof" size="small"
                sx={{ height: 14, fontSize: 8.5, bgcolor: 'rgba(0,166,81,0.1)', color: '#008f44', fontWeight: 700, '& .MuiChip-label': { px: 0.6 } }} />
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
  const ownBg = isExpert ? '#00A651' : '#00A651';
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
                {expertA && !a.aiGenerated && <Chip label="Professor" size="small" sx={{ height: 14, fontSize: 8, bgcolor: '#E8F5E9', color: '#00A651', fontWeight: 800 }} />}
                {a.aiGenerated && <Chip label="IA" size="small" sx={{ height: 14, fontSize: 8, bgcolor: '#E0E7FF', color: '#00A651', fontWeight: 800 }} />}
              </Stack>
            )}

            <Paper sx={{
              p: '8px 14px',
              maxWidth: '85%',
              borderRadius: isOwn ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
              bgcolor: isOwn ? ownBg : 'white',
              color: isOwn ? ownColor : '#1E293B',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              border: accepted ? `2px solid #00A651` : 'none',
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
                {accepted && <CheckCircleIcon sx={{ fontSize: 12, color: isOwn ? 'white' : '#00A651' }} />}
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
                      bgcolor: collabA.validationStatus === 'VALIDADA' ? '#C8E6C9' : '#E8F5E9',
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
                      textTransform: 'none', color: '#00A651',
                      bgcolor: '#E8F5E9', '&:hover': { bgcolor: '#E8F5E9' }
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
              borderColor: '#00A651', color: '#00A651', textTransform: 'none',
              fontWeight: 700, borderRadius: 2,
              '&:hover': { bgcolor: '#E8F5E9', borderColor: '#008f44' },
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

function ChatInput({ questionId, questionType, onSent, prefillText, onPrefillConsumed, subjectId, classroomId }: {
  questionId: number; questionType: string; onSent: () => void;
  prefillText?: string; onPrefillConsumed?: () => void;
  subjectId?: number; classroomId?: number;
}) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  // @mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [members, setMembers] = useState<ForumMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const isExpert = questionType === 'ESPECIALIZADO';
  const isProfessor = user?.role === 'Professor';
  const accent = '#00A651';

  useEffect(() => {
    if (prefillText) {
      setText(prefillText);
      onPrefillConsumed?.();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [prefillText]);

  // Load members for @mention — works with subjectId, classroomId, or both
  useEffect(() => {
    if (members.length > 0) return;
    if (!subjectId && !classroomId) return;
    setLoadingMembers(true);
    const params: Record<string, number> = {};
    if (subjectId) params.subjectId = subjectId;
    if (classroomId) params.classroomId = classroomId;
    api.get<ForumMember[]>('/forum/questions/members', { params })
      .then(r => setMembers(r.data))
      .catch(() => {})
      .finally(() => setLoadingMembers(false));
  }, [subjectId, classroomId]);

  const handleTextChange = (val: string) => {
    setText(val);
    // Detect @mention trigger: look for the last unfinished @word
    const atMatch = val.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1].toLowerCase());
    } else {
      setMentionQuery(null);
    }
  };

  const handleMentionSelect = (member: ForumMember) => {
    // Replace trailing @partial with @username
    const newText = text.replace(/@\w*$/, `@${member.username} `);
    setText(newText);
    setMentionQuery(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const filteredMembers = mentionQuery !== null
    ? members.filter(m =>
        m.username.toLowerCase().includes(mentionQuery) ||
        m.fullname.toLowerCase().includes(mentionQuery)
      )
    : [];

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
      if (isExpert && isProfessor) await forumService.createExpertAnswer(questionId, { conteudo: text, attachmentId });
      else await forumService.createCollaborativeAnswer(questionId, { conteudo: text, attachmentId });
      setText(''); setFile(null); setMentionQuery(null); onSent();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao enviar.');
    } finally { setSending(false); setUploading(false); }
  };

  return (
    <Box sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.07)', bgcolor: '#F8FAFC', position: 'relative' }}>
      {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{error}</Alert>}

      {/* @mention autocomplete popup */}
      {mentionQuery !== null && filteredMembers.length > 0 && (
        <Paper elevation={4} sx={{
          position: 'absolute', bottom: '100%', left: 24, right: 24, mb: 1,
          borderRadius: 2, overflow: 'hidden', maxHeight: 200, overflowY: 'auto',
          border: '1px solid #E2E8F0', zIndex: 100,
        }}>
          {loadingMembers ? (
            <Box display="flex" justifyContent="center" p={1}><CircularProgress size={18} /></Box>
          ) : (
            filteredMembers.map(m => (
              <Box key={m.username} onClick={() => handleMentionSelect(m)} sx={{
                px: 2, py: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5,
                '&:hover': { bgcolor: '#F1F5F9' },
              }}>
                <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#E8F5E9', color: '#00A651' }}>
                  {initials(m.fullname || m.username)}
                </Avatar>
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight={700} noWrap>{m.fullname}</Typography>
                  <Typography variant="caption" color="text.secondary">@{m.username}</Typography>
                </Box>
                {m.online && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#00A651', flexShrink: 0 }} />}
              </Box>
            ))
          )}
        </Paper>
      )}

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
            placeholder={isProfessor && isExpert ? 'Escreve a tua resposta ao aluno...' : 'Escreva a sua mensagem... (@ para mencionar)'}
            value={text}
            onChange={e => handleTextChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') { setMentionQuery(null); return; }
              if (e.key === 'Enter' && !e.shiftKey && mentionQuery === null) {
                e.preventDefault(); handleSend();
              }
            }}
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
            '&:hover': { bgcolor: isExpert ? '#008f44' : '#008f44', transform: 'scale(1.05)' },
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

function DetailPanelExpert({ q, onSuggestionClick, subjectsMap }: {
  q: ForumQuestion; onSuggestionClick: (text: string) => void;
  subjectsMap: Map<number, SubjectInfo>;
}) {
  const discColor = DISCIPLINA_COLOR[q.disciplina] ?? '#00A651';

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
          width: 70, height: 70, bgcolor: '#E8F5E9', color: '#00A651', mx: 'auto', mb: 2,
          boxShadow: '0 4px 12px rgba(0, 166, 81, 0.15)', border: '2px solid white'
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
              label={`${getSubjectEmoji(q)} ${getSubjectLabel(q, subjectsMap)}`}
              size="small"
              sx={{ bgcolor: discColor + '15', color: discColor, fontWeight: 800, borderRadius: 1 }}
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
              '&:hover': { bgcolor: '#E8F5E9', borderColor: '#BFDBFE', transform: 'translateX(2px)' }
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

function DetailPanelCollab({ q, subjectsMap }: { q: ForumQuestion; subjectsMap: Map<number, SubjectInfo> }) {
  const discColor = DISCIPLINA_COLOR[q.disciplina] ?? '#00A651';
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
          width: 80, height: 80, bgcolor: 'white', color: '#00A651', mx: 'auto', mb: 2,
          boxShadow: '0 8px 24px rgba(0, 166, 81, 0.12)', border: '3px solid white'
        }}>
          {initials(q.createdBy)}
        </Avatar>
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#065F46' }}>{q.createdBy}</Typography>
        <Typography variant="caption" sx={{ color: '#008f44', fontWeight: 700 }}>Autor da Questão</Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, mb: 2, display: 'block' }}>
          Informações do Fórum
        </Typography>

        <Stack spacing={2.5}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>Disciplina</Typography>
            <Chip
              label={`${getSubjectEmoji(q)} ${getSubjectLabel(q, subjectsMap)}`}
              size="small"
              sx={{ bgcolor: discColor + '15', color: discColor, fontWeight: 800, borderRadius: 1 }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>Participantes</Typography>
            <Stack direction="row" spacing={-1} sx={{ mb: 1 }}>
              {participants.slice(0, 5).map((p, i) => (
                <Avatar key={p} sx={{ 
                  width: 28, height: 28, fontSize: 10, bgcolor: i % 2 === 0 ? '#00A651' : '#4caf50',
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
              <Avatar sx={{ width: 32, height: 32, fontSize: 11, bgcolor: i === 0 ? '#00A651' : '#F1F5F9', color: i === 0 ? 'white' : '#64748B' }}>
                {initials(p)}
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }} noWrap>{p}</Typography>
                {i === 0 && <Typography variant="caption" color="#00A651" fontWeight={700}>Autor</Typography>}
              </Box>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#00A651' }} />
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

// ─── Members drawer row ───────────────────────────────────────────────────────

function MemberRow({ member, isAdmin, isYou }: {
  member: ForumMember; isAdmin: boolean; isYou: boolean;
}) {
  return (
    <Box sx={{
      px: 2, py: 1.4, display: 'flex', alignItems: 'center', gap: 1.5,
      borderBottom: '1px solid rgba(0,0,0,0.04)',
      '&:hover': { bgcolor: 'rgba(0,166,81,0.04)' },
    }}>
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <Avatar sx={{
          width: 40, height: 40, fontSize: 14, fontWeight: 700,
          bgcolor: member.role === 'PROFESSOR' ? '#E8F5E9' : '#F1F5F9',
          color: member.role === 'PROFESSOR' ? '#00A651' : '#475569',
        }}>
          {initials(member.fullname || member.username)}
        </Avatar>
        <Box sx={{
          position: 'absolute', bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: '50%',
          bgcolor: member.online ? '#00A651' : '#94A3B8',
          border: '2px solid white',
        }} />
      </Box>
      <Box flex={1} minWidth={0}>
        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
          <Typography variant="body2" fontWeight={700} noWrap sx={{ color: '#0F172A', fontSize: 13 }}>
            {member.fullname || member.username}
          </Typography>
          {isYou && (
            <Chip label="Tu" size="small" sx={{ height: 14, fontSize: 9, bgcolor: 'rgba(0,166,81,0.1)', color: '#008f44', fontWeight: 800, '& .MuiChip-label': { px: 0.6 } }} />
          )}
          {isAdmin && (
            <Chip label="Admin" size="small" sx={{ height: 14, fontSize: 9, bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 800, '& .MuiChip-label': { px: 0.6 } }} />
          )}
        </Stack>
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: 11 }}>
          {member.role === 'PROFESSOR' ? 'Professor' : 'Estudante'} · {member.online ? 'Online' : 'Offline'}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── New Question Dialog ──────────────────────────────────────────────────────

function NewQuestionDialog({ open, onClose, subjects, classroomId, onCreated }: {
  open: boolean; onClose: () => void;
  subjects: SubjectInfo[]; classroomId: number | null;
  onCreated: (q: ForumQuestion) => void;
}) {
  const [step, setStep] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState<SubjectInfo | null>(null);
  const [creating, setCreating] = useState<'ESPECIALIZADO' | 'COLABORATIVO' | null>(null);
  const [error, setError] = useState('');

  const reset = () => {
    setStep(1); setSelectedSubject(null); setCreating(null); setError('');
  };

  const handleTypeSelect = async (type: 'ESPECIALIZADO' | 'COLABORATIVO') => {
    if (!selectedSubject) return;
    setCreating(type); setError('');
    try {
      const q = type === 'ESPECIALIZADO'
        ? await forumService.getExpertRoomBySubject(selectedSubject.id, classroomId ?? undefined)
        : await forumService.getCollaborativeRoomBySubject(selectedSubject.id, classroomId ?? undefined);
      reset();
      onCreated(q);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao abrir a conversa.');
    } finally { setCreating(null); }
  };

  const handleClose = () => { reset(); onClose(); };

  const stepLabels = [
    'Seleciona a disciplina da tua dúvida',
    'Como queres receber ajuda?',
  ];

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' } }}>

      {/* Header */}
      <Box sx={{
        px: 3, pt: 3, pb: 3,
        background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
        color: 'white', position: 'relative'
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography fontWeight={800} variant="h6">Nova Conversa</Typography>
          <IconButton size="small" onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.6)' }}><CloseIcon /></IconButton>
        </Stack>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {stepLabels[step - 1]}
        </Typography>
        <Stack direction="row" spacing={1} mt={2.5}>
          {[1, 2].map(s => (
            <Box key={s} sx={{
              height: 4, flex: 1, borderRadius: 2,
              bgcolor: s <= step ? '#38bdf8' : 'rgba(255,255,255,0.1)',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </Stack>
      </Box>

      <DialogContent sx={{ p: 4, minHeight: 320, display: 'flex', flexDirection: 'column' }}>
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        {/* STEP 1: Subject selection */}
        {step === 1 && (
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 2, display: 'block', textTransform: 'uppercase' }}>
              Seleciona a Disciplina
            </Typography>
            {subjects.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">Nenhuma disciplina disponível</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1.5 }}>
                {subjects.map(s => (
                  <Paper key={s.id} variant="outlined"
                    onClick={() => { setSelectedSubject(s); setStep(2); }}
                    sx={{
                      p: 2, borderRadius: 3, cursor: 'pointer', textAlign: 'center',
                      transition: 'all 0.2s',
                      borderColor: selectedSubject?.id === s.id ? '#38bdf8' : 'divider',
                      bgcolor: selectedSubject?.id === s.id ? 'rgba(56,189,248,0.05)' : 'white',
                      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', borderColor: '#38bdf8' }
                    }}>
                    <Typography sx={{ fontSize: 28, mb: 1 }}>📚</Typography>
                    <Typography variant="body2" fontWeight={700} noWrap>{s.name}</Typography>
                    {s.code && (
                      <Typography variant="caption" color="text.secondary">{s.code}</Typography>
                    )}
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* STEP 2: Type selection → immediately opens room */}
        {step === 2 && selectedSubject && (
          <Box>
            <Button size="small" onClick={() => setStep(1)} sx={{ mb: 2, color: 'text.secondary', textTransform: 'none' }}>
              ← Voltar às disciplinas
            </Button>

            <Stack direction="row" spacing={1.5} alignItems="center" mb={3}
              sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Typography sx={{ fontSize: 22 }}>📚</Typography>
              <Box>
                <Typography variant="body2" fontWeight={800} color="#1E293B">{selectedSubject.name}</Typography>
                {selectedSubject.code && (
                  <Typography variant="caption" color="text.secondary">{selectedSubject.code}</Typography>
                )}
              </Box>
            </Stack>

            <Stack spacing={2}>
              {/* Expert / Professor card */}
              <Paper variant="outlined"
                onClick={() => !creating && handleTypeSelect('ESPECIALIZADO')}
                sx={{
                  p: 2.5, borderRadius: 4, cursor: creating ? 'default' : 'pointer',
                  border: '2px solid', borderColor: '#00A651',
                  bgcolor: 'rgba(21,101,192,0.03)',
                  transition: 'all 0.2s', opacity: creating && creating !== 'ESPECIALIZADO' ? 0.5 : 1,
                  '&:hover': !creating ? { transform: 'scale(1.01)', boxShadow: '0 10px 30px rgba(21,101,192,0.08)' } : {},
                  display: 'flex', alignItems: 'center', gap: 2.5
                }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: '#e0f2fe', color: '#00A651' }}>
                  {creating === 'ESPECIALIZADO' ? <CircularProgress size={26} sx={{ color: '#00A651' }} /> : <SchoolIcon sx={{ fontSize: 30 }} />}
                </Avatar>
                <Box flex={1}>
                  <Typography fontWeight={800} variant="subtitle1" color="#00A651">Conversa com Professor</Typography>
                  <Typography variant="body2" color="text.secondary">Privado · Direto ao professor desta disciplina</Typography>
                </Box>
              </Paper>

              {/* Collaborative card */}
              <Paper variant="outlined"
                onClick={() => !creating && handleTypeSelect('COLABORATIVO')}
                sx={{
                  p: 2.5, borderRadius: 4, cursor: creating ? 'default' : 'pointer',
                  border: '2px solid', borderColor: '#00A651',
                  bgcolor: 'rgba(0,166,81,0.03)',
                  transition: 'all 0.2s', opacity: creating && creating !== 'COLABORATIVO' ? 0.5 : 1,
                  '&:hover': !creating ? { transform: 'scale(1.01)', boxShadow: '0 10px 30px rgba(0,166,81,0.08)' } : {},
                  display: 'flex', alignItems: 'center', gap: 2.5
                }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: '#f0fdf4', color: '#00A651' }}>
                  {creating === 'COLABORATIVO' ? <CircularProgress size={26} sx={{ color: '#00A651' }} /> : <GroupsIcon sx={{ fontSize: 30 }} />}
                </Avatar>
                <Box flex={1}>
                  <Typography fontWeight={800} variant="subtitle1" color="#00A651">Fórum da Turma</Typography>
                  <Typography variant="body2" color="text.secondary">Público · Debate colaborativo com colegas e professor</Typography>
                </Box>
              </Paper>
            </Stack>
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
  const [studentClassroomId, setStudentClassroomId] = useState<number | null | undefined>(undefined);

  // Resolve classroomId do perfil do aluno uma vez
  useEffect(() => {
    if (!user || isProfessor) { setStudentClassroomId(null); return; }
    api.get<{ classroomId?: number }>('/auth/users/my-student-profile')
      .then(res => setStudentClassroomId(res.data?.classroomId ?? null))
      .catch(() => setStudentClassroomId(null));
  }, [user?.username, isProfessor]);

  // Disciplinas sincronizadas em tempo real (polling 30 s + foco + visibilidade)
  const { subjects: availableSubjects, loading: loadingSubjects } = useSubjects(
    studentClassroomId === undefined ? null : studentClassroomId
  );

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
  const [roomProfessor, setRoomProfessor] = useState<ProfessorInfo | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [forumMembers, setForumMembers] = useState<ForumMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadMyQuestions = () => {
    setLoadingMy(true);
    forumService.getMyQuestions().then(setMyQuestions).finally(() => setLoadingMy(false));
  };

  const loadForumMembers = () => {
    if (!activeQ?.subjectId) return;
    setLoadingMembers(true);
    forumService.getForumMembers(activeQ.subjectId, activeQ.classroomId ?? undefined)
      .then(setForumMembers)
      .catch(() => {})
      .finally(() => setLoadingMembers(false));
  };

  const loadGeneralQuestions = () => {
    setLoadingGeneral(true);
    forumService.listQuestions({ status: 'ABERTA', size: 50 })
      .then(r => setGeneralQuestions(prev => {
        // Merge: update existing entries, add new ones, keep rooms not in server response
        const serverMap = new Map(r.content.map(q => [q.id, q]));
        const merged = prev.map(q => serverMap.has(q.id) ? serverMap.get(q.id)! : q);
        for (const q of r.content) {
          if (!merged.some(m => m.id === q.id)) merged.push(q);
        }
        return merged;
      }))
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

  // Load collaborative rooms once subjects + classroomId are resolved (rooms may not appear in generic listQuestions)
  useEffect(() => {
    if (isProfessor || !availableSubjects.length || studentClassroomId === undefined) return;
    Promise.allSettled(
      availableSubjects.map(s =>
        forumService.getCollaborativeRoomBySubject(s.id, studentClassroomId ?? undefined)
      )
    ).then(results => {
      const rooms = results
        .filter((r): r is PromiseFulfilledResult<ForumQuestion> => r.status === 'fulfilled')
        .map(r => r.value);
      if (rooms.length) {
        setGeneralQuestions(prev => {
          let next = [...prev];
          for (const room of rooms) {
            const idx = next.findIndex(q => q.id === room.id);
            if (idx >= 0) next[idx] = room;
            else next = [room, ...next];
          }
          return next;
        });
      }
    });
  }, [isProfessor, availableSubjects.length, studentClassroomId]);

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

  const upsertQuestion = (list: ForumQuestion[], detail: ForumQuestion) =>
    list.some(q => q.id === detail.id)
      ? list.map(q => q.id === detail.id ? detail : q)
      : [detail, ...list];

  const reloadActiveQ = () => {
    if (!activeQ) return;
    forumService.getQuestion(activeQ.id).then(detail => {
      setActiveQ(detail);
      if (isProfessor) {
        loadProfessorPending();
        loadProfessorAnswered();
      } else {
        setMyQuestions(prev => upsertQuestion(prev, detail));
        setGeneralQuestions(prev => upsertQuestion(prev, detail));
      }
    });
  };

  // Fetch professor info for expert rooms
  useEffect(() => {
    if (!activeQ || activeQ.questionType !== 'ESPECIALIZADO') {
      setRoomProfessor(null);
      return;
    }
    forumService.getProfessorsByDisciplina(activeQ.disciplina)
      .then(profs => setRoomProfessor(profs[0] ?? null))
      .catch(() => setRoomProfessor(null));
  }, [activeQ?.id, activeQ?.disciplina]);

  // Poll for new messages every 5 s while a chat is open
  useEffect(() => {
    if (!activeQ) return;
    const id = setInterval(() => {
      forumService.getQuestion(activeQ.id).then(detail => {
        setActiveQ(detail);
        setMyQuestions(prev => upsertQuestion(prev, detail));
        setGeneralQuestions(prev => upsertQuestion(prev, detail));
      }).catch(() => {});
      // Refresh professor online status
      if (activeQ.questionType === 'ESPECIALIZADO') {
        forumService.getProfessorsByDisciplina(activeQ.disciplina)
          .then(profs => setRoomProfessor(profs[0] ?? null))
          .catch(() => {});
      }
    }, 5000);
    return () => clearInterval(id);
  }, [activeQ?.id]);

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
      .filter(q => sidebarTab === 'forum' || q.createdBy?.toLowerCase() !== 'system')
      .filter(q => !search || q.titulo.toLowerCase().includes(search.toLowerCase())
        || (q.disciplina && DISCIPLINA_LABELS[q.disciplina]?.toLowerCase().includes(search.toLowerCase())));
  };

  const sidebarList = getFilteredList();
  const subjectsMap = new Map(availableSubjects.map(s => [s.id, s]));

  const countPending = pendingQuestions.filter(q => q.createdBy?.toLowerCase() !== 'system').length;
  const countProfAnswered = answeredQuestions.filter(q => q.createdBy?.toLowerCase() !== 'system').length;
  const countAnswered = myQuestions.filter(q =>
    q.createdBy?.toLowerCase() !== 'system' && hasUnread(q)
  ).length;
  const countMine = myQuestions.filter(q => q.createdBy?.toLowerCase() !== 'system' && q.questionType === 'ESPECIALIZADO').length;
  const countForum = generalQuestions.filter(q => q.questionType === 'COLABORATIVO').length;

  return (
    <Box sx={{
      display: 'flex', height: '100%', overflow: 'hidden', position: 'relative',
      background: 'linear-gradient(135deg, rgba(232,245,233,0.35) 0%, rgba(255,255,255,0.85) 50%, rgba(241,248,233,0.25) 100%)',
    }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <Box sx={{
        width: isMobile ? '100%' : SIDEBAR_W,
        display: isMobile && activeQ ? 'none' : 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(0,166,81,0.08)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.04)',
        zIndex: 20, flexShrink: 0,
      }}>
        {/* Dark gradient header */}
        <Box sx={{
          px: 3, pt: 2.5, pb: 2.5,
          background: 'linear-gradient(135deg, #0d2318 0%, #1a4028 60%, #0d2318 100%)',
          borderBottom: '1px solid rgba(0,166,81,0.18)',
        }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <QuizIcon sx={{ color: '#4caf50', fontSize: 22 }} />
                <Box>
                  <Typography fontWeight={800} color="white" variant="subtitle1"
                    sx={{ lineHeight: 1.1, fontSize: 15, letterSpacing: 0.3 }}>
                    PORTAL DE SUPORTE
                  </Typography>
                  <Typography variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: 0.4 }}>
                    {isProfessor ? 'Vista do Professor' : 'As minhas conversas'}
                  </Typography>
                </Box>
              </Stack>

              {!isProfessor && (
                <Tooltip title="Nova Pergunta">
                  <IconButton onClick={() => setNewOpen(true)} sx={{
                    bgcolor: '#00A651', color: 'white',
                    '&:hover': { bgcolor: '#4caf50', transform: 'scale(1.06)' },
                    width: 34, height: 34, borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(0,166,81,0.35)',
                    transition: 'all 0.2s',
                  }}>
                    <AddCircleIcon sx={{ fontSize: 20 }} />
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
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 2.5, color: 'white',
                  '& fieldset': { border: '1px solid rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.22)' },
                  '&.Mui-focused fieldset': { borderColor: '#4caf50', borderWidth: 1.5 },
                  '& input': { py: 1, fontSize: 13, color: 'white', '&::placeholder': { color: 'rgba(255,255,255,0.35)', opacity: 1 } },
                },
              }}
            />
          </Stack>
        </Box>

        {/* Tab filters — underline style */}
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
          return (
            <Box sx={{
              px: 2, bgcolor: 'transparent', borderBottom: '1px solid rgba(0,0,0,0.05)',
              display: 'flex', gap: 0, whiteSpace: 'nowrap',
            }}>
              {tabs.map((item) => {
                const isActive = sidebarTab === item.key;
                return (
                  <Box key={item.key} component="button"
                    onClick={() => setSidebarTab(item.key as any)}
                    sx={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      px: 1.5, py: 1.2,
                      color: isActive ? '#00A651' : '#A5D6A7',
                      fontWeight: 800, fontSize: 11, fontFamily: 'inherit',
                      borderBottom: `2px solid ${isActive ? '#00A651' : 'transparent'}`,
                      transition: 'all 0.18s',
                      '&:hover': { color: '#00A651', borderBottom: '2px solid #00A651' },
                    }}
                  >
                    {item.label}{item.count > 0 ? ` (${item.count})` : ''}
                  </Box>
                );
              })}
            </Box>
          );
        })()}

        {/* Question list */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {(isProfessor
            ? (sidebarTab === 'pending' ? loadingPending : loadingAnswered)
            : (sidebarTab === 'mine_all' || sidebarTab === 'mine_answered' ? loadingMy : loadingGeneral)
          ) ? (
            <Box display="flex" justifyContent="center" pt={4}>
              <CircularProgress size={24} sx={{ color: '#00A651' }} />
            </Box>
          ) : sidebarList.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <QuizIcon sx={{ fontSize: 36, color: 'rgba(0,166,81,0.2)', mb: 1.5 }} />
              <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                {search ? 'Sem resultados.' : 'Sem conversas.'}
              </Typography>
            </Box>
          ) : sidebarList.map(q => (
            <SidebarItem
              key={q.id}
              q={q}
              active={activeQ?.id === q.id}
              onClick={() => handleSelectQuestion(q, sidebarTab)}
              subjectsMap={subjectsMap}
            />
          ))}
        </Box>
      </Box>

      {/* ── CENTER CHAT ──────────────────────────────────────────────────────── */}
      {activeQ ? (
        <Box sx={{
          flex: 1, minWidth: 0, display: isMobile && !activeQ ? 'none' : 'flex',
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
                bgcolor: activeQ.questionType === 'ESPECIALIZADO' ? '#E8F5E9' : '#C8E6C9',
                color: activeQ.questionType === 'ESPECIALIZADO' ? '#00A651' : '#00A651',
                border: '1px solid rgba(0,0,0,0.05)'
              }}>
                {activeQ.questionType === 'ESPECIALIZADO' ? <SchoolIcon /> : <GroupsIcon />}
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ color: '#0F172A', lineHeight: 1.2, fontSize: { xs: 14, md: 16 } }}>
                  {activeQ.questionType === 'ESPECIALIZADO' && roomProfessor
                    ? roomProfessor.fullname
                    : getQuestionTitle(activeQ, subjectsMap)}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                  {activeQ.questionType === 'ESPECIALIZADO' && roomProfessor ? (
                    <>
                      <Box sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        bgcolor: roomProfessor.online ? '#00A651' : '#94A3B8'
                      }} />
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: { xs: 10, md: 12 } }}>
                        {roomProfessor.online ? 'Online' : 'Offline'}
                      </Typography>
                      <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto', mx: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#00A651', fontWeight: 700, fontSize: { xs: 10, md: 12 } }}>
                        {getSubjectEmoji(activeQ)} {getSubjectLabel(activeQ, subjectsMap)}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Box sx={{
                        width: 8, height: 8, borderRadius: '50%',
                        bgcolor: activeQ.status === 'ABERTA' ? '#00A651' : '#94A3B8'
                      }} />
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: { xs: 10, md: 12 } }}>
                        {activeQ.status === 'ABERTA' ? 'Ativo' : 'Encerrado'}
                      </Typography>
                      <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto', mx: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#00A651', fontWeight: 700, fontSize: { xs: 10, md: 12 } }}>
                        {getSubjectEmoji(activeQ)} {getSubjectLabel(activeQ, subjectsMap)}
                      </Typography>
                    </>
                  )}
                </Stack>
              </Box>
              
              <Stack direction="row" spacing={1}>
                {activeQ.questionType === 'COLABORATIVO' && (
                  <Tooltip title="Membros do grupo">
                    <IconButton size="small"
                      onClick={() => { setMembersOpen(true); loadForumMembers(); }}
                      sx={{ color: '#00A651' }}>
                      <GroupsIcon sx={{ fontSize: 20 }} />
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
              subjectId={activeQ.subjectId ?? undefined}
              classroomId={activeQ.classroomId ?? undefined}
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
              <QuizIcon sx={{ fontSize: 45, color: '#00A651' }} />
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
              sx={{ borderRadius: 3, bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' }, px: 3 }}
            >
              Nova Pergunta
            </Button>
          </Stack>
        </Box>
      )}

      {/* ── DETAIL PANEL — hidden on mobile and tablet ───────────────────────── */}
      {!isMobile && !isTablet && activeQ && (
        activeQ.questionType === 'ESPECIALIZADO'
          ? <DetailPanelExpert q={activeQ} onSuggestionClick={setPrefillText} subjectsMap={subjectsMap} />
          : <DetailPanelCollab q={activeQ} subjectsMap={subjectsMap} />
      )}

      {/* ── NEW QUESTION DIALOG ─────────────────────────────────────────────── */}
      <NewQuestionDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        subjects={loadingSubjects ? [] : availableSubjects}
        classroomId={studentClassroomId}
        onCreated={(q) => {
          setActiveQ(q);
          if (q.questionType === 'ESPECIALIZADO') {
            loadMyQuestions();
            setSidebarTab('mine_all');
          } else {
            setGeneralQuestions(prev => upsertQuestion(prev, q));
            setSidebarTab('forum');
          }
        }}
      />

      {/* ── MEMBERS DRAWER ──────────────────────────────────────────────────── */}
      <Drawer anchor="right" open={membersOpen} onClose={() => setMembersOpen(false)}
        PaperProps={{ sx: { width: 320, display: 'flex', flexDirection: 'column' } }}>
        <Box sx={{
          px: 3, py: 2.5, flexShrink: 0,
          background: 'linear-gradient(135deg, #0d2318 0%, #1a4028 60%, #0d2318 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <GroupsIcon sx={{ color: '#4caf50', fontSize: 22 }} />
            <Box>
              <Typography fontWeight={800} color="white" variant="subtitle1">Membros</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                {forumMembers.length} {forumMembers.length === 1 ? 'membro' : 'membros'}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => setMembersOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loadingMembers ? (
            <Box display="flex" justifyContent="center" pt={4}>
              <CircularProgress size={24} sx={{ color: '#00A651' }} />
            </Box>
          ) : forumMembers.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <GroupsIcon sx={{ fontSize: 36, color: 'rgba(0,166,81,0.2)', mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>Sem membros encontrados.</Typography>
            </Box>
          ) : (() => {
            const adminUsername = activeQ?.createdBy ?? '';
            const admins = forumMembers.filter(m => m.username === adminUsername);
            const professors = forumMembers.filter(m => m.role === 'PROFESSOR' && m.username !== adminUsername);
            const students = forumMembers.filter(m => m.role === 'STUDENT' && m.username !== adminUsername);
            return (
              <>
                {admins.length > 0 && (
                  <>
                    <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Admin</Typography>
                    </Box>
                    {admins.map(m => <MemberRow key={m.username} member={m} isAdmin isYou={m.username === user?.username} />)}
                  </>
                )}
                {professors.length > 0 && (
                  <>
                    <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Professores</Typography>
                    </Box>
                    {professors.map(m => <MemberRow key={m.username} member={m} isAdmin={false} isYou={m.username === user?.username} />)}
                  </>
                )}
                {students.length > 0 && (
                  <>
                    <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Estudantes</Typography>
                    </Box>
                    {students.map(m => <MemberRow key={m.username} member={m} isAdmin={false} isYou={m.username === user?.username} />)}
                  </>
                )}
              </>
            );
          })()}
        </Box>
      </Drawer>
    </Box>
  );
}
