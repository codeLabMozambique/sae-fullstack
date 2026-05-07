import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, TextField, CircularProgress,
  Chip, Stack, Alert, Avatar, IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import LockIcon from '@mui/icons-material/Lock';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import { useParams, useNavigate } from 'react-router-dom';
import { forumService } from '../../services/forumService';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';
import ValidationBadge from '../../components/forum/ValidationBadge';
import {
  DISCIPLINA_LABELS, DISCIPLINA_COLOR, DISCIPLINA_EMOJI,
  type ForumQuestion, type ExpertAnswer, type CollaborativeAnswer,
} from '../../types/forum';

function initials(name: string): string {
  return name
    .split(/[\s._@-]+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}

type Message =
  | { kind: 'expert'; data: ExpertAnswer }
  | { kind: 'collab'; data: CollaborativeAnswer };

const ChatRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribe } = useWebSocket();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [question, setQuestion] = useState<ForumQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [firstMsg, setFirstMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [settingFirst, setSettingFirst] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setQuestion(await forumService.getQuestion(Number(id)));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!id) return;
    subscribe(`/topic/answers/${id}`, () => load());
    subscribe(`/topic/validations/${id}`, () => load());
  }, [id, subscribe, load]);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [question, loading]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!question) {
    return <Alert severity="error">Conversa não encontrada.</Alert>;
  }

  const isSpec = question.questionType === 'ESPECIALIZADO';
  const isCollab = !isSpec;
  const disciplinaColor = DISCIPLINA_COLOR[question.disciplina] ?? '#374151';
  const disciplinaLabel = DISCIPLINA_LABELS[question.disciplina] ?? question.disciplina;
  const disciplinaEmoji = DISCIPLINA_EMOJI[question.disciplina] ?? '💬';
  const accent = isSpec ? '#2563EB' : '#16A34A';
  const accentDark = isSpec ? '#1D4ED8' : '#15803D';
  const accentLight = isSpec ? '#DBEAFE' : '#DCFCE7';

  const isProfessor = user?.role === 'Professor';
  const isOwner = user?.username === question.createdBy;
  const isSystemRoom = question.createdBy === 'system';
  const isFirstMsgPending = isSpec && question.descricao === '_';

  // Collaborative: anyone can post; Expert: only professor can reply
  const canAnswer =
    isCollab
      ? question.status === 'ABERTA'
      : isProfessor && question.status === 'ABERTA';

  const messages: Message[] = isSpec
    ? (question.expertAnswers ?? []).map(d => ({ kind: 'expert' as const, data: d }))
    : (question.collaborativeAnswers ?? []).map(d => ({ kind: 'collab' as const, data: d }));

  messages.sort((a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime());

  const isMine = (username: string) => user?.username === username;

  const handleSubmit = async () => {
    if (!answer.trim() || !question) return;
    setSubmitting(true);
    setError('');
    try {
      if (isSpec) {
        await forumService.createExpertAnswer(question.id, { conteudo: answer });
      } else {
        await forumService.createCollaborativeAnswer(question.id, { conteudo: answer });
      }
      setAnswer('');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao enviar mensagem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendFirstMessage = async () => {
    if (!firstMsg.trim()) return;
    setSettingFirst(true);
    setError('');
    try {
      await forumService.updateFirstMessage(question.id, firstMsg.trim());
      setFirstMsg('');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao enviar mensagem');
    } finally {
      setSettingFirst(false);
    }
  };

  const handleAccept = async (answerId: number) => {
    try {
      await forumService.acceptAnswer(answerId);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao aceitar resposta');
    }
  };

  const handleValidate = async (answerId: number) => {
    setProcessing(answerId);
    try {
      await forumService.validateAnswer(answerId);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao validar');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (answerId: number) => {
    setProcessing(answerId);
    try {
      await forumService.rejectAnswer(answerId);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao rejeitar');
    } finally {
      setProcessing(null);
    }
  };

  const headerTitle = isCollab
    ? `${disciplinaLabel} — Chat da Turma`
    : isSystemRoom
      ? `${disciplinaLabel} — Chat com Professor`
      : isProfessor
        ? `${disciplinaLabel} — Chat com ${question.createdBy}`
        : `${disciplinaLabel} — Chat com Professor`;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: { xs: 'calc(100vh - 150px)', sm: 'calc(100vh - 175px)' },
        minHeight: 500,
        bgcolor: '#fff',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.5,
          borderBottom: `3px solid ${accent}`,
          bgcolor: '#fff',
        }}
      >
        <IconButton size="small" onClick={() => navigate('/app/forum')} sx={{ color: '#6B7280' }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Avatar
          sx={{
            bgcolor: `${disciplinaColor}18`,
            color: disciplinaColor,
            fontWeight: 700,
            width: 38,
            height: 38,
            fontSize: '1.1rem',
          }}
        >
          {disciplinaEmoji}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body1"
            fontWeight={700}
            color="#111827"
            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}
          >
            {headerTitle}
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
            <Chip
              icon={isCollab ? <GroupsIcon sx={{ fontSize: '10px !important' }} /> : <SchoolIcon sx={{ fontSize: '10px !important' }} />}
              label={isCollab ? 'Colaborativo' : 'Especializado'}
              size="small"
              sx={{
                bgcolor: accentLight,
                color: accent,
                fontWeight: 700,
                fontSize: '0.62rem',
                height: 17,
                '& .MuiChip-label': { px: 0.75 },
                '& .MuiChip-icon': { ml: 0.5, color: `${accent} !important` },
              }}
            />
            {question.status === 'FECHADA' && (
              <Chip
                icon={<LockIcon sx={{ fontSize: '11px !important' }} />}
                label="Fechada"
                size="small"
                sx={{ bgcolor: '#F3F4F6', color: '#9CA3AF', height: 17, '& .MuiChip-label': { px: 0.5 }, '& .MuiChip-icon': { ml: 0.5 } }}
              />
            )}
          </Stack>
        </Box>
      </Box>

      {/* ── Context bar ── */}
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2.5,
          py: 0.75,
          bgcolor: accentLight,
          borderBottom: `1px solid ${accent}25`,
        }}
      >
        {isCollab
          ? <GroupsIcon sx={{ fontSize: 13, color: accent }} />
          : <SchoolIcon sx={{ fontSize: 13, color: accent }} />}
        <Typography variant="caption" sx={{ color: accentDark, fontWeight: 600, lineHeight: 1.3 }}>
          {isCollab
            ? `Chat da Turma · ${disciplinaLabel} · O professor será notificado ao enviar uma mensagem`
            : `Chat Privado com Prof. de ${disciplinaLabel} · A mensagem chegará directamente ao professor`}
        </Typography>
      </Box>

      {/* ── Messages area ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3 }, py: 2.5, bgcolor: '#F8FAFC' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
        )}

        {/* Expert room: student's first message (descricao) */}
        {isSpec && !isFirstMsgPending && question.descricao && question.descricao !== '_' && (
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
            <Avatar
              sx={{ bgcolor: accentLight, color: accent, fontWeight: 700, width: 38, height: 38, fontSize: '0.8rem', flexShrink: 0, mt: 0.25 }}
            >
              {initials(question.createdBy)}
            </Avatar>
            <Box sx={{ flex: 1, maxWidth: '82%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.4 }}>
                <Typography variant="caption" fontWeight={700} color="#111827">{question.createdBy}</Typography>
                <Chip label="Aluno" size="small" sx={{ bgcolor: accentLight, color: accent, fontWeight: 600, fontSize: '0.58rem', height: 15, '& .MuiChip-label': { px: 0.5 } }} />
                <Typography variant="caption" color="#9CA3AF">{formatTime(question.createdAt)}</Typography>
              </Box>
              <Box sx={{ bgcolor: '#fff', borderRadius: '4px 16px 16px 16px', px: 2, py: 1.75, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderLeft: `4px solid ${accent}` }}>
                <Typography variant="body2" color="#374151" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                  {question.descricao}
                </Typography>
              </Box>
              {/* Accept button for student if professor has replied */}
              {isOwner && question.status === 'ABERTA' && messages.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<CheckCircleIcon sx={{ fontSize: '12px !important' }} />}
                    onClick={() => {
                      const firstAcceptable = messages.find(m => m.kind === 'expert' && !(m.data as ExpertAnswer).accepted);
                      if (firstAcceptable) handleAccept(firstAcceptable.data.id);
                    }}
                    sx={{ textTransform: 'none', borderColor: '#16A34A', color: '#16A34A', fontSize: '0.72rem', height: 24, '&:hover': { bgcolor: '#DCFCE7' } }}
                  >
                    Marcar como resolvido
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Expert room: student hasn't sent first message yet */}
        {isSpec && isFirstMsgPending && isOwner && (
          <Box sx={{ bgcolor: '#fff', borderRadius: 3, overflow: 'hidden', mb: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: `1px solid ${accent}30` }}>
            {/* Professor mention header */}
            <Box sx={{ bgcolor: accentLight, px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${accent}20` }}>
              <Avatar sx={{ bgcolor: accent, width: 32, height: 32, fontSize: '0.75rem' }}>
                <SchoolIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={700} color={accentDark}>
                  @Prof. de {disciplinaLabel}
                </Typography>
                <Typography variant="caption" color={accent} fontWeight={500}>
                  O professor será notificado imediatamente após o envio
                </Typography>
              </Box>
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '11px !important', color: `${accent} !important` }} />}
                label="Notificação automática"
                size="small"
                sx={{ bgcolor: '#fff', color: accent, fontWeight: 700, fontSize: '0.6rem', height: 18, border: `1px solid ${accent}40`, '& .MuiChip-label': { px: 0.75 } }}
              />
            </Box>
            <Box sx={{ p: 2.5 }}>
              <TextField
                fullWidth
                multiline
                rows={4}
                autoFocus
                placeholder={`Descreve a tua dúvida em detalhe ao professor de ${disciplinaLabel}...`}
                value={firstMsg}
                onChange={e => setFirstMsg(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleSendFirstMessage(); }
                }}
                sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2, '&.Mui-focused fieldset': { borderColor: accent } } }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">Ctrl+Enter para enviar rapidamente</Typography>
                <Button
                  variant="contained"
                  endIcon={settingFirst ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <SendIcon fontSize="small" />}
                  disabled={settingFirst || !firstMsg.trim()}
                  onClick={handleSendFirstMessage}
                  sx={{ bgcolor: accent, textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5, '&:hover': { bgcolor: accentDark } }}
                >
                  {settingFirst ? 'A enviar...' : 'Enviar ao Professor'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* Expert room: waiting for professor (student viewing, no replies yet) */}
        {isSpec && isFirstMsgPending && !isOwner && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" color="text.secondary">O aluno ainda não enviou a dúvida.</Typography>
          </Box>
        )}

        {/* No messages yet */}
        {messages.length === 0 && !isFirstMsgPending && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            {isCollab ? (
              <>
                <GroupsIcon sx={{ fontSize: 44, color: `${accent}35`, mb: 1.5, display: 'block', mx: 'auto' }} />
                <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>
                  Sê o primeiro a participar!
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  O professor de {disciplinaLabel} receberá notificação da tua primeira mensagem
                </Typography>
              </>
            ) : (
              <>
                <SchoolIcon sx={{ fontSize: 44, color: `${accent}35`, mb: 1.5, display: 'block', mx: 'auto' }} />
                <Typography variant="body2" fontWeight={600} color="text.secondary" gutterBottom>
                  Aguarda a resposta do professor...
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  O professor foi notificado da tua dúvida
                </Typography>
              </>
            )}
          </Box>
        )}

        {/* Messages */}
        {messages.map(msg => {
          const mine = isMine(msg.data.answeredBy);
          const bubbleBg = mine ? accent : '#fff';
          const textColor = mine ? '#fff' : '#1F2937';
          const bubbleRadius = mine ? '16px 4px 16px 16px' : '4px 16px 16px 16px';
          const expertData = msg.kind === 'expert' ? (msg.data as ExpertAnswer) : null;
          const collabData = msg.kind === 'collab' ? (msg.data as CollaborativeAnswer) : null;

          return (
            <Box
              key={`${msg.kind}-${msg.data.id}`}
              sx={{ display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', gap: 1.5, mb: 2.5 }}
            >
              <Avatar
                sx={{
                  bgcolor: mine ? accentLight : '#F3F4F6',
                  color: mine ? accent : '#6B7280',
                  fontWeight: 700,
                  width: 34,
                  height: 34,
                  fontSize: '0.72rem',
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                {initials(msg.data.answeredBy)}
              </Avatar>

              <Box sx={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.4, flexDirection: mine ? 'row-reverse' : 'row' }}>
                  <Typography variant="caption" fontWeight={700} color="#111827">{msg.data.answeredBy}</Typography>
                  {msg.kind === 'expert' && (
                    <Chip
                      icon={<StarIcon sx={{ fontSize: '10px !important', color: '#fff !important' }} />}
                      label="Professor"
                      size="small"
                      sx={{ bgcolor: '#1D4ED8', color: '#fff', fontWeight: 600, fontSize: '0.58rem', height: 16, '& .MuiChip-label': { px: 0.5 }, '& .MuiChip-icon': { ml: 0.5 } }}
                    />
                  )}
                  <Typography variant="caption" color="#9CA3AF">{formatTime(msg.data.createdAt)}</Typography>
                </Box>

                <Box
                  sx={{
                    bgcolor: bubbleBg,
                    borderRadius: bubbleRadius,
                    px: 2,
                    py: 1.25,
                    boxShadow: mine ? `0 2px 8px ${accent}35` : '0 1px 4px rgba(0,0,0,0.07)',
                    ...(expertData?.accepted && !mine ? { border: '2px solid #16A34A' } : {}),
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, color: textColor }}>
                    {msg.data.conteudo}
                  </Typography>
                </Box>

                {/* Status and actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, flexDirection: mine ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                  {expertData?.accepted && (
                    <Chip
                      icon={<CheckCircleIcon sx={{ fontSize: '12px !important', color: '#15803D !important' }} />}
                      label="Aceite"
                      size="small"
                      sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '0.62rem', height: 20, '& .MuiChip-icon': { ml: 0.5 } }}
                    />
                  )}

                  {expertData && isOwner && !expertData.accepted && question.status === 'ABERTA' && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleAccept(msg.data.id)}
                      sx={{ bgcolor: accent, textTransform: 'none', fontWeight: 700, fontSize: '0.7rem', height: 22, px: 1.5, minWidth: 0, '&:hover': { bgcolor: accentDark } }}
                    >
                      Aceitar Resposta
                    </Button>
                  )}

                  {collabData && (
                    <ValidationBadge status={collabData.validationStatus} rejectedBy={collabData.rejectedBy} />
                  )}

                  {collabData && isProfessor && collabData.validationStatus === 'PENDENTE' && !collabData.rejectedBy && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={processing === msg.data.id}
                        startIcon={<CancelIcon sx={{ fontSize: '11px !important' }} />}
                        onClick={() => handleReject(msg.data.id)}
                        sx={{ textTransform: 'none', borderColor: '#EF4444', color: '#EF4444', fontSize: '0.7rem', height: 22, px: 1.25, minWidth: 0, '&:hover': { bgcolor: '#FEF2F2', borderColor: '#EF4444' } }}
                      >
                        Rejeitar
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={processing === msg.data.id}
                        startIcon={<CheckCircleIcon sx={{ fontSize: '11px !important' }} />}
                        onClick={() => handleValidate(msg.data.id)}
                        sx={{ bgcolor: '#16A34A', textTransform: 'none', fontSize: '0.7rem', height: 22, px: 1.25, minWidth: 0, '&:hover': { bgcolor: '#15803D' } }}
                      >
                        {processing === msg.data.id ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : 'Validar'}
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}

        <div ref={bottomRef} />
      </Box>

      {/* ── Input area ── */}
      {canAnswer && (
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1.5,
            px: 2.5,
            py: 1.75,
            borderTop: '1px solid #E5E7EB',
            bgcolor: '#fff',
          }}
        >
          <Avatar
            sx={{ bgcolor: accentLight, color: accent, fontWeight: 700, width: 34, height: 34, fontSize: '0.72rem', flexShrink: 0, mb: 0.25 }}
          >
            {initials(user?.username || '?')}
          </Avatar>

          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={
              isSpec
                ? 'Escreve a tua resposta ao aluno...'
                : 'Escreve a tua mensagem...'
            }
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: '#F9FAFB',
                fontSize: '0.9rem',
                '& fieldset': { borderColor: '#E5E7EB' },
                '&:hover fieldset': { borderColor: accent },
                '&.Mui-focused fieldset': { borderColor: accent },
              },
            }}
          />

          <IconButton
            onClick={handleSubmit}
            disabled={submitting || !answer.trim()}
            sx={{
              bgcolor: accent,
              color: '#fff',
              width: 38,
              height: 38,
              flexShrink: 0,
              mb: 0.25,
              '&:hover': { bgcolor: accentDark },
              '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' },
            }}
          >
            {submitting ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <SendIcon fontSize="small" />}
          </IconButton>
        </Box>
      )}

      {/* Closed bar */}
      {question.status === 'FECHADA' && (
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2.5,
            py: 1.25,
            borderTop: '1px solid #F3F4F6',
            bgcolor: '#FAFAFA',
          }}
        >
          <LockIcon sx={{ fontSize: 15, color: '#9CA3AF' }} />
          <Typography variant="caption" color="text.secondary">Esta conversa está encerrada</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ChatRoom;
