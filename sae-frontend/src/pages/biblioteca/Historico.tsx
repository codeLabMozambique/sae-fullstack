import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, Alert, TextField, MenuItem, Stack, Card,
} from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import {
  getHistory, listDisciplines,
  type ReadingHistory, type Discipline,
} from '../../services/contentService';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

const Historico: React.FC = () => {
  const [items, setItems] = useState<ReadingHistory[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [discipline, setDiscipline] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDisciplines().then(setDisciplines).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    const filters: Record<string, string> = {};
    if (discipline) filters.discipline = discipline;
    if (from && to) {
      filters.from = `${from}T00:00:00`;
      filters.to = `${to}T23:59:59`;
    }
    getHistory(Object.keys(filters).length > 0 ? filters : undefined)
      .then(setItems)
      .catch(e => setError(e?.message || 'Falha ao carregar histórico'))
      .finally(() => setLoading(false));
  }, [discipline, from, to]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1} color="#0A1628">
        Histórico de Leitura
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Sessões registadas, ordenadas por mais recentes
      </Typography>

      {/* Filtros */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select size="small" label="Disciplina" value={discipline}
            onChange={e => setDiscipline(e.target.value)} sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {disciplines.map(d => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
          </TextField>
          <TextField
            type="date" size="small" label="De" InputLabelProps={{ shrink: true }}
            value={from} onChange={e => setFrom(e.target.value)}
          />
          <TextField
            type="date" size="small" label="Até" InputLabelProps={{ shrink: true }}
            value={to} onChange={e => setTo(e.target.value)}
          />
        </Stack>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Box textAlign="center" py={8} bgcolor="#fff" borderRadius={3}>
          <HistoryIcon sx={{ fontSize: 48, color: '#E5E7EB', mb: 1 }} />
          <Typography fontWeight={600} color="text.secondary">Sem registos no histórico</Typography>
        </Box>
      ) : (
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Disciplina</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Páginas lidas</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Duração</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(h => (
                <TableRow key={h.id} hover>
                  <TableCell>{h.readAt}</TableCell>
                  <TableCell>{h.discipline}</TableCell>
                  <TableCell align="right">{h.pagesRead}</TableCell>
                  <TableCell align="right">{formatDuration(h.durationSeconds)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
};

export default Historico;
