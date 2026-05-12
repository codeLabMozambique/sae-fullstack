import { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Stack, Paper, Chip, Avatar,
  Button, TextField, CircularProgress, Divider,
  IconButton, Alert, Tooltip, Badge,
  InputAdornment, useTheme, useMediaQuery,
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
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ForumIcon from '@mui/icons-material/Forum';
import QuizIcon from '@mui/icons-material/Quiz';
import { useAuth } from '../../context/AuthContext';
import { forumService } from '../../services/forumService';
import api from '../../services/api';
import type { ForumQuestion, ExpertAnswer, CollaborativeAnswer, SubjectInfo } from '../../types/forum';
import { DISCIPLINA_LABELS, DISCIPLINA_COLOR, DISCIPLINA_EMOJI } from '../../types/forum';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function formatWait(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getSubjectLabel(q: ForumQuestion, subjectsMap: Map<number, SubjectInfo>): string {
  if (q.subjectId != null) return subjectsMap.get(q.subjectId)?.name ?? `Disciplina #${q.subjectId}`;
  if (q.disciplina) return DISCIPLINA_LABELS[q.disciplina] ?? q.disciplina;
  return 'Geral';
}

function getSubjectEmoji(q: ForumQuestion): string {
  if (q.disciplina) return DISCIPLINA_EMOJI[q.disciplina] ?? '📚';
  return '📚';
}

function getSubjectColor(q: ForumQuestion): string {
  if (q.disciplina) return DISCIPLINA_COLOR[q.disciplina] ?? '#374151';
  return '#374151';
}

interface AttachmentInfo { id: string; originalName: string; contentType: string; size: number }

async function uploadAttachment(file: File, context: string, contextId?: string): Promise<AttachmentInfo> {
  const form = new FormData();
  form.append('file', file);
  if (context) form.append('context', context);
  if (contextId) form.append('contextId', contextId);
  const res = await api.post<AttachmentInfo>('/content/api/user/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

const SIDEBAR_W = 340;
const DETAIL_W = 300;

// ─── Sidebar item ──────────────────────────────────────────────────────────────

function SidebarItem({
  q, active, onClick, isPending,
}: {
  q: ForumQuestion; active: boolean; onClick: () => void; isPending: boolean;
}) {
  const isExpert = q.questionType === 'ESPECIALIZADO';
  const accent = isPending ? '#00A651' : '#4caf50';
  const allAnswers = [...(q.expertAnswers ?? []), ...(q.collaborativeAnswers ?? [])];
  const lastMsg = allAnswers.slice(-1)[0]?.conteudo ?? q.descricao;
  const preview = lastMsg === '_' ? 'A aguardar primeira mensagem...' : lastMsg;

  return (
    <Box
      onClick={onClick}
      sx={{
        px: 2, py: 1.8, cursor: 'pointer',
        bgcolor: active ? 'rgba(0,0,0,0.04)' : 'transparent',
        position: 'relative', transition: 'all .2s ease',
        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
        '&::before': active ? {
          content: '""', position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 4, bgcolor: accent, borderRadius: '0 4px 4px 0',
        } : {}
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ position: 'relative' }}>
          <Avatar sx={{
            width: 50, height: 50,
            bgcolor: isExpert ? '#E8F5E9' : '#C8E6C9',
            color: isExpert ? '#008f44' : '#00A651',
            border: `1.5px solid ${active ? accent : 'transparent'}`,
            transition: 'border 0.3s',
          }}>
            {isExpert ? <SchoolIcon /> : <GroupsIcon />}
          </Avatar>
          {isPending && (
            <Box sx={{
              position: 'absolute', bottom: 2, right: 2,
              width: 12, height: 12, borderRadius: '50%',
              bgcolor: '#00A651', border: '2px solid white',
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
              color: '#64748B', fontSize: 12,
              display: '-webkit-box', WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
              flex: 1, fontWeight: active ? 600 : 400,
            }}>
              {preview}
            </Typography>
            <Chip
              label={q.createdBy}
              size="small"
              sx={{ height: 16, fontSize: 9, bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700 }}
            />
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

// ─── Chat messages (professor perspective) ─────────────────────────────────────

function ProfessorChatMessages({
  q, currentUser,
}: {
  q: ForumQuestion; currentUser: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const isExpert = q.questionType === 'ESPECIALIZADO';
  const ownBg = isExpert ? '#00A651' : '#008f44';

  const messages = [
    ...(q.expertAnswers ?? []),
    ...(q.collaborativeAnswers ?? []),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    if (messages.length > 0) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  return (
    <Box sx={{
      flex: 1, overflowY: 'auto', p: 3,
      display: 'flex', flexDirection: 'column', gap: 2,
      bgcolor: '#F1F5F9',
      backgroundImage: 'radial-gradient(#CBD5E1 0.5px, transparent 0.5px)',
      backgroundSize: '20px 20px',
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <Chip
          label={new Date(q.createdAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
          size="small"
          sx={{ bgcolor: 'rgba(255,255,255,0.8)', color: '#64748B', fontWeight: 700, fontSize: 11, backdropFilter: 'blur(4px)' }}
        />
      </Box>

      {/* Student's original question — always on the LEFT for professor */}
      {q.descricao && q.descricao !== '_' && (
        <Stack alignItems="flex-start">
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5, ml: 1 }}>
            <Avatar sx={{ width: 20, height: 20, fontSize: 8, bgcolor: '#1E293B' }}>{initials(q.createdBy)}</Avatar>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: 11 }}>
              {q.createdBy}
            </Typography>
            <Chip label="Aluno" size="small" sx={{ height: 14, fontSize: 8, bgcolor: '#F0FDF4', color: '#15803D', fontWeight: 800 }} />
          </Stack>
          <Paper sx={{
            p: '8px 14px', maxWidth: '85%',
            borderRadius: '16px 16px 16px 2px',
            bgcolor: 'white', color: '#1E293B',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}>
            <Typography sx={{ fontSize: 14.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', fontWeight: 500 }}>
              {q.descricao}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.7, fontSize: 10, fontWeight: 700 }}>
              {new Date(q.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Paper>
        </Stack>
      )}

      {messages.map((a) => {
        const isOwn = a.answeredBy === currentUser;
        const expertA = 'accepted' in a ? (a as ExpertAnswer) : null;
        const collabA = !expertA ? (a as CollaborativeAnswer) : null;
        const accepted = expertA?.accepted;

        return (
          <Stack key={a.id} alignItems={isOwn ? 'flex-end' : 'flex-start'}>
            {!isOwn && (
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5, ml: 1 }}>
                <Avatar sx={{ width: 20, height: 20, fontSize: 8, bgcolor: '#1E293B' }}>{initials(a.answeredBy)}</Avatar>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: 11 }}>
                  {a.aiGenerated ? '🤖 Assistente IA' : a.answeredBy}
                </Typography>
                {a.aiGenerated && <Chip label="IA" size="small" sx={{ height: 14, fontSize: 8, bgcolor: '#E8F5E9', color: '#00A651', fontWeight: 800 }} />}
              </Stack>
            )}

            <Paper sx={{
              p: '8px 14px', maxWidth: '85%',
              borderRadius: isOwn ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
              bgcolor: isOwn ? ownBg : 'white',
              color: isOwn ? 'white' : '#1E293B',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              border: accepted ? '2px solid #00A651' : 'none',
            }}>
              <Typography sx={{ fontSize: 14.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                {a.conteudo}
              </Typography>

              {a.attachmentId && (
                <Box sx={{
                  mt: 1, p: 1, borderRadius: 1.5,
                  bgcolor: isOwn ? 'rgba(0,0,0,0.1)' : '#F1F5F9',
                  display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                  '&:hover': { bgcolor: isOwn ? 'rgba(0,0,0,0.15)' : '#E2E8F0' },
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

            {/* Status chips below bubble */}
            {(accepted || collabA?.validationStatus) && (
              <Stack direction="row" spacing={0.5} mt={0.5} sx={{ px: 1 }}>
                {accepted && (
                  <Chip label="Aceite pelo aluno" size="small" sx={{
                    height: 16, fontSize: 9, fontWeight: 800,
                    bgcolor: '#D1FAE5', color: '#065F46',
                  }} />
                )}
                {collabA?.validationStatus && (
                  <Chip
                    label={collabA.validationStatus === 'VALIDADA' ? 'Validada' : 'Pendente validação'}
                    size="small"
                    sx={{
                      height: 16, fontSize: 9, fontWeight: 800,
                      bgcolor: collabA.validationStatus === 'VALIDADA' ? '#D1FAE5' : '#E8F5E9',
                      color: collabA.validationStatus === 'VALIDADA' ? '#065F46' : '#00A651',
                    }}
                  />
                )}
              </Stack>
            )}
          </Stack>
        );
      })}

      <div ref={endRef} />
    </Box>
  );
}

// ─── Chat input bar ────────────────────────────────────────────────────────────

function ChatInput({ questionId, questionType, onSent }: {
  questionId: number; questionType: string; onSent: () => void;
}) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const isExpert = questionType === 'ESPECIALIZADO';
  const accent = isExpert ? '#00A651' : '#4caf50';

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
      if (isExpert) await forumService.createExpertAnswer(questionId, { conteudo: text, attachmentId });
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
              '&:hover': { bgcolor: '#F1F5F9' },
            }}>
            <AttachFileIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        <Paper sx={{
          flex: 1, borderRadius: 4, px: 2, py: 0.8,
          bgcolor: 'white', border: '1px solid #E2E8F0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}>
          <TextField
            fullWidth multiline maxRows={5}
            placeholder="Escreva a sua resposta..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            sx={{ '& .MuiInputBase-root': { fontSize: 14.5, fontWeight: 500 } }}
          />
        </Paper>

        <IconButton
          onClick={handleSend}
          disabled={(!text.trim() && !file) || sending || uploading}
          sx={{
            mb: 0.5, bgcolor: accent, color: 'white',
            width: 44, height: 44,
            boxShadow: `0 4px 12px ${accent}40`,
            '&:hover': { bgcolor: isExpert ? '#008f44' : '#4caf50', transform: 'scale(1.05)' },
            '&.Mui-disabled': { bgcolor: '#E2E8F0', color: '#94A3B8', boxShadow: 'none' },
            transition: 'all 0.2s',
          }}
        >
          {sending || uploading
            ? <CircularProgress size={20} color="inherit" />
            : <SendIcon sx={{ fontSize: 20, ml: 0.4 }} />}
        </IconButton>
      </Stack>
    </Box>
  );
}

// ─── Right detail panel ────────────────────────────────────────────────────────

function DetailPanel({ q, subjectsMap }: { q: ForumQuestion; subjectsMap: Map<number, SubjectInfo> }) {
  const discColor = getSubjectColor(q);
  const isExpert = q.questionType === 'ESPECIALIZADO';
  const allAnswers = [...(q.expertAnswers ?? []), ...(q.collaborativeAnswers ?? [])];
  const participants = [q.createdBy, ...allAnswers.map(a => a.answeredBy)]
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const waitMinutes = q.responseTimeMinutes;

  return (
    <Box sx={{
      width: DETAIL_W, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderLeft: '1px solid rgba(0,0,0,0.08)', bgcolor: 'white', overflow: 'hidden',
    }}>
      {/* Header */}
      <Box sx={{ p: 3, textAlign: 'center', borderBottom: '1px solid #F1F5F9', background: '#F0FDF4' }}>
        <Avatar sx={{
          width: 70, height: 70, mx: 'auto', mb: 2,
          bgcolor: 'white', color: '#00A651',
          boxShadow: '0 4px 12px rgba(0, 166, 81, 0.15)',
          border: '2px solid white',
          fontSize: 28, fontWeight: 800,
        }}>
          {initials(q.createdBy)}
        </Avatar>
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0F172A' }}>{q.createdBy}</Typography>
        <Typography variant="caption" sx={{ color: '#00A651', fontWeight: 700 }}>
          {isExpert ? 'Sessão Privada' : 'Fórum da Turma'}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        <Typography variant="caption" sx={{
          color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: 1, mb: 2, display: 'block',
        }}>
          Informações da Questão
        </Typography>

        <Stack spacing={2.5}>
          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>
              Disciplina
            </Typography>
            <Chip
              label={`${getSubjectEmoji(q)} ${getSubjectLabel(q, subjectsMap)}`}
              size="small"
              sx={{ bgcolor: discColor + '15', color: discColor, fontWeight: 800, borderRadius: 1 }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>
              Estado
            </Typography>
            <Chip
              label={q.status === 'ABERTA' ? 'Em aberto' : 'Encerrada'}
              size="small"
              sx={{
                bgcolor: q.status === 'ABERTA' ? '#DCFCE7' : '#F1F5F9',
                color: q.status === 'ABERTA' ? '#15803D' : '#64748B',
                fontWeight: 800,
              }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>
              Aguardou resposta
            </Typography>
            <Chip
              label={waitMinutes != null ? `⏱ ${formatWait(waitMinutes)}` : '⏳ Sem resposta ainda'}
              size="small"
              sx={{
                bgcolor: waitMinutes != null ? '#FFF7ED' : '#F8FAFC',
                color: waitMinutes != null ? '#C2410C' : '#94A3B8',
                fontWeight: 800, borderRadius: 1,
              }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.5 }}>
              Mensagens
            </Typography>
            <Typography variant="body2" fontWeight={700} color="#1E293B">
              {allAnswers.length} {allAnswers.length === 1 ? 'resposta' : 'respostas'}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="caption" sx={{
          color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: 1, mb: 2, display: 'block',
        }}>
          Participantes
        </Typography>

        <Stack spacing={1.5}>
          {participants.map((p, i) => (
            <Stack key={p} direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{
                width: 32, height: 32, fontSize: 11,
                bgcolor: i === 0 ? '#E8F5E9' : '#C8E6C9',
                color: i === 0 ? '#008f44' : '#00A651',
              }}>
                {initials(p)}
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }} noWrap>{p}</Typography>
                <Typography variant="caption" sx={{
                  color: i === 0 ? '#008f44' : '#00A651',
                  fontWeight: 700,
                }}>
                  {i === 0 ? 'Aluno' : 'Professor'}
                </Typography>
              </Box>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#00A651' }} />
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfessorForumPage() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  type SidebarTab = 'pending' | 'answered';
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pending');
  const [pendingList, setPendingList] = useState<ForumQuestion[]>([]);
  const [answeredList, setAnsweredList] = useState<ForumQuestion[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingAnswered, setLoadingAnswered] = useState(false);
  const [activeQ, setActiveQ] = useState<ForumQuestion | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [subjectsMap, setSubjectsMap] = useState<Map<number, SubjectInfo>>(new Map());

  const loadPending = () => {
    setLoadingPending(true);
    forumService.listProfessorPending()
      .then(setPendingList)
      .finally(() => setLoadingPending(false));
  };

  const loadAnswered = () => {
    setLoadingAnswered(true);
    forumService.listProfessorAnswered()
      .then(setAnsweredList)
      .finally(() => setLoadingAnswered(false));
  };

  useEffect(() => {
    loadPending();
    forumService.getAllActiveSubjects().then(list => {
      setSubjectsMap(new Map(list.map(s => [s.id, s])));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (sidebarTab === 'answered' && answeredList.length === 0) loadAnswered();
  }, [sidebarTab]);

  const handleSelectQuestion = (q: ForumQuestion) => {
    setActiveQ(q);
    setLoadingDetail(true);
    forumService.getQuestion(q.id).then(setActiveQ).finally(() => setLoadingDetail(false));
  };

  const reloadActiveQ = () => {
    if (!activeQ) return;
    forumService.getQuestion(activeQ.id).then(detail => {
      setActiveQ(detail);
      setPendingList(prev => prev.map(q => q.id === detail.id ? detail : q));
      setAnsweredList(prev => prev.map(q => q.id === detail.id ? detail : q));
      // Move question from pending to answered after professor replies
      loadPending();
      loadAnswered();
    });
  };

  const currentList = (sidebarTab === 'pending' ? pendingList : answeredList)
    .filter(q => !search || q.titulo.toLowerCase().includes(search.toLowerCase())
      || getSubjectLabel(q, subjectsMap).toLowerCase().includes(search.toLowerCase())
      || q.createdBy.toLowerCase().includes(search.toLowerCase()));

  const isLoading = sidebarTab === 'pending' ? loadingPending : loadingAnswered;

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <Box sx={{
        width: isMobile ? '100%' : SIDEBAR_W,
        display: isMobile && activeQ ? 'none' : 'flex',
        flexDirection: 'column',
        bgcolor: 'white', borderRight: '1px solid rgba(0,0,0,0.08)',
        zIndex: 20, flexShrink: 0,
      }}>
        {/* Header */}
        <Box sx={{
          px: 3, pt: 2.5, pb: 2,
          bgcolor: 'white',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{
                p: 1, borderRadius: 2,
                bgcolor: '#00A651',
                display: 'flex', alignItems: 'center',
              }}>
                <QuizIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography fontWeight={800} color="#0F172A" variant="subtitle1" sx={{ lineHeight: 1.1, fontSize: 15 }}>
                  PORTAL DE SUPORTE
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, letterSpacing: 0.4 }}>
                  Caixa de entrada
                </Typography>
              </Box>
            </Stack>

            <TextField
              size="small" fullWidth placeholder="Pesquisar aluno ou disciplina..."
              value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94A3B8', fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#F8FAFC', borderRadius: 2, color: '#0F172A',
                  '& fieldset': { border: '1px solid rgba(0,0,0,0.08)' },
                  '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.15)' },
                  '&.Mui-focused fieldset': { borderColor: '#00A651', borderWidth: 1.5 },
                  '& input': { py: 1, fontSize: 13, color: '#0F172A', '&::placeholder': { color: '#94A3B8', opacity: 1 } },
                },
              }}
            />
          </Stack>
        </Box>

        {/* Tab filters */}
        <Box sx={{
          px: 1, py: 1.5, bgcolor: 'white', borderBottom: '1px solid rgba(0,0,0,0.05)',
          display: 'flex', gap: 0.2, whiteSpace: 'nowrap',
          overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' },
        }}>
          {[
            { key: 'pending',  label: 'Pendentes',   count: pendingList.length },
            { key: 'answered', label: 'Respondidas',  count: answeredList.length },
          ].map(item => (
            <Chip
              key={item.key}
              label={`${item.label}${item.count > 0 ? ` (${item.count})` : ''}`}
              onClick={() => setSidebarTab(item.key as SidebarTab)}
              sx={{
                px: 0, height: 32, borderRadius: 2,
                bgcolor: sidebarTab === item.key ? '#00A651' : 'transparent',
                color: sidebarTab === item.key ? 'white' : '#64748B',
                fontWeight: 800, fontSize: 10.5,
                border: '1px solid',
                borderColor: sidebarTab === item.key ? '#00A651' : 'transparent',
                '&:hover': { bgcolor: sidebarTab === item.key ? '#008f44' : 'rgba(0,0,0,0.05)' },
                transition: 'all 0.2s',
                '& .MuiChip-label': { px: 1 },
              }}
            />
          ))}
        </Box>

        {/* Question list */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" pt={4}><CircularProgress size={24} /></Box>
          ) : currentList.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              {sidebarTab === 'pending'
                ? <PendingActionsIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
                : <DoneAllIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />}
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {search
                  ? 'Sem resultados.'
                  : sidebarTab === 'pending'
                    ? 'Sem perguntas pendentes.'
                    : 'Ainda não respondeu a nenhuma pergunta.'}
              </Typography>
            </Box>
          ) : currentList.map(q => (
            <SidebarItem
              key={q.id}
              q={q}
              active={activeQ?.id === q.id}
              onClick={() => handleSelectQuestion(q)}
              isPending={sidebarTab === 'pending'}
            />
          ))}
        </Box>
      </Box>

      {/* ── CENTER CHAT ──────────────────────────────────────────────────────── */}
      {activeQ ? (
        <Box sx={{
          flex: 1, minWidth: 0,
          display: isMobile && !activeQ ? 'none' : 'flex',
          flexDirection: 'column', overflow: 'hidden', bgcolor: 'white',
        }}>
          {/* Chat header */}
          <Box sx={{
            px: { xs: 2, md: 3 }, py: 1.8,
            borderBottom: '1px solid rgba(0,0,0,0.07)',
            bgcolor: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', zIndex: 10,
          }}>
            <Stack direction="row" spacing={2} alignItems="center">
              {isMobile && (
                <IconButton onClick={() => setActiveQ(null)} sx={{ color: '#64748B', ml: -1 }}>
                  <ArrowBackIcon />
                </IconButton>
              )}
              <Avatar sx={{
                width: { xs: 36, md: 44 }, height: { xs: 36, md: 44 }, flexShrink: 0,
                bgcolor: '#1E293B', color: 'white',
                border: '1px solid rgba(0,0,0,0.05)',
                fontSize: { xs: 13, md: 16 }, fontWeight: 800,
              }}>
                {initials(activeQ.createdBy)}
              </Avatar>
              <Box flex={1} minWidth={0}>
                <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ color: '#0F172A', lineHeight: 1.2, fontSize: { xs: 14, md: 16 } }}>
                  {activeQ.titulo}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: { xs: 10, md: 12 } }}>
                    {activeQ.createdBy}
                  </Typography>
                  <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto', mx: 0.5 }} />
                  <Chip
                    label={`${getSubjectEmoji(activeQ)} ${getSubjectLabel(activeQ, subjectsMap)}`}
                    size="small"
                    sx={{
                      height: 18, fontSize: 10, fontWeight: 700,
                      bgcolor: getSubjectColor(activeQ) + '15',
                      color: getSubjectColor(activeQ),
                    }}
                  />
                  <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto', mx: 0.5 }} />
                  <Typography variant="caption" sx={{
                    color: activeQ.questionType === 'ESPECIALIZADO' ? '#00A651' : '#4caf50',
                    fontWeight: 700, fontSize: { xs: 10, md: 12 },
                  }}>
                    {activeQ.questionType === 'ESPECIALIZADO' ? 'Sessão Privada' : 'Fórum da Turma'}
                  </Typography>
                </Stack>
              </Box>

              {activeQ.status === 'ABERTA' && (
                <Chip
                  label="Aguardando"
                  size="small"
                  sx={{ bgcolor: '#E8F5E9', color: '#00A651', fontWeight: 800, fontSize: 10 }}
                />
              )}
            </Stack>
          </Box>

          {loadingDetail ? (
            <Box flex={1} display="flex" justifyContent="center" alignItems="center">
              <CircularProgress />
            </Box>
          ) : (
            <ProfessorChatMessages q={activeQ} currentUser={user?.username ?? ''} />
          )}

          {!loadingDetail && activeQ.status === 'ABERTA' && (
            <ChatInput
              questionId={activeQ.id}
              questionType={activeQ.questionType}
              onSent={reloadActiveQ}
            />
          )}

          {!loadingDetail && activeQ.status === 'FECHADA' && (
            <Box sx={{ px: 3, py: 2, borderTop: '1px solid rgba(0,0,0,0.07)', bgcolor: '#F8FAFC', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Esta conversa está encerrada.
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{
          flex: 1, display: isMobile ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          bgcolor: '#F8FAFC', position: 'relative', overflow: 'hidden',
        }}>
          <Stack alignItems="center" spacing={3} sx={{ textAlign: 'center', p: 4, zIndex: 1, maxWidth: 400 }}>
            <Box sx={{
              width: 100, height: 100, borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
              bgcolor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
              animation: 'morph 8s ease-in-out infinite',
            }}>
              <ForumIcon sx={{ fontSize: 45, color: '#00A651' }} />
            </Box>
            <style>{`
              @keyframes morph {
                0%   { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
                50%  { border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%; }
                100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
              }
            `}</style>
            <Typography variant="h6" fontWeight={700} color="#1E293B">
              Selecione uma conversa
            </Typography>
            <Typography variant="body2" color="#64748B">
              Escolha uma pergunta na lista à esquerda para responder aos seus alunos.
            </Typography>
          </Stack>
        </Box>
      )}

      {/* ── DETAIL PANEL — hidden on mobile and tablet ───────────────────────── */}
      {!isMobile && !isTablet && activeQ && <DetailPanel q={activeQ} subjectsMap={subjectsMap} />}
    </Box>
  );
}
