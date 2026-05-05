import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, TextField, MenuItem, Button,
  Grid, CircularProgress, Pagination, Stack, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import QuestionCard from '../../components/forum/QuestionCard';
import { forumService } from '../../services/forumService';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { ForumQuestion, QuestionType, QuestionStatus } from '../../types/forum';

const STATUS_OPTIONS: { label: string; value: QuestionStatus | '' }[] = [
  { label: 'Todas', value: '' },
  { label: 'Abertas', value: 'ABERTA' },
  { label: 'Fechadas', value: 'FECHADA' },
];

const ForumList: React.FC = () => {
  const navigate = useNavigate();
  const { subscribe } = useWebSocket();

  const [tab, setTab] = useState<0 | 1>(0);
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [area, setArea] = useState('');
  const [status, setStatus] = useState<QuestionStatus | ''>('');

  const questionType: QuestionType = tab === 0 ? 'ESPECIALIZADO' : 'COLABORATIVO';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await forumService.listQuestions({
        questionType,
        area: area || undefined,
        status: status || undefined,
        page: page - 1,
        size: 10,
      });
      setQuestions(res.content);
      setTotalPages(res.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [questionType, area, status, page]);

  useEffect(() => { load(); }, [load]);

  // Real-time: insert new question at top when notified
  useEffect(() => {
    const topic = `/topic/questions/${area || '*'}`;
    subscribe(topic, () => load());
  }, [subscribe, area, load]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0A1628">Fórum</Typography>
          <Typography variant="body2" color="text.secondary">
            Coloca dúvidas e colabora com outros estudantes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/app/forum/new')}
          sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, textTransform: 'none', fontWeight: 700 }}
        >
          Nova Pergunta
        </Button>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); setPage(1); }}
        sx={{ mb: 2, borderBottom: '1px solid #E5E7EB' }}
      >
        <Tab label="Fórum Especializado" sx={{ color: tab === 0 ? '#2563EB' : undefined, fontWeight: tab === 0 ? 700 : 400 }} />
        <Tab label="Fórum Colaborativo"  sx={{ color: tab === 1 ? '#16A34A' : undefined, fontWeight: tab === 1 ? 700 : 400 }} />
      </Tabs>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Filtrar por área..."
          value={area}
          onChange={e => { setArea(e.target.value); setPage(1); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 200 }}
        />
        <TextField
          select size="small" value={status}
          onChange={e => { setStatus(e.target.value as QuestionStatus | ''); setPage(1); }}
          sx={{ minWidth: 140 }}
        >
          {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: tab === 0 ? '#2563EB' : '#16A34A' }} />
        </Box>
      ) : questions.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">Nenhuma pergunta encontrada.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {questions.map(q => (
            <Grid size={{ xs: 12 }} key={q.id}>
              <QuestionCard question={q} />
            </Grid>
          ))}
        </Grid>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)}
            color="primary" />
        </Box>
      )}
    </Box>
  );
};

export default ForumList;
