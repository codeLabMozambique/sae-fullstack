import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, CircularProgress,
  Alert, Stack, Chip, Pagination, Avatar,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { forumService } from '../../services/forumService';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { CollaborativeAnswer } from '../../types/forum';

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
  return new Date(dateStr).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#0A1628">
          Painel de Validação
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Respostas colaborativas a aguardar a tua aprovação
        </Typography>
      </Box>

      {feedback && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 2.5 }}
          onClose={() => setFeedback(null)}
        >
          {feedback.msg}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#16A34A' }} size={28} />
        </Box>
      ) : answers.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            bgcolor: '#fff',
            borderRadius: 3,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 52, color: '#DCFCE7', mb: 1.5 }} />
          <Typography fontWeight={600} color="text.secondary">
            Sem respostas pendentes
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            Todas as respostas foram processadas
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            bgcolor: '#fff',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          }}
        >
          {answers.map((answer, idx) => (
            <Box
              key={answer.id}
              sx={{
                display: 'flex',
                gap: 2,
                px: 2.5,
                py: 2,
                borderBottom: idx < answers.length - 1 ? '1px solid #F3F4F6' : 'none',
                '&:hover': { bgcolor: '#FAFAFA' },
                transition: 'background-color 0.15s',
              }}
            >
              {/* Avatar */}
              <Avatar
                sx={{
                  bgcolor: '#FEF9C3',
                  color: '#A16207',
                  fontWeight: 700,
                  width: 40,
                  height: 40,
                  fontSize: '0.82rem',
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                {initials(answer.answeredBy)}
              </Avatar>

              {/* Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Header row */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 0.75,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={700} color="#111827">
                      {answer.answeredBy}
                    </Typography>
                    <Chip
                      icon={<AccessTimeIcon sx={{ fontSize: '10px !important' }} />}
                      label="Pendente"
                      size="small"
                      sx={{
                        bgcolor: '#FEF9C3',
                        color: '#A16207',
                        fontWeight: 600,
                        fontSize: '0.62rem',
                        height: 18,
                        '& .MuiChip-label': { px: 0.75 },
                        '& .MuiChip-icon': { ml: 0.5 },
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="#9CA3AF" sx={{ fontSize: '0.72rem' }}>
                    Pergunta #{answer.questionId} · {formatTime(answer.createdAt)}
                  </Typography>
                </Box>

                {/* Answer content bubble */}
                <Box
                  sx={{
                    bgcolor: '#F9FAFB',
                    borderRadius: '4px 12px 12px 12px',
                    px: 1.75,
                    py: 1.25,
                    borderLeft: '3px solid #FCD34D',
                    mb: 1.25,
                  }}
                >
                  <Typography
                    variant="body2"
                    color="#1F2937"
                    sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}
                  >
                    {answer.conteudo}
                  </Typography>
                </Box>

                {/* Action buttons */}
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={processing === answer.id}
                    startIcon={<CancelIcon sx={{ fontSize: '13px !important' }} />}
                    onClick={() => handleReject(answer.id)}
                    sx={{
                      textTransform: 'none',
                      borderColor: '#EF4444',
                      color: '#EF4444',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#FEF2F2', borderColor: '#EF4444' },
                    }}
                  >
                    Rejeitar
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={processing === answer.id}
                    startIcon={<CheckCircleIcon sx={{ fontSize: '13px !important' }} />}
                    onClick={() => handleValidate(answer.id)}
                    sx={{
                      textTransform: 'none',
                      bgcolor: '#16A34A',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#15803D' },
                    }}
                  >
                    {processing === answer.id ? (
                      <CircularProgress size={14} sx={{ color: '#fff' }} />
                    ) : (
                      'Validar'
                    )}
                  </Button>
                </Stack>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default Validations;
