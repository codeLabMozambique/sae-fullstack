import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, CircularProgress,
  Chip, Stack, Divider, Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import { useParams, useNavigate } from 'react-router-dom';
import ExpertAnswerCard from '../../components/forum/ExpertAnswerCard';
import CollaborativeAnswerCard from '../../components/forum/CollaborativeAnswerCard';
import { forumService } from '../../services/forumService';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';
import type { ForumQuestion } from '../../types/forum';

const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribe } = useWebSocket();

  const [question, setQuestion] = useState<ForumQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try { setQuestion(await forumService.getQuestion(Number(id))); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!id) return;
    subscribe(`/topic/answers/${id}`, () => load());
    subscribe(`/topic/validations/${id}`, () => load());
  }, [id, subscribe, load]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !question) return;
    setSubmitting(true); setError('');
    try {
      if (question.questionType === 'ESPECIALIZADO') {
        await forumService.createExpertAnswer(question.id, { conteudo: answer });
      } else {
        await forumService.createCollaborativeAnswer(question.id, { conteudo: answer });
      }
      setAnswer('');
      setSuccess('Resposta submetida com sucesso!');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao submeter resposta');
    } finally {
      setSubmitting(false);
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

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!question) return <Alert severity="error">Pergunta não encontrada</Alert>;

  const isOwner = user?.username === question.createdBy;
  const isSpecialized = question.questionType === 'ESPECIALIZADO';
  const accentColor = isSpecialized ? '#2563EB' : '#16A34A';
  const tags = question.tags ? question.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const canAnswer = (isSpecialized && user?.role === 'PROFESSOR') ||
                    (!isSpecialized && user?.role === 'STUDENT' && !isOwner);

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/app/forum')}
        sx={{ mb: 2, textTransform: 'none', color: '#6B7280' }}>
        Voltar ao Fórum
      </Button>

      {/* Question header */}
      <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: 3, mb: 3, borderLeft: `4px solid ${accentColor}` }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap">
          <Chip label={isSpecialized ? 'Especializado' : 'Colaborativo'} size="small"
            sx={{ bgcolor: isSpecialized ? '#DBEAFE' : '#DCFCE7', color: accentColor, fontWeight: 700 }} />
          {question.area && <Chip label={question.area} size="small" sx={{ bgcolor: '#F3F4F6' }} />}
          {question.status === 'FECHADA' && (
            <Chip icon={<LockIcon sx={{ fontSize: '14px !important' }} />} label="Fechada" size="small"
              sx={{ bgcolor: '#F3F4F6', color: '#9CA3AF' }} />
          )}
          {tags.map(t => <Chip key={t} label={t} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />)}
        </Stack>

        <Typography variant="h5" fontWeight={700} color="#0A1628" sx={{ mb: 1 }}>{question.titulo}</Typography>
        <Typography variant="body1" color="#374151" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{question.descricao}</Typography>
        <Typography variant="caption" color="text.secondary">
          Por {question.createdBy} · {new Date(question.createdAt).toLocaleDateString('pt-PT')}
        </Typography>
      </Box>

      {/* Answers */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Respostas</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {isSpecialized ? (
        <Stack spacing={2} sx={{ mb: 3 }}>
          {(question.expertAnswers?.length ?? 0) === 0
            ? <Typography color="text.secondary">Ainda sem respostas de especialista.</Typography>
            : question.expertAnswers!.map(a => (
                <ExpertAnswerCard key={a.id} answer={a} isQuestionOwner={isOwner}
                  questionClosed={question.status === 'FECHADA'} onAccept={handleAccept} />
              ))
          }
        </Stack>
      ) : (
        <Stack spacing={2} sx={{ mb: 3 }}>
          {(question.collaborativeAnswers?.length ?? 0) === 0
            ? <Typography color="text.secondary">Ainda sem respostas colaborativas.</Typography>
            : question.collaborativeAnswers!.map(a => (
                <CollaborativeAnswerCard key={a.id} answer={a} />
              ))
          }
        </Stack>
      )}

      {/* Answer form */}
      {canAnswer && question.status === 'ABERTA' && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>A tua resposta</Typography>
          <TextField
            fullWidth multiline rows={4}
            placeholder="Escreve a tua resposta..."
            value={answer} onChange={e => setAnswer(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handleSubmitAnswer} disabled={submitting || !answer.trim()}
            sx={{ bgcolor: accentColor, '&:hover': { filter: 'brightness(0.9)' }, textTransform: 'none', fontWeight: 700 }}>
            {submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Submeter Resposta'}
          </Button>
        </>
      )}
    </Box>
  );
};

export default QuestionDetail;
