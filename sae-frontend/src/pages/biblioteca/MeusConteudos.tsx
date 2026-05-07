import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, CardActions, Button, IconButton,
  CircularProgress, Alert, Tooltip, Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Delete as DeleteIcon, MenuBook as ReadIcon, Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  listContents, deleteProfessorContent, deleteAdminContent,
  readUrl, absoluteContentUrl, type Content,
} from '../../services/contentService';
import { useAuth } from '../../context/AuthContext';

const MeusConteudos: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrador' || user?.role === 'ADMIN';

  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    // Sem o user.role 'ADMIN', filtramos pelo telefone do user (uploadedBy = JWT subject)
    const params = isAdmin ? { size: 100 } : { uploadedBy: user?.username, size: 100 };
    listContents(params)
      .then(res => setItems(res.content))
      .catch(e => setError(e?.message || 'Falha ao carregar'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [isAdmin, user?.username]);

  const handleDelete = async (id: string) => {
    if (!confirm('Apagar este conteúdo? Esta acção é irreversível.')) return;
    try {
      if (isAdmin) await deleteAdminContent(id);
      else await deleteProfessorContent(id);
      setItems(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Falha ao apagar');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1} color="#0A1628">
        {isAdmin ? 'Todos os Conteúdos' : 'Os Meus Conteúdos'}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {loading ? 'A carregar…' : `${items.length} conteúdos`}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Box textAlign="center" py={8} bgcolor="#fff" borderRadius={3}>
          <Typography fontWeight={600} color="text.secondary">
            Ainda não carregaste nenhum conteúdo
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {items.map(c => {
            const thumb = absoluteContentUrl(c.thumbnailUrl);
            return (
              <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                  <Box sx={{
                    height: 140, bgcolor: '#001B33',
                    backgroundImage: thumb ? `url(${thumb})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    position: 'relative',
                  }}>
                    {c.uploadedByRole && (
                      <Chip size="small" label={c.uploadedByRole}
                        sx={{ position: 'absolute', top: 8, right: 8,
                          bgcolor: 'rgba(255,255,255,0.92)', fontSize: '0.6rem', fontWeight: 700 }}
                      />
                    )}
                  </Box>
                  <CardContent sx={{ pb: 0.5 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{c.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.discipline ?? 'Geral'} · {c.totalPages ?? 0} pág. · {c.year ?? '—'}
                    </Typography>
                    {c.targetClassroomIds && c.targetClassroomIds.length > 0 && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Turmas: {c.targetClassroomIds.join(', ')}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                    <Tooltip title="Ver">
                      <IconButton size="small" onClick={() => window.open(readUrl(c.id), '_blank')}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Button
                      size="small" startIcon={<ReadIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => window.open(readUrl(c.id), '_blank')}
                      sx={{ flex: 1, textTransform: 'none' }}
                    >
                      Abrir
                    </Button>
                    <Tooltip title="Apagar">
                      <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default MeusConteudos;
