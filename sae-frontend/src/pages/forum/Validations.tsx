import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, CircularProgress,
  Alert, Stack, Divider, Chip, Pagination,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { forumService } from '../../services/forumService';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { CollaborativeAnswer } from '../../types/forum';

const Validations: React.FC = () => {
  const { subscribe } = useWebSocket();
  const [answers, setAnswers] = useState<CollaborativeAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await forumService.listPendingAnswers({ page: page - 1, size: 20 });
      setAnswers(res.content);
      setTotalPages(res.totalPages || 1);
    } catch {
      setFeedback({ type: 'error', msg: 'Erro ao carregar respostas pendentes' });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    subscribe('/topic/answers/*', () => load());
  }, [subscribe, load]);

  const handleValidate = async (answerId: number) => {
    setProcessing(answerId);
    try {
      await forumService.validateAnswer(answerId);
      setFeedback({ type: 'success', msg: 'Resposta validada com sucesso!' });
      setAnswers(prev => prev.filter(a => a.id !== answerId));
    } catch (e: any) {
      setFeedback({ type: 'error', msg: e?.response?.data?.message || 'Erro ao validar' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (answerId: number) => {
    setProcessing(answerId);
    try {
      await forumService.rejectAnswer(answerId);
      setFeedback({ type: 'success', msg: 'Resposta rejeitada.' });
      setAnswers(prev => prev.filter(a => a.id !== answerId));
    } catch (e: any) {
      setFeedback({ type: 'error', msg: e?.response?.data?.message || 'Erro ao rejeitar' });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} color="#0A1628" sx={{ mb: 0.5 }}>
        Painel de Validação
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Respostas colaborativas a aguardar validação
      </Typography>

      {feedback && (
        <Alert severity={feedback.type} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.msg}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#16A34A' }} />
        </Box>
      ) : answers.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CheckCircleIcon sx={{ fontSize: 48, color: '#16A34A', mb: 2 }} />
          <Typography color="text.secondary">Sem respostas pendentes de validação.</Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {answers.map(answer => (
            <Card key={answer.id} sx={{ border: '1px solid #E5E7EB', borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Chip label="Pendente" size="small"
                    sx={{ bgcolor: '#FEF9C3', color: '#A16207', fontWeight: 600 }} />
                  <Typography variant="caption" color="text.secondary">
                    Pergunta #{answer.questionId}
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2, color: '#1F2937' }}>
                  {answer.conteudo}
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Por {answer.answeredBy} · {new Date(answer.createdAt).toLocaleDateString('pt-PT')}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small" variant="outlined" startIcon={<CancelIcon />}
                      disabled={processing === answer.id}
                      onClick={() => handleReject(answer.id)}
                      sx={{ textTransform: 'none', borderColor: '#EF4444', color: '#EF4444',
                        '&:hover': { bgcolor: '#FEF2F2', borderColor: '#EF4444' } }}
                    >
                      Rejeitar
                    </Button>
                    <Button
                      size="small" variant="contained" startIcon={<CheckCircleIcon />}
                      disabled={processing === answer.id}
                      onClick={() => handleValidate(answer.id)}
                      sx={{ textTransform: 'none', bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
                    >
                      {processing === answer.id
                        ? <CircularProgress size={16} sx={{ color: '#fff' }} />
                        : 'Validar'}
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}
    </Box>
  );
};

export default Validations;
