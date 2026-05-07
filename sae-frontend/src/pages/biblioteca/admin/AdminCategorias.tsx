import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, IconButton, TextField,
  CircularProgress, Alert, Stack, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Chip,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Folder as FolderIcon,
} from '@mui/icons-material';
import api from '../../../services/api';
import { listCategoriesTree, type Category } from '../../../services/contentService';

// flatten tree for select
function flatten(tree: Category[], depth = 0): Array<{ id: string; name: string; depth: number }> {
  const out: Array<{ id: string; name: string; depth: number }> = [];
  for (const c of tree) {
    out.push({ id: c.id, name: c.name, depth });
    if (c.children) out.push(...flatten(c.children, depth + 1));
  }
  return out;
}

const AdminCategorias: React.FC = () => {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');

  const load = () => {
    setLoading(true);
    listCategoriesTree()
      .then(setTree)
      .catch(e => setError(e?.message || 'Falha'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!name) { setError('Nome é obrigatório'); return; }
    try {
      await api.post('/content/api/categories/admin', {
        name, description, parentId: parentId || null,
      });
      setOpen(false); setName(''); setDescription(''); setParentId('');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Falha ao criar');
    }
  };

  const handleDelete = async (id: string, nameToDelete: string) => {
    if (!confirm(`Apagar "${nameToDelete}"?`)) return;
    try {
      await api.delete(`/content/api/categories/admin/${id}`);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Falha ao apagar');
    }
  };

  const flatList = flatten(tree);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0A1628">Categorias</Typography>
          <Typography variant="body2" color="text.secondary">Gerir árvore de categorias</Typography>
        </Box>
        <Button
          variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}
          sx={{ bgcolor: '#001B33', textTransform: 'none', '&:hover': { bgcolor: '#002B50' } }}
        >
          Nova Categoria
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            {flatList.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={3}>
                Sem categorias
              </Typography>
            ) : (
              <Stack spacing={1}>
                {flatList.map(c => (
                  <Stack key={c.id} direction="row" alignItems="center" justifyContent="space-between"
                    sx={{ pl: c.depth * 3, py: 0.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <FolderIcon sx={{ color: '#00A651', fontSize: 20 }} />
                      <Typography fontWeight={c.depth === 0 ? 700 : 500}>{c.name}</Typography>
                      {c.depth > 0 && <Chip size="small" label="sub" variant="outlined" />}
                    </Stack>
                    <IconButton size="small" color="error" onClick={() => handleDelete(c.id, c.name)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Categoria</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Nome" fullWidth value={name} onChange={e => setName(e.target.value)} />
            <TextField label="Descrição" fullWidth multiline rows={2}
              value={description} onChange={e => setDescription(e.target.value)} />
            <TextField select label="Categoria-mãe (opcional)" fullWidth
              value={parentId} onChange={e => setParentId(e.target.value)}>
              <MenuItem value="">— Nenhuma (raíz) —</MenuItem>
              {flatList.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  {'  '.repeat(c.depth)}{c.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
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

export default AdminCategorias;
