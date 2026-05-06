import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, CircularProgress, Avatar,
  Chip, Stack,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import InboxIcon from '@mui/icons-material/Inbox';
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

const DisciplineCard: React.FC<{
  disciplina: DisciplinaEnum;
  onClick: (d: DisciplinaEnum) => void;
  loading: boolean;
}> = ({ disciplina, onClick, loading }) => {
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
        border: `2px solid ${color}25`,
        bgcolor: `${color}08`,
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.18s',
        minHeight: 110,
        userSelect: 'none',
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
          <Typography
            variant="body2"
            fontWeight={700}
            color={color}
            textAlign="center"
            fontSize="0.82rem"
          >
            {label}
          </Typography>
        </>
      )}
    </Box>
  );
};

const InboxRow: React.FC<{ question: ForumQuestion; onClick: () => void }> = ({ question, onClick }) => {
  const color = DISCIPLINA_COLOR[question.disciplina] ?? '#374151';
  const preview = question.descricao === '_' ? 'Aguarda resposta...' : question.descricao;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2.5,
        py: 1.75,
        cursor: 'pointer',
        borderBottom: '1px solid #F3F4F6',
        transition: 'background 0.15s',
        '&:hover': { bgcolor: '#F9FAFB' },
      }}
    >
      <Avatar
        sx={{
          bgcolor: `${color}18`,
          color,
          fontWeight: 700,
          width: 42,
          height: 42,
          fontSize: '0.85rem',
          flexShrink: 0,
        }}
      >
        {initials(question.createdBy)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={0.3}>
          <Typography variant="body2" fontWeight={700} color="#111827" noWrap>
            {question.createdBy}
          </Typography>
          <Chip
            label={DISCIPLINA_LABELS[question.disciplina]}
            size="small"
            sx={{
              bgcolor: `${color}15`,
              color,
              fontWeight: 700,
              fontSize: '0.6rem',
              height: 16,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Stack>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {preview}
        </Typography>
      </Box>

      <Typography variant="caption" color="#9CA3AF" sx={{ flexShrink: 0 }}>
        {formatRelative(question.createdAt)}
      </Typography>
    </Box>
  );
};

const ForumList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isProfessor = user?.role === 'Professor';

  const [tab, setTab] = useState(0);
  const [loadingDisc, setLoadingDisc] = useState<DisciplinaEnum | null>(null);

  const [inbox, setInbox] = useState<ForumQuestion[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxLoaded, setInboxLoaded] = useState(false);

  const loadInbox = useCallback(async () => {
    if (inboxLoaded) return;
    setInboxLoading(true);
    try {
      const res = await forumService.listProfessorInbox({ size: 30 });
      setInbox(res.content);
      setInboxLoaded(true);
    } finally {
      setInboxLoading(false);
    }
  }, [inboxLoaded]);

  const openCollaborativeRoom = async (disciplina: DisciplinaEnum) => {
    setLoadingDisc(disciplina);
    try {
      const room = await forumService.getCollaborativeRoom(disciplina);
      navigate(`/app/forum/room/${room.id}`);
    } finally {
      setLoadingDisc(null);
    }
  };

  const openExpertRoom = async (disciplina: DisciplinaEnum) => {
    setLoadingDisc(disciplina);
    try {
      const room = await forumService.getExpertRoom(disciplina);
      navigate(`/app/forum/room/${room.id}`);
    } finally {
      setLoadingDisc(null);
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, v: number) => {
    setTab(v);
    if (isProfessor && v === 1) loadInbox();
  };

  const accentCollab = '#16A34A';
  const accentExpert = '#2563EB';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#0A1628">Chat</Typography>
        <Typography variant="body2" color="text.secondary">
          Seleciona onde queres conversar
        </Typography>
      </Box>

      {/* Main card */}
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

        {/* ── Tab 0: Chat da Turma (discipline cards) ── */}
        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" mb={2.5}>
              Clica numa disciplina para entrar na conversa da turma
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: 1.5,
              }}
            >
              {ALL_DISCIPLINAS.map(d => (
                <DisciplineCard
                  key={d}
                  disciplina={d}
                  onClick={openCollaborativeRoom}
                  loading={loadingDisc === d}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* ── Tab 1: Expert (students) or Inbox (professors) ── */}
        {tab === 1 && !isProfessor && (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" mb={2.5}>
              Clica numa disciplina para falar directamente com o professor
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: 1.5,
              }}
            >
              {ALL_DISCIPLINAS.map(d => (
                <DisciplineCard
                  key={d}
                  disciplina={d}
                  onClick={openExpertRoom}
                  loading={loadingDisc === d}
                />
              ))}
            </Box>
          </Box>
        )}

        {tab === 1 && isProfessor && (
          <Box>
            {inboxLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: accentExpert }} size={28} />
              </Box>
            ) : inbox.length === 0 && inboxLoaded ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <InboxIcon sx={{ fontSize: 52, color: '#E5E7EB', mb: 1.5 }} />
                <Typography fontWeight={600} color="text.secondary">
                  Sem questões em aberto
                </Typography>
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
