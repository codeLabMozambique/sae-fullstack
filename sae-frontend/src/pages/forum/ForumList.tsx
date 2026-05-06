import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, TextField, MenuItem, Button,
  CircularProgress, InputAdornment, Stack, Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddCommentIcon from '@mui/icons-material/AddComment';
import ForumIcon from '@mui/icons-material/Forum';
import ChatConversationRow from '../../components/forum/ChatConversationRow';
import NewQuestion from './NewQuestion';
import { forumService } from '../../services/forumService';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { ForumQuestion, QuestionType, QuestionStatus } from '../../types/forum';

const STATUS_OPTIONS: { label: string; value: QuestionStatus | '' }[] = [
  { label: 'Todas', value: '' },
  { label: 'Abertas', value: 'ABERTA' },
  { label: 'Fechadas', value: 'FECHADA' },
];

const ForumList: React.FC = () => {
  const { subscribe } = useWebSocket();

  const [newOpen, setNewOpen] = useState(false);
  const [tab, setTab] = useState<0 | 1>(0);
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [area, setArea] = useState('');
  const [status, setStatus] = useState<QuestionStatus | ''>('');

  const questionType: QuestionType = tab === 0 ? 'ESPECIALIZADO' : 'COLABORATIVO';
  const accent = tab === 0 ? '#2563EB' : '#16A34A';
  const accentDark = tab === 0 ? '#1D4ED8' : '#15803D';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await forumService.listQuestions({
        questionType,
        area: area || undefined,
        status: status || undefined,
        page: page - 1,
        size: 15,
      });
      setQuestions(res.content);
      setTotalPages(res.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [questionType, area, status, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    subscribe(`/topic/questions/${area || '*'}`, () => load());
  }, [subscribe, area, load]);

  return (
    <Box>
      {/* Page header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0A1628">
            Fórum
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Conversas e dúvidas da comunidade
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCommentIcon />}
          onClick={() => setNewOpen(true)}
          sx={{
            bgcolor: accent,
            '&:hover': { bgcolor: accentDark },
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2.5,
            px: 2.5,
            boxShadow: `0 4px 14px ${accent}40`,
          }}
        >
          Nova Conversa
        </Button>
      </Box>

      {/* Main card */}
      <Box
        sx={{
          bgcolor: '#fff',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        }}
      >
        {/* Tab bar */}
        <Box sx={{ borderBottom: '1px solid #F3F4F6', px: 2 }}>
          <Tabs
            value={tab}
            onChange={(_, v) => { setTab(v); setPage(1); }}
            slotProps={{
              indicator: {
                style: {
                  backgroundColor: accent,
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
              },
            }}
            sx={{ minHeight: 48 }}
          >
            <Tab
              label="Especializado"
              sx={{
                textTransform: 'none',
                fontWeight: tab === 0 ? 700 : 400,
                color: tab === 0 ? '#2563EB' : '#6B7280',
                minHeight: 48,
                fontSize: '0.9rem',
              }}
            />
            <Tab
              label="Colaborativo"
              sx={{
                textTransform: 'none',
                fontWeight: tab === 1 ? 700 : 400,
                color: tab === 1 ? '#16A34A' : '#6B7280',
                minHeight: 48,
                fontSize: '0.9rem',
              }}
            />
          </Tabs>
        </Box>

        {/* Filter bar */}
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            borderBottom: '1px solid #F3F4F6',
            bgcolor: '#FAFAFA',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Pesquisar por área..."
              value={area}
              onChange={e => { setArea(e.target.value); setPage(1); }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                minWidth: 220,
                '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' },
              }}
            />
            <TextField
              select
              size="small"
              value={status}
              onChange={e => { setStatus(e.target.value as QuestionStatus | ''); setPage(1); }}
              sx={{
                minWidth: 140,
                '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' },
              }}
            >
              {STATUS_OPTIONS.map(o => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </Box>

        {/* Conversation list */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: accent }} size={28} />
          </Box>
        ) : questions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <ForumIcon sx={{ fontSize: 52, color: '#E5E7EB', mb: 1.5 }} />
            <Typography fontWeight={600} color="text.secondary">
              Nenhuma conversa encontrada
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 0.5 }}
            >
              Clica em "Nova Conversa" para iniciar a primeira
            </Typography>
          </Box>
        ) : (
          questions.map(q => <ChatConversationRow key={q.id} question={q} />)
        )}
      </Box>

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

      <NewQuestion open={newOpen} onClose={() => { setNewOpen(false); load(); }} />
    </Box>
  );
};

export default ForumList;
