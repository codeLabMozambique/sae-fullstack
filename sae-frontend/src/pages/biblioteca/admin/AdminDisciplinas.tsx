import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, IconButton, TextField,
  CircularProgress, Alert, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../../services/api';
import { listDisciplines, type Discipline } from '../../../services/contentService';

const AdminDisciplinas: React.FC = () => {
  const [items, setItems] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const load = () => {
    setLoading(true);
    listDisciplines()
      .then(setItems)
      .catch(e => setError(e?.message || 'Falha'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!name) { setError('Nome obrigatório'); return; }
    try {
      await api.post('/content/api/disciplines/admin', { name });
      setOpen(false); setName('');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Falha');
    }
  };

  const handleDelete = async (id: number, nameToDelete: string) => {
    if (!confirm(`Apagar disciplina "${nameToDelete}"?`)) return;
    try {
      await api.delete(`/content/api/disciplines/admin/${id}`);
      setItems(prev => prev.filter(d => d.id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Falha');
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0A1628">Disciplinas</Typography>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'A carregar…' : `${items.length} disciplinas`}
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
          sx={{ bgcolor: '#001B33', textTransform: 'none', '&:hover': { bgcolor: '#002B50' } }}
        >
          Nova Disciplina
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F9FAFB' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Criada em</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map(d => (
                <TableRow key={d.id} hover>
                  <TableCell>{d.id}</TableCell>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>{d.createdAt}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => handleDelete(d.id, d.name)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {items.length === 0 && (
            <Typography color="text.secondary" textAlign="center" py={4}>Sem disciplinas</Typography>
          )}
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nova Disciplina</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome" fullWidth autoFocus sx={{ mt: 1 }}
            value={name} onChange={e => setName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate}
            sx={{ bgcolor: '#001B33', '&:hover': { bgcolor: '#002B50' } }}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDisciplinas;
