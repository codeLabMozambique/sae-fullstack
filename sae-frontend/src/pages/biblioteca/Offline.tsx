import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, CardActions, Typography, Button, IconButton,
  CircularProgress, Alert, Chip, Stack, Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  CloudOff as OfflineIcon, Wifi as OnlineIcon, MenuBook as ReadIcon,
  Delete as DeleteIcon, DeleteSweep as ClearAllIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useOfflineContent } from '../../hooks/useOfflineContent';
import { getContentById, type Content } from '../../services/contentService';

const Offline: React.FC = () => {
  const navigate = useNavigate();
  const offline = useOfflineContent();
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // sempre que muda o set de cachedIds, busca os metadados
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError(null);
      try {
        const ids = Array.from(offline.cachedIds);
        const results = await Promise.all(
          ids.map(id => getContentById(id).catch(() => null))
        );
        if (!cancelled) setItems(results.filter((c): c is Content => !!c));
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Falha ao carregar metadados');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [offline.cachedIds]);

  const handleClearAll = async () => {
    if (!confirm('Apagar todos os livros guardados offline?')) return;
    await offline.clearAll();
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Typography variant="h5" fontWeight={700} color="#0A1628">
              Leitura Offline
            </Typography>
            <Chip
              size="small"
              icon={offline.isOnline ? <OnlineIcon sx={{ fontSize: '14px !important' }} /> : <OfflineIcon sx={{ fontSize: '14px !important' }} />}
              label={offline.isOnline ? 'Online' : 'Offline'}
              sx={{
                bgcolor: offline.isOnline ? '#F0FDF4' : '#FEF2F2',
                color: offline.isOnline ? '#00A651' : '#DC2626',
                fontWeight: 700, fontSize: '0.7rem',
              }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'A carregar…' : `${items.length} livros guardados no dispositivo`}
          </Typography>
        </Box>
        {items.length > 0 && (
          <Button
            variant="outlined" color="error" startIcon={<ClearAllIcon />}
            onClick={handleClearAll}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Apagar todos
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <OfflineIcon sx={{ fontSize: 56, color: '#E5E7EB', mb: 1.5 }} />
            <Typography fontWeight={700} color="text.secondary" mb={0.5}>
              Sem livros guardados
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vai à Biblioteca, escolhe um livro e clica em <strong>Guardar offline</strong> ☁️.
              <br />
              Vais poder lê-lo mesmo sem internet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {items.map(c => (
            <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card sx={{
                borderRadius: 3, boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                border: '1px solid #DCFCE7',
              }}>
                <Box sx={{
                  height: 140, bgcolor: '#001B33', position: 'relative',
                  backgroundImage: c.thumbnailUrl
                    ? `url(${(import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080') + '/content' + c.thumbnailUrl})`
                    : undefined,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }}>
                  <Chip
                    size="small" icon={<OfflineIcon sx={{ fontSize: '13px !important' }} />}
                    label="Offline"
                    sx={{
                      position: 'absolute', top: 8, right: 8,
                      bgcolor: '#00A651', color: '#fff',
                      fontWeight: 700, fontSize: '0.65rem',
                    }}
                  />
                </Box>
                <CardContent sx={{ pb: 0.5 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>{c.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.discipline ?? 'Geral'} · {c.totalPages ?? 0} pág.
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                  <Button
                    fullWidth size="small" variant="contained"
                    startIcon={<ReadIcon sx={{ fontSize: '14px !important' }} />}
                    onClick={() => navigate(`/leitor/${c.id}`)}
                    sx={{ bgcolor: '#001B33', textTransform: 'none', '&:hover': { bgcolor: '#002B50' } }}
                  >
                    Ler
                  </Button>
                  <Tooltip title="Remover do dispositivo">
                    <IconButton size="small" color="error"
                      onClick={() => offline.removeOffline(c.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Offline;
