import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box, Typography, Tabs, Tab, CircularProgress, Avatar,
  Chip, Stack, TextField, Button, Alert, Collapse, Divider,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import InboxIcon from '@mui/icons-material/Inbox';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { useNavigate } from 'react-router-dom';
import { forumService } from '../../services/forumService';
import { useAuth } from '../../context/AuthContext';
import {
  ALL_DISCIPLINAS, DISCIPLINA_LABELS, DISCIPLINA_EMOJI, DISCIPLINA_COLOR,
  type DisciplinaEnum, type ForumQuestion,
} from '../../types/forum';

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return `${diff}min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}

function initials(name: string): string {
  return name
    .split(/[\s._@-]+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

/* ─── Discipline card ─────────────────────────────────────────── */
const DisciplineCard: React.FC<{
  disciplina: DisciplinaEnum;
  onClick: (d: DisciplinaEnum) => void;
  selected?: boolean;
  loading?: boolean;
}> = ({ disciplina, onClick, selected, loading }) => {
  const color = DISCIPLINA_COLOR[disciplina];
  const emoji = DISCIPLINA_EMOJI[disciplina];
  const label = DISCIPLINA_LABELS[disciplina];

  return (
    <Box
      onClick={() => !loading && onClick(disciplina)}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2.5,
        borderRadius: 3,
        border: selected ? `2px solid ${color}` : `2px solid ${color}25`,
        bgcolor: selected ? `${color}18` : `${color}08`,
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.18s',
        minHeight: 110,
        userSelect: 'none',
        boxShadow: selected ? `0 4px 16px ${color}30` : 'none',
        '&:hover': {
          border: `2px solid ${color}60`,
          bgcolor: `${color}14`,
          transform: 'translateY(-2px)',
          boxShadow: `0 6px 20px ${color}25`,
        },
        '&:active': { transform: 'scale(0.97)' },
      }}
    >
      {loading ? (
        <CircularProgress size={28} sx={{ color }} />
      ) : (
        <>
          <Typography fontSize="2rem" mb={0.75} lineHeight={1}>{emoji}</Typography>
          <Typography variant="body2" fontWeight={700} color={color} textAlign="center" fontSize="0.82rem">
            {label}
          </Typography>
          {selected && <CheckCircleIcon sx={{ fontSize: 14, color, mt: 0.5 }} />}
        </>
      )}
    </Box>
  );
};

/* ─── Question row (list item) ────────────────────────────────── */
const QuestionRow: React.FC<{
  question: ForumQuestion;
  onClick: () => void;
  isCollab: boolean;
}> = ({ question, onClick, isCollab }) => {
  const color = DISCIPLINA_COLOR[question.disciplina] ?? '#374151';
  const label = DISCIPLINA_LABELS[question.disciplina];
  const emoji = DISCIPLINA_EMOJI[question.disciplina];
  const msgCount = isCollab
    ? (question.collaborativeAnswers?.length ?? 0)
    : (question.expertAnswers?.length ?? 0);
  const rawDesc = question.descricao ?? '';
  const preview = rawDesc === '_'
    ? 'Aguarda resposta...'
    : rawDesc.slice(0, 80) + (rawDesc.length > 80 ? '...' : '');

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 2,
        px: 2.5, py: 1.75, cursor: 'pointer',
        borderBottom: '1px solid #F3F4F6',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: '#F9FAFB' },
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Avatar sx={{ bgcolor: `${color}18`, color, fontWeight: 700, width: 42, height: 42, fontSize: '1.1rem', flexShrink: 0 }}>
        {emoji}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={0.3}>
          <Typography variant="body2" fontWeight={700} color="#111827" noWrap>{label}</Typography>
          <Chip
            label={question.status === 'FECHADA' ? 'Encerrada' : 'Aberta'}
            size="small"
            sx={{
              bgcolor: question.status === 'FECHADA' ? '#F3F4F6' : '#DCFCE7',
              color: question.status === 'FECHADA' ? '#9CA3AF' : '#16A34A',
              fontWeight: 700, fontSize: '0.58rem', height: 15,
              '& .MuiChip-label': { px: 0.5 },
            }}
          />
        </Stack>
        {!isCollab && (
          <Typography variant="caption" color="#6B7280" sx={{ display: 'block' }}>
            {question.createdBy}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary"
          sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {preview}
        </Typography>
      </Box>

      <Stack alignItems="center" gap={0.25} sx={{ flexShrink: 0 }}>
        <QuestionAnswerIcon sx={{ fontSize: 14, color: '#D1D5DB' }} />
        <Typography variant="caption" color="#9CA3AF" fontSize="0.65rem">{msgCount}</Typography>
      </Stack>
    </Box>
  );
};

/* ─── Inbox row (professor) ───────────────────────────────────── */
const InboxRow: React.FC<{ question: ForumQuestion; onClick: () => void }> = ({ question, onClick }) => {
  const color = DISCIPLINA_COLOR[question.disciplina] ?? '#374151';
  const rawDesc = question.descricao ?? '';
  const preview = rawDesc === '_' ? 'Aguarda resposta...' : rawDesc;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 2,
        px: 2.5, py: 1.75, cursor: 'pointer',
        borderBottom: '1px solid #F3F4F6',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: '#F9FAFB' },
      }}
    >
      <Avatar sx={{ bgcolor: `${color}18`, color, fontWeight: 700, width: 42, height: 42, fontSize: '0.85rem', flexShrink: 0 }}>
        {initials(question.createdBy)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={0.3}>
          <Typography variant="body2" fontWeight={700} color="#111827" noWrap>{question.createdBy}</Typography>
          <Chip
            label={DISCIPLINA_LABELS[question.disciplina]}
            size="small"
            sx={{ bgcolor: `${color}15`, color, fontWeight: 700, fontSize: '0.6rem', height: 16, '& .MuiChip-label': { px: 0.75 } }}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary"
          sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {preview}
        </Typography>
      </Box>
      <Typography variant="caption" color="#9CA3AF" sx={{ flexShrink: 0 }}>
        {formatRelative(question.createdAt)}
      </Typography>
    </Box>
  );
};

/* ─── Inline question form ────────────────────────────────────── */
const InlineForm: React.FC<{
  disciplina: DisciplinaEnum;
  isCollab: boolean;
  submitting: boolean;
  error: string;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onCancel: () => void;
  onClearError: () => void;
}> = ({ disciplina, isCollab, submitting, error, value, onChange, onSend, onCancel, onClearError }) => {
  const color = DISCIPLINA_COLOR[disciplina];
  const label = DISCIPLINA_LABELS[disciplina];
  const emoji = DISCIPLINA_EMOJI[disciplina];

  return (
    <Box sx={{ mt: 2, bgcolor: `${color}08`, border: `1px solid ${color}30`, borderRadius: 3, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ bgcolor: `${color}15`, px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${color}20` }}>
        {isCollab ? (
          <GroupsIcon sx={{ fontSize: 20, color }} />
        ) : (
          <Avatar sx={{ bgcolor: color, width: 30, height: 30 }}>
            <SchoolIcon sx={{ fontSize: 16 }} />
          </Avatar>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={700} color={color}>
            {isCollab ? `${emoji} ${label} — Chat da Turma` : `@Prof. de ${label}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isCollab
              ? 'A tua mensagem ficará visível para toda a turma'
              : 'O professor será notificado imediatamente após o envio'}
          </Typography>
        </Box>
        {!isCollab && (
          <Chip
            label="Notificação automática"
            size="small"
            sx={{ bgcolor: '#fff', color, fontWeight: 700, fontSize: '0.6rem', height: 18, border: `1px solid ${color}40`, '& .MuiChip-label': { px: 0.75 } }}
          />
        )}
      </Box>

      {/* Body */}
      <Box sx={{ p: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }} onClose={onClearError}>{error}</Alert>
        )}
        <TextField
          fullWidth multiline rows={4} autoFocus
          placeholder={isCollab
            ? `Escreve a tua mensagem para a turma de ${label}...`
            : `Descreve a tua dúvida ao professor de ${label}...`}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); onSend(); } }}
          sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2, '&.Mui-focused fieldset': { borderColor: color } } }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">Ctrl+Enter para enviar</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="text" onClick={onCancel} sx={{ textTransform: 'none', color: '#9CA3AF' }}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              endIcon={submitting
                ? <CircularProgress size={14} sx={{ color: '#fff' }} />
                : <SendIcon fontSize="small" />}
              disabled={submitting || !value.trim()}
              onClick={onSend}
              sx={{ bgcolor: color, textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5, '&:hover': { filter: 'brightness(0.9)' } }}
            >
              {submitting ? 'A enviar...' : (isCollab ? 'Enviar' : 'Enviar ao Professor')}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

/* ─── Main component ──────────────────────────────────────────── */
const ForumList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isProfessor = user?.role === 'Professor';

  const [tab, setTab] = useState(0);

  // Inline form state
  const [selectedDisc, setSelectedDisc] = useState<DisciplinaEnum | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Professor direct-navigate loading
  const [loadingDisc, setLoadingDisc] = useState<DisciplinaEnum | null>(null);
  const [topError, setTopError] = useState('');

  // Questions from DB
  const [collabQuestions, setCollabQuestions] = useState<ForumQuestion[]>([]);
  const [expertQuestions, setExpertQuestions] = useState<ForumQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);

  // Professor inbox
  const [inbox, setInbox] = useState<ForumQuestion[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxLoaded, setInboxLoaded] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  const loadCollabQuestions = useCallback(async () => {
    setLoadingQ(true);
    try {
      const res = await forumService.listQuestions({ questionType: 'COLABORATIVO', size: 30 });
      setCollabQuestions(res.content);
    } catch { /* silent — questions list is best-effort */ }
    finally { setLoadingQ(false); }
  }, []);

  const loadExpertQuestions = useCallback(async () => {
    setLoadingQ(true);
    try {
      const res = await forumService.listQuestions({ questionType: 'ESPECIALIZADO', size: 30 });
      setExpertQuestions(res.content);
    } catch { /* silent */ }
    finally { setLoadingQ(false); }
  }, []);

  const loadInbox = useCallback(async () => {
    if (inboxLoaded) return;
    setInboxLoading(true);
    try {
      const res = await forumService.listProfessorInbox({ size: 30 });
      setInbox(res.content);
      setInboxLoaded(true);
    } finally { setInboxLoading(false); }
  }, [inboxLoaded]);

  useEffect(() => {
    if (tab === 0) loadCollabQuestions();
    else if (isProfessor) loadInbox();
    else loadExpertQuestions();
  }, [tab, isProfessor, loadCollabQuestions, loadExpertQuestions, loadInbox]);

  // Scroll form into view when a discipline is selected
  useEffect(() => {
    if (selectedDisc) {
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
    }
  }, [selectedDisc]);

  const resetForm = () => {
    setSelectedDisc(null);
    setNewMessage('');
    setFormError('');
  };

  const handleTabChange = (_: React.SyntheticEvent, v: number) => {
    setTab(v);
    resetForm();
    setTopError('');
  };

  const handleDisciplineClick = (disciplina: DisciplinaEnum) => {
    if (isProfessor) {
      // Professors go straight into the collaborative room
      navigateProfessorToRoom(disciplina);
      return;
    }
    // Toggle: clicking the same card again closes the form
    if (selectedDisc === disciplina) {
      resetForm();
      return;
    }
    setSelectedDisc(disciplina);
    setNewMessage('');
    setFormError('');
  };

  const navigateProfessorToRoom = async (disciplina: DisciplinaEnum) => {
    setLoadingDisc(disciplina);
    setTopError('');
    try {
      const room = await forumService.getCollaborativeRoom(disciplina);
      navigate(`/app/forum/room/${room.id}`);
    } catch (e: any) {
      setTopError(e?.response?.data?.message || 'Não foi possível aceder à sala. Verifica se o servidor está activo.');
    } finally {
      setLoadingDisc(null);
    }
  };

  const handleSendCollab = async () => {
    if (!selectedDisc || !newMessage.trim()) return;
    setSubmitting(true);
    setFormError('');
    try {
      const room = await forumService.getCollaborativeRoom(selectedDisc);
      await forumService.createCollaborativeAnswer(room.id, { conteudo: newMessage.trim() });
      navigate(`/app/forum/room/${room.id}`);
    } catch (e: any) {
      setFormError(e?.response?.data?.message || 'Não foi possível enviar. Verifica se o servidor está activo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendExpert = async () => {
    if (!selectedDisc || !newMessage.trim()) return;
    setSubmitting(true);
    setFormError('');
    try {
      const room = await forumService.getExpertRoom(selectedDisc);
      if (room.descricao === '_') {
        await forumService.updateFirstMessage(room.id, newMessage.trim());
      }
      navigate(`/app/forum/room/${room.id}`);
    } catch (e: any) {
      setFormError(e?.response?.data?.message || 'Não foi possível criar a conversa. Verifica se o servidor está activo.');
    } finally {
      setSubmitting(false);
    }
  };

  const accentCollab = '#16A34A';
  const accentExpert = '#2563EB';

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#0A1628">Chat</Typography>
        <Typography variant="body2" color="text.secondary">Seleciona onde queres conversar</Typography>
      </Box>

      {topError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTopError('')}>{topError}</Alert>
      )}

      <Box sx={{ bgcolor: '#fff', borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: '1px solid #F3F4F6', px: 2 }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            slotProps={{ indicator: { style: { backgroundColor: tab === 0 ? accentCollab : accentExpert, height: 3, borderRadius: '3px 3px 0 0' } } }}
            sx={{ minHeight: 52 }}
          >
            <Tab
              icon={<GroupsIcon fontSize="small" />}
              iconPosition="start"
              label="Chat da Turma"
              sx={{ textTransform: 'none', fontWeight: tab === 0 ? 700 : 400, color: tab === 0 ? accentCollab : '#6B7280', minHeight: 52, fontSize: '0.88rem', gap: 0.5 }}
            />
            <Tab
              icon={isProfessor ? <InboxIcon fontSize="small" /> : <SchoolIcon fontSize="small" />}
              iconPosition="start"
              label={isProfessor ? 'Caixa de Entrada' : 'Chat com Professor'}
              sx={{ textTransform: 'none', fontWeight: tab === 1 ? 700 : 400, color: tab === 1 ? accentExpert : '#6B7280', minHeight: 52, fontSize: '0.88rem', gap: 0.5 }}
            />
          </Tabs>
        </Box>

        {/* ── Tab 0: Chat da Turma ── */}
        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {isProfessor
                ? 'Entra numa sala da turma para acompanhar as conversas'
                : 'Clica numa disciplina para entrar · O professor receberá notificação das tuas mensagens'}
            </Typography>

            {/* Discipline grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 1.5 }}>
              {ALL_DISCIPLINAS.map(d => (
                <DisciplineCard
                  key={d}
                  disciplina={d}
                  onClick={handleDisciplineClick}
                  selected={selectedDisc === d}
                  loading={loadingDisc === d}
                />
              ))}
            </Box>

            {/* Inline form (students only) */}
            {!isProfessor && (
              <Collapse in={!!selectedDisc}>
                <Box ref={formRef}>
                  {selectedDisc && (
                    <InlineForm
                      disciplina={selectedDisc}
                      isCollab
                      submitting={submitting}
                      error={formError}
                      value={newMessage}
                      onChange={setNewMessage}
                      onSend={handleSendCollab}
                      onCancel={resetForm}
                      onClearError={() => setFormError('')}
                    />
                  )}
                </Box>
              </Collapse>
            )}

            {/* Questions list (hidden while form is open) */}
            {!selectedDisc && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Conversas Recentes da Turma
                  </Typography>
                </Divider>
                {loadingQ ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} sx={{ color: accentCollab }} />
                  </Box>
                ) : collabQuestions.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <GroupsIcon sx={{ fontSize: 36, color: '#E5E7EB', mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography variant="body2" color="text.secondary">Ainda não há conversas</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Clica numa disciplina acima para começar
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #F3F4F6' }}>
                    {collabQuestions.map(q => (
                      <QuestionRow
                        key={q.id}
                        question={q}
                        isCollab
                        onClick={() => navigate(`/app/forum/room/${q.id}`)}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* ── Tab 1: Chat com Professor (students) ── */}
        {tab === 1 && !isProfessor && (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Clica numa disciplina · Conversa privada directamente com o professor da área
            </Typography>

            {/* Discipline grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 1.5 }}>
              {ALL_DISCIPLINAS.map(d => (
                <DisciplineCard
                  key={d}
                  disciplina={d}
                  onClick={handleDisciplineClick}
                  selected={selectedDisc === d}
                />
              ))}
            </Box>

            {/* Inline form */}
            <Collapse in={!!selectedDisc}>
              <Box ref={formRef}>
                {selectedDisc && (
                  <InlineForm
                    disciplina={selectedDisc}
                    isCollab={false}
                    submitting={submitting}
                    error={formError}
                    value={newMessage}
                    onChange={setNewMessage}
                    onSend={handleSendExpert}
                    onCancel={resetForm}
                    onClearError={() => setFormError('')}
                  />
                )}
              </Box>
            </Collapse>

            {/* Student's expert conversations */}
            {!selectedDisc && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    As Minhas Conversas com Professores
                  </Typography>
                </Divider>
                {loadingQ ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} sx={{ color: accentExpert }} />
                  </Box>
                ) : expertQuestions.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <SchoolIcon sx={{ fontSize: 36, color: '#E5E7EB', mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography variant="body2" color="text.secondary">Ainda não iniciaste nenhuma conversa</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Clica numa disciplina acima para começar
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #F3F4F6' }}>
                    {expertQuestions.map(q => (
                      <QuestionRow
                        key={q.id}
                        question={q}
                        isCollab={false}
                        onClick={() => navigate(`/app/forum/room/${q.id}`)}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* ── Tab 1: Caixa de Entrada (professors) ── */}
        {tab === 1 && isProfessor && (
          <Box>
            {inboxLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: accentExpert }} size={28} />
              </Box>
            ) : inbox.length === 0 && inboxLoaded ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <InboxIcon sx={{ fontSize: 52, color: '#E5E7EB', mb: 1.5 }} />
                <Typography fontWeight={600} color="text.secondary">Sem questões em aberto</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Os alunos ainda não iniciaram conversas
                </Typography>
              </Box>
            ) : (
              inbox.map(q => (
                <InboxRow
                  key={q.id}
                  question={q}
                  onClick={() => navigate(`/app/forum/room/${q.id}`)}
                />
              ))
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ForumList;
