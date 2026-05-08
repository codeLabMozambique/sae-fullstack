import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Typography, Stack, Tabs, Tab, Paper, Chip, Avatar,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  ToggleButton, ToggleButtonGroup, CircularProgress, Divider,
  List, ListItem, ListItemText, ListItemIcon, Collapse,
  IconButton, Alert, Tooltip, Badge, LinearProgress,
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CloseIcon from '@mui/icons-material/Close';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useAuth } from '../../context/AuthContext';
import { forumService } from '../../services/forumService';
import { professorAssignmentService, studentService, type ProfessorAssignmentDetailDTO } from '../../services/academicService';
import api from '../../services/api';
import type { ForumQuestion, DisciplinaEnum, ExpertAnswer, CollaborativeAnswer } from '../../types/forum';
import { DISCIPLINA_LABELS, DISCIPLINA_COLOR, DISCIPLINA_EMOJI } from '../../types/forum';

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── File attachment helper ──────────────────────────────────────────────────

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

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function AttachmentChip({ attachmentId, small }: { attachmentId?: string | null; small?: boolean }) {
  if (!attachmentId) return null;
  const url = `/content/api/user/uploads/${attachmentId}`;
  return (
    <Chip
      icon={<InsertDriveFileIcon fontSize="small" />}
      label="Anexo"
      size={small ? 'small' : 'medium'}
      component="a"
      href={url}
      target="_blank"
      clickable
      variant="outlined"
      color="primary"
      sx={{ mt: 0.5 }}
    />
  );
}

function FilePickerButton({ onPicked }: { onPicked: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) onPicked(e.target.files[0]); e.target.value = ''; }} />
      <Tooltip title="Anexar ficheiro (qualquer formato, máx. 25 MB)">
        <IconButton size="small" onClick={() => ref.current?.click()}>
          <AttachFileIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );
}

function QuestionCard({ q, onOpen }: { q: ForumQuestion; onOpen: (q: ForumQuestion) => void }) {
  const answerCount = (q.expertAnswers?.length ?? 0) + (q.collaborativeAnswers?.length ?? 0);
  const color = DISCIPLINA_COLOR[q.disciplina] ?? '#666';
  return (
    <Paper
      elevation={1}
      onClick={() => onOpen(q)}
      sx={{ p: 2, borderRadius: 2, cursor: 'pointer', borderLeft: `4px solid ${color}`, '&:hover': { boxShadow: 4 }, transition: 'box-shadow .15s' }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Box flex={1}>
          <Stack direction="row" spacing={1} alignItems="center" mb={0.5} flexWrap="wrap">
            <Chip
              label={`${DISCIPLINA_EMOJI[q.disciplina]} ${DISCIPLINA_LABELS[q.disciplina]}`}
              size="small"
              sx={{ bgcolor: color + '18', color, fontWeight: 600, border: `1px solid ${color}40` }}
            />
            <Chip
              label={q.questionType === 'ESPECIALIZADO' ? 'Professor' : 'Colaborativo'}
              size="small"
              icon={q.questionType === 'ESPECIALIZADO' ? <SchoolIcon /> : <GroupsIcon />}
              color={q.questionType === 'ESPECIALIZADO' ? 'primary' : 'success'}
              variant="outlined"
            />
            <Chip
              label={q.status === 'ABERTA' ? 'Aberta' : 'Fechada'}
              size="small"
              color={q.status === 'ABERTA' ? 'warning' : 'default'}
            />
          </Stack>
          <Typography fontWeight={600} sx={{ mb: 0.3 }}>{q.titulo}</Typography>
          {q.descricao !== '_' && (
            <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {q.descricao}
            </Typography>
          )}
        </Box>
        <Stack alignItems="flex-end" spacing={0.5} flexShrink={0}>
          <Typography variant="caption" color="text.secondary">{timeAgo(q.createdAt)}</Typography>
          {answerCount > 0 && (
            <Chip label={`${answerCount} resp.`} size="small" color="info" variant="outlined" />
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

// ── Reply box used inside question detail ────────────────────────────────────

function ReplyBox({ questionId, questionType, onSent }: { questionId: number; questionType: string; onSent: () => void }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      let attachmentId: string | null = null;
      if (file) {
        setUploading(true);
        const att = await uploadAttachment(file, 'forum', String(questionId));
        attachmentId = att.id;
        setUploading(false);
      }
      if (questionType === 'ESPECIALIZADO') {
        await forumService.createExpertAnswer(questionId, { conteudo: text, attachmentId });
      } else {
        await forumService.createCollaborativeAnswer(questionId, { conteudo: text, attachmentId });
      }
      setText('');
      setFile(null);
      onSent();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao enviar resposta.');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ borderRadius: 2, p: 1.5 }}>
        <TextField
          fullWidth multiline minRows={2} maxRows={6}
          placeholder="Escreva a sua resposta..."
          value={text}
          onChange={e => setText(e.target.value)}
          variant="standard"
          InputProps={{ disableUnderline: true }}
        />
        {file && (
          <Stack direction="row" spacing={1} alignItems="center" mt={1}>
            <InsertDriveFileIcon fontSize="small" color="primary" />
            <Typography variant="caption">{file.name} ({formatBytes(file.size)})</Typography>
            <IconButton size="small" onClick={() => setFile(null)}><CloseIcon fontSize="small" /></IconButton>
          </Stack>
        )}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
          <FilePickerButton onPicked={setFile} />
          <Button
            variant="contained" size="small" endIcon={sending || uploading ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
            disabled={!text.trim() || sending || uploading}
            onClick={handleSend}
            sx={{ borderRadius: 4, px: 2.5 }}
          >
            {uploading ? 'A carregar...' : 'Enviar'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

// ── Question detail dialog ───────────────────────────────────────────────────

function QuestionDetailDialog({ question, open, onClose, currentUser }: {
  question: ForumQuestion | null; open: boolean; onClose: () => void; currentUser: string;
}) {
  const [detail, setDetail] = useState<ForumQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState<number | null>(null);

  useEffect(() => {
    if (open && question) {
      setLoading(true);
      forumService.getQuestion(question.id).then(setDetail).finally(() => setLoading(false));
    }
  }, [open, question?.id]);

  const reload = () => {
    if (question) {
      setLoading(true);
      forumService.getQuestion(question.id).then(setDetail).finally(() => setLoading(false));
    }
  };

  const handleAccept = async (answerId: number) => {
    setAccepting(answerId);
    try { await forumService.acceptAnswer(answerId); reload(); } finally { setAccepting(null); }
  };

  if (!question) return null;
  const q = detail ?? question;
  const isOwner = q.createdBy === currentUser;
  const color = DISCIPLINA_COLOR[q.disciplina] ?? '#666';

  const answers: (ExpertAnswer | CollaborativeAnswer)[] = [
    ...(q.expertAnswers ?? []),
    ...(q.collaborativeAnswers ?? []),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Stack direction="row" spacing={1} mb={0.5} flexWrap="wrap">
              <Chip label={`${DISCIPLINA_EMOJI[q.disciplina]} ${DISCIPLINA_LABELS[q.disciplina]}`} size="small" sx={{ bgcolor: color + '18', color, fontWeight: 600 }} />
              <Chip label={q.questionType === 'ESPECIALIZADO' ? 'Professor' : 'Colaborativo'} size="small" color={q.questionType === 'ESPECIALIZADO' ? 'primary' : 'success'} variant="outlined" />
            </Stack>
            <Typography fontWeight={700} variant="h6">{q.titulo}</Typography>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Question body */}
        {q.descricao && q.descricao !== '_' && (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Avatar sx={{ width: 36, height: 36, bgcolor: color, fontSize: 13 }}>{initials(q.createdBy)}</Avatar>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{q.createdBy} · {timeAgo(q.createdAt)}</Typography>
                <Typography sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{q.descricao}</Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        <Divider sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {answers.length} resposta{answers.length !== 1 ? 's' : ''}
          </Typography>
        </Divider>

        {/* Answers — chat bubbles */}
        <Stack spacing={1.5}>
          {answers.map(a => {
            const isExpert = 'accepted' in a;
            const expertA = isExpert ? (a as ExpertAnswer) : null;
            const collabA = !isExpert ? (a as CollaborativeAnswer) : null;
            const accepted = expertA?.accepted;
            const isOwn = a.answeredBy === currentUser;

            const bubbleBg = isOwn
              ? 'primary.main'
              : isExpert
                ? '#E3F2FD'
                : '#F3F4F6';
            const bubbleColor = isOwn ? 'white' : 'text.primary';
            const avatarBg = isExpert ? '#1565c0' : '#388e3c';

            return (
              <Stack
                key={a.id}
                direction="row"
                justifyContent={isOwn ? 'flex-end' : 'flex-start'}
                alignItems="flex-end"
                spacing={1}
              >
                {/* Avatar — lado esquerdo (outros) */}
                {!isOwn && (
                  <Avatar sx={{ width: 30, height: 30, bgcolor: avatarBg, fontSize: 11, flexShrink: 0, mb: 0.5 }}>
                    {initials(a.answeredBy)}
                  </Avatar>
                )}

                <Box sx={{ maxWidth: '72%' }}>
                  {/* Nome acima do bubble */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    display="block"
                    sx={{ mb: 0.3, textAlign: isOwn ? 'right' : 'left', px: 0.5 }}
                  >
                    {isOwn ? 'Eu' : a.answeredBy}
                    {isExpert && !isOwn && (
                      <Chip label="Professor" size="small" color="primary"
                        sx={{ height: 16, fontSize: 10, ml: 0.5, verticalAlign: 'middle' }} />
                    )}
                    {' · '}{timeAgo(a.createdAt)}
                  </Typography>

                  {/* Bubble */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: '10px 14px',
                      borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      bgcolor: bubbleBg,
                      color: bubbleColor,
                      border: accepted ? '2px solid' : 'none',
                      borderColor: accepted ? 'success.main' : undefined,
                    }}
                  >
                    <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.5 }}>
                      {a.conteudo}
                    </Typography>
                    {a.attachmentId && (
                      <Box mt={0.5}>
                        <AttachmentChip attachmentId={a.attachmentId} small />
                      </Box>
                    )}
                  </Paper>

                  {/* Status chips + accept button abaixo do bubble */}
                  <Stack
                    direction="row"
                    spacing={0.5}
                    mt={0.5}
                    justifyContent={isOwn ? 'flex-end' : 'flex-start'}
                    flexWrap="wrap"
                  >
                    {accepted && (
                      <Chip label="✓ Aceite" size="small" color="success" sx={{ height: 18, fontSize: 11 }} />
                    )}
                    {collabA && (
                      <Chip
                        label={collabA.validationStatus === 'VALIDADA' ? '✓ Validada' : 'Pendente validação'}
                        size="small"
                        color={collabA.validationStatus === 'VALIDADA' ? 'success' : 'warning'}
                        sx={{ height: 18, fontSize: 11 }}
                      />
                    )}
                    {isOwner && expertA && !accepted && q.status === 'ABERTA' && (
                      <Button
                        size="small" color="success" variant="outlined"
                        startIcon={accepting === a.id
                          ? <CircularProgress size={11} color="inherit" />
                          : <CheckCircleIcon sx={{ fontSize: 14 }} />}
                        disabled={accepting === a.id}
                        onClick={() => handleAccept(a.id)}
                        sx={{ borderRadius: 3, py: 0, fontSize: 12, height: 22 }}
                      >
                        Aceitar
                      </Button>
                    )}
                  </Stack>
                </Box>

                {/* Avatar — lado direito (próprio utilizador) */}
                {isOwn && (
                  <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.dark', fontSize: 11, flexShrink: 0, mb: 0.5 }}>
                    {initials(a.answeredBy)}
                  </Avatar>
                )}
              </Stack>
            );
          })}
        </Stack>

        {/* Reply box — only if question is open */}
        {q.status === 'ABERTA' && !isOwner && (
          <ReplyBox questionId={q.id} questionType={q.questionType} onSent={reload} />
        )}
        {q.status === 'FECHADA' && (
          <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>Esta pergunta está fechada.</Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── New Question Dialog ──────────────────────────────────────────────────────

function NewQuestionDialog({ open, onClose, availableDisciplinas, onCreated }: {
  open: boolean; onClose: () => void;
  availableDisciplinas: { disciplina: DisciplinaEnum; professorName?: string }[];
  onCreated: () => void;
}) {
  const [disciplina, setDisciplina] = useState<DisciplinaEnum | ''>('');
  const [type, setType] = useState<'ESPECIALIZADO' | 'COLABORATIVO' | null>(null);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setDisciplina(''); setType(null); setMessage(''); setFile(null); setError(''); };

  const selected = availableDisciplinas.find(d => d.disciplina === disciplina);
  const showTypePicker = !!disciplina;
  const showCompose = !!disciplina && !!type;

  const handleSubmit = async () => {
    if (!disciplina || !type || !message.trim()) return;
    setSaving(true); setError('');
    try {
      let attachmentId: string | null = null;
      if (file) {
        const att = await uploadAttachment(file, 'forum');
        attachmentId = att.id;
      }
      const firstLine = message.split('\n')[0].substring(0, 150).trim();
      const titulo = firstLine || `Dúvida sobre ${DISCIPLINA_LABELS[disciplina as DisciplinaEnum]}`;
      await forumService.createQuestion({
        titulo,
        descricao: message.trim(),
        disciplina: disciplina as DisciplinaEnum,
        questionType: type,
      });
      // attachmentId will be used in future when the question creation endpoint supports it
      void attachmentId;
      reset(); onCreated(); onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erro ao criar a pergunta.');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={() => { reset(); onClose(); }} fullWidth maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>

      {/* Header */}
      <Box sx={{ px: 3, pt: 2.5, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <AddCircleIcon color="primary" />
            <Typography fontWeight={700} variant="h6">Nova Pergunta</Typography>
          </Stack>
          <IconButton size="small" onClick={() => { reset(); onClose(); }}><CloseIcon /></IconButton>
        </Stack>
      </Box>

      <DialogContent sx={{ pt: 2.5, pb: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {availableDisciplinas.length === 0 ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Nenhuma disciplina disponível para a sua turma. Contacte o administrador.
          </Alert>
        ) : (
          <Stack spacing={2.5}>

            {/* ── PASSO 1: Seleccionar disciplina ── */}
            <FormControl fullWidth size="small">
              <InputLabel>Seleccionar disciplina</InputLabel>
              <Select
                value={disciplina}
                label="Seleccionar disciplina"
                onChange={e => { setDisciplina(e.target.value as DisciplinaEnum); setType(null); setMessage(''); }}
              >
                {availableDisciplinas.map(({ disciplina: d }) => (
                  <MenuItem key={d} value={d}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span style={{ fontSize: 18 }}>{DISCIPLINA_EMOJI[d]}</span>
                      <span>{DISCIPLINA_LABELS[d]}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* ── PASSO 2: Mostrar professor + escolher tipo ── */}
            {showTypePicker && (
              <Box>
                {/* Professor card */}
                {selected?.professorName && (
                  <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, borderColor: 'primary.200', bgcolor: 'primary.50' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 38, height: 38, bgcolor: 'primary.main', fontSize: 13 }}>
                        {initials(selected.professorName)}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" color="primary.main" fontWeight={600}>Professor responsável</Typography>
                        <Typography fontWeight={700}>{selected.professorName}</Typography>
                      </Box>
                    </Stack>
                  </Paper>
                )}

                <Typography variant="caption" fontWeight={600} color="text.secondary" mb={1} display="block">
                  Como pretende obter ajuda?
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  {/* Botão Professor */}
                  <Paper
                    variant="outlined"
                    onClick={() => setType('ESPECIALIZADO')}
                    sx={{
                      flex: 1, p: 2, borderRadius: 2, cursor: 'pointer', textAlign: 'center',
                      borderWidth: 2,
                      borderColor: type === 'ESPECIALIZADO' ? 'primary.main' : 'divider',
                      bgcolor: type === 'ESPECIALIZADO' ? 'primary.50' : 'white',
                      transition: 'all .15s',
                      '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
                    }}
                  >
                    <SchoolIcon sx={{ fontSize: 30, color: type === 'ESPECIALIZADO' ? 'primary.main' : 'text.disabled', mb: 0.5 }} />
                    <Typography fontWeight={700} variant="body2">Com Professor</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.3}>
                      {selected?.professorName ? `Prof. ${selected.professorName.split(' ')[0]}` : 'Especializado'}
                    </Typography>
                  </Paper>

                  {/* Botão Colaborativo */}
                  <Paper
                    variant="outlined"
                    onClick={() => setType('COLABORATIVO')}
                    sx={{
                      flex: 1, p: 2, borderRadius: 2, cursor: 'pointer', textAlign: 'center',
                      borderWidth: 2,
                      borderColor: type === 'COLABORATIVO' ? 'success.main' : 'divider',
                      bgcolor: type === 'COLABORATIVO' ? '#f0fdf4' : 'white',
                      transition: 'all .15s',
                      '&:hover': { borderColor: 'success.main', bgcolor: '#f0fdf4' },
                    }}
                  >
                    <GroupsIcon sx={{ fontSize: 30, color: type === 'COLABORATIVO' ? 'success.main' : 'text.disabled', mb: 0.5 }} />
                    <Typography fontWeight={700} variant="body2">Colaborativo</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.3}>
                      Com colegas da turma
                    </Typography>
                  </Paper>
                </Stack>
              </Box>
            )}

            {/* ── PASSO 3: Campo de mensagem ── */}
            {showCompose && (
              <Box>
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor: type === 'COLABORATIVO' ? 'success.300' : 'primary.300',
                    overflow: 'hidden',
                  }}
                >
                  {/* Cabeçalho da sessão */}
                  <Box sx={{ px: 2, py: 1, bgcolor: type === 'COLABORATIVO' ? '#f0fdf4' : 'primary.50', borderBottom: 1, borderColor: 'divider' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {type === 'ESPECIALIZADO'
                        ? <SchoolIcon fontSize="small" color="primary" />
                        : <GroupsIcon fontSize="small" color="success" />}
                      <Typography variant="caption" fontWeight={600} color={type === 'COLABORATIVO' ? 'success.800' : 'primary.800'}>
                        {type === 'ESPECIALIZADO'
                          ? `Sessão com Prof. ${selected?.professorName ?? 'professor da disciplina'}`
                          : 'Sala colaborativa — colegas da turma vão poder responder'}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Área de texto */}
                  <Box sx={{ p: 1.5 }}>
                    <TextField
                      fullWidth multiline minRows={4} maxRows={10}
                      placeholder="Escreva a sua dúvida aqui..."
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      variant="standard"
                      InputProps={{ disableUnderline: true }}
                    />

                    {/* Ficheiro seleccionado */}
                    {file && (
                      <Stack direction="row" spacing={1} alignItems="center" mt={1}
                        sx={{ p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                        <InsertDriveFileIcon fontSize="small" color="primary" />
                        <Typography variant="caption" flex={1}>{file.name} ({formatBytes(file.size)})</Typography>
                        <IconButton size="small" onClick={() => setFile(null)}><CloseIcon fontSize="small" /></IconButton>
                      </Stack>
                    )}

                    {/* Barra de acções */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1.5}>
                      <Tooltip title="Anexar ficheiro (qualquer formato)">
                        <Box>
                          <FilePickerButton onPicked={setFile} />
                        </Box>
                      </Tooltip>
                      <Button
                        variant="contained"
                        size="small"
                        color={type === 'COLABORATIVO' ? 'success' : 'primary'}
                        endIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
                        disabled={!message.trim() || saving}
                        onClick={handleSubmit}
                        sx={{ borderRadius: 4, px: 3, fontWeight: 600 }}
                      >
                        {saving ? 'A enviar...' : 'Enviar'}
                      </Button>
                    </Stack>
                  </Box>
                </Paper>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => { reset(); onClose(); }} variant="outlined" sx={{ borderRadius: 2 }}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function StudentForumPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState(0);

  const [myQuestions, setMyQuestions] = useState<ForumQuestion[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);

  const [availableDisciplinas, setAvailableDisciplinas] = useState<{ disciplina: DisciplinaEnum; professorName?: string }[]>([]);
  const [loadingDisciplinas, setLoadingDisciplinas] = useState(false);

  const [newOpen, setNewOpen] = useState(false);
  const [detailQ, setDetailQ] = useState<ForumQuestion | null>(null);

  // Auto-open "Nova Pergunta" when navigating to /student/forum/new
  useEffect(() => {
    if (location.pathname.endsWith('/new')) {
      setNewOpen(true);
    }
  }, [location.pathname]);

  // Load "Minhas Perguntas"
  const loadMyQuestions = () => {
    setLoadingMy(true);
    forumService.getMyQuestions().then(setMyQuestions).finally(() => setLoadingMy(false));
  };

  useEffect(() => { loadMyQuestions(); }, []);

  // Load available disciplines from student's classroom assignments
  useEffect(() => {
    if (!user) return;
    setLoadingDisciplinas(true);
    // Fetch student profile to get classroomId
    api.get<{ classroomId: number }>('/auth/users/my-student-profile')
      .then(async res => {
        const classroomId = res.data?.classroomId;
        if (!classroomId) { setAvailableDisciplinas([]); return; }
        const assignments = await professorAssignmentService.findByClassroom(classroomId);
        // Get professors for each discipline
        const seen = new Set<DisciplinaEnum>();
        const disciplines: { disciplina: DisciplinaEnum; professorName?: string }[] = [];
        for (const a of assignments) {
          const d = subjectToDisciplina(a.subjectName);
          if (d && !seen.has(d)) {
            seen.add(d);
            // Fetch professor name from forum service
            try {
              const profs = await forumService.getProfessorsByDisciplina(d);
              disciplines.push({ disciplina: d, professorName: profs[0]?.fullname });
            } catch {
              disciplines.push({ disciplina: d });
            }
          }
        }
        setAvailableDisciplinas(disciplines);
      })
      .catch(() => setAvailableDisciplinas([]))
      .finally(() => setLoadingDisciplinas(false));
  }, [user]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <QuizIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Dúvidas e Perguntas</Typography>
            <Typography variant="body2" color="text.secondary">Submeta dúvidas e interaja com professores e colegas</Typography>
          </Box>
        </Stack>
        <Button
          variant="contained" startIcon={<AddCircleIcon />}
          onClick={() => setNewOpen(true)}
          sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}
        >
          Nova Pergunta
        </Button>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); if (v === 0) loadMyQuestions(); }} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={<Badge badgeContent={myQuestions.length} color="primary" max={99}>Minhas Perguntas</Badge>} />
        <Tab label="Fórum Geral" />
      </Tabs>

      {/* Minhas Perguntas */}
      {tab === 0 && (
        <>
          {loadingMy ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : myQuestions.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <QuizIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary" variant="h6">Ainda não submeteu nenhuma pergunta.</Typography>
              <Typography color="text.secondary" variant="body2" mt={0.5}>Clique em "Nova Pergunta" para começar.</Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {myQuestions.map(q => (
                <QuestionCard key={q.id} q={q} onOpen={setDetailQ} />
              ))}
            </Stack>
          )}
        </>
      )}

      {/* Fórum Geral — mostra perguntas abertas de qualquer aluno nas disciplinas disponíveis */}
      {tab === 1 && (
        <GeneralForumTab availableDisciplinas={availableDisciplinas} onOpen={setDetailQ} />
      )}

      {/* Dialogs */}
      <NewQuestionDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        availableDisciplinas={loadingDisciplinas ? [] : availableDisciplinas}
        onCreated={loadMyQuestions}
      />
      <QuestionDetailDialog
        open={!!detailQ}
        question={detailQ}
        onClose={() => { setDetailQ(null); loadMyQuestions(); }}
        currentUser={user?.username ?? ''}
      />
    </Box>
  );
}

// ── General forum tab ────────────────────────────────────────────────────────

function GeneralForumTab({ availableDisciplinas, onOpen }: {
  availableDisciplinas: { disciplina: DisciplinaEnum }[];
  onOpen: (q: ForumQuestion) => void;
}) {
  const [filterDisciplina, setFilterDisciplina] = useState<DisciplinaEnum | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'ESPECIALIZADO' | 'COLABORATIVO'>('ALL');
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    forumService.listQuestions({
      disciplina: filterDisciplina !== 'ALL' ? filterDisciplina : undefined,
      questionType: filterType !== 'ALL' ? filterType : undefined,
      status: 'ABERTA',
      size: 50,
    }).then(r => setQuestions(r.content)).finally(() => setLoading(false));
  }, [filterDisciplina, filterType]);

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Disciplina</InputLabel>
          <Select value={filterDisciplina} label="Disciplina" onChange={e => setFilterDisciplina(e.target.value as any)}>
            <MenuItem value="ALL">Todas</MenuItem>
            {availableDisciplinas.map(({ disciplina: d }) => (
              <MenuItem key={d} value={d}>{DISCIPLINA_EMOJI[d]} {DISCIPLINA_LABELS[d]}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <ToggleButtonGroup value={filterType} exclusive size="small" onChange={(_, v) => v && setFilterType(v)}>
          <ToggleButton value="ALL">Todos</ToggleButton>
          <ToggleButton value="ESPECIALIZADO"><SchoolIcon fontSize="small" sx={{ mr: 0.5 }} />Professor</ToggleButton>
          <ToggleButton value="COLABORATIVO"><GroupsIcon fontSize="small" sx={{ mr: 0.5 }} />Colaborativo</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : questions.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">Nenhuma pergunta aberta com estes filtros.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {questions.map(q => <QuestionCard key={q.id} q={q} onOpen={onOpen} />)}
        </Stack>
      )}
    </Box>
  );
}
