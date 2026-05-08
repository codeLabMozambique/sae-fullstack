import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, IconButton,
  CircularProgress, Alert, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  EmojiEvents as GoalIcon, Add as AddIcon, Delete as DeleteIcon,
  TrendingUp as ProgressIcon,
} from '@mui/icons-material';
import {
  listGoals, createGoal, addGoalProgress, deleteGoal,
  type StudyGoal,
} from '../../services/contentService';

const Metas: React.FC = () => {
  const [items, setItems] = useState<StudyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // create dialog
  const [openCreate, setOpenCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [targetPages, setTargetPages] = useState<number>(0);
  const [deadline, setDeadline] = useState('');

  // progress dialog
  const [progressFor, setProgressFor] = useState<StudyGoal | null>(null);
  const [pages, setPages] = useState<number>(1);

  const load = () => {
    setLoading(true);
    listGoals()
      .then(setItems)
      .catch(e => setError(e?.message || 'Falha ao carregar metas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!title || targetPages <= 0 || !deadline) {
      setError('Preencha título, páginas e prazo');
      return;
    }
    try {
      await createGoal({ title, targetPages, deadline });
      setOpenCreate(false);
      setTitle(''); setTargetPages(0); setDeadline('');
      load();
    } catch (e: any) {
      setError(e?.message || 'Falha ao criar meta');
    }
  };

  const handleAddProgress = async () => {
    if (!progressFor || pages <= 0) return;
    try {
      await addGoalProgress(progressFor.id, pages);
      setProgressFor(null); setPages(1);
      load();
    } catch (e: any) {
      setError(e?.message || 'Falha ao adicionar progresso');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apagar esta meta?')) return;
    try {
      await deleteGoal(id);
      setItems(prev => prev.filter(g => g.id !== id));
    } catch (e: any) {
      setError(e?.message || 'Falha ao apagar');
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0A1628">Metas de Estudo</Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'A carregar…' : `${items.length} metas activas`}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}
          sx={{ bgcolor: '#001B33', textTransform: 'none', '&:hover': { bgcolor: '#002B50' } }}>
          Nova Meta
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Box textAlign="center" py={8} bgcolor="#fff" borderRadius={3}>
          <GoalIcon sx={{ fontSize: 48, color: '#E5E7EB', mb: 1 }} />
          <Typography fontWeight={600} color="text.secondary">Sem metas definidas</Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {items.map(g => {
            const pct = Math.min(100, (g.currentPages / g.targetPages) * 100);
            return (
              <Grid key={g.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ borderRadius: 3, p: 2 }}>
                  <CardContent>
                    <Typography fontWeight={700}>{g.title}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      Prazo: {g.deadline}
                    </Typography>
                    <LinearProgress
                      variant="determinate" value={pct}
                      sx={{ height: 8, borderRadius: 4, mb: 1,
                        '& .MuiLinearProgress-bar': { bgcolor: pct >= 100 ? '#16A34A' : '#00A651' } }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {g.currentPages} / {g.targetPages} páginas ({pct.toFixed(0)}%)
                    </Typography>
                  </CardContent>
                  <Stack direction="row" spacing={1} px={2} pb={2}>
                    <Button
                      size="small" variant="outlined" startIcon={<ProgressIcon fontSize="small" />}
                      onClick={() => { setProgressFor(g); setPages(1); }}
                      sx={{ flex: 1, textTransform: 'none' }}
                    >
                      Adicionar
                    </Button>
                    <IconButton size="small" color="error" onClick={() => handleDelete(g.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Dialog: criar meta */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Meta</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Título" fullWidth value={title} onChange={e => setTitle(e.target.value)} />
            <TextField
              label="Páginas a ler" type="number" fullWidth value={targetPages || ''}
              onChange={e => setTargetPages(Number(e.target.value) || 0)}
            />
            <TextField
              label="Prazo" type="date" InputLabelProps={{ shrink: true }} fullWidth
              value={deadline} onChange={e => setDeadline(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate}
            sx={{ bgcolor: '#001B33', '&:hover': { bgcolor: '#002B50' } }}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: adicionar progresso */}
      <Dialog open={progressFor !== null} onClose={() => setProgressFor(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Adicionar páginas lidas</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>{progressFor?.title}</Typography>
          <TextField
            label="Páginas lidas agora" type="number" fullWidth autoFocus
            value={pages || ''} onChange={e => setPages(Number(e.target.value) || 0)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressFor(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddProgress}
            sx={{ bgcolor: '#001B33', '&:hover': { bgcolor: '#002B50' } }}>
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Metas;
