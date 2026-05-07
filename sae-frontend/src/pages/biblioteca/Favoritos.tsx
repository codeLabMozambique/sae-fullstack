import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, CardActions, Typography, Button, IconButton,
  CircularProgress, Alert, Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Favorite as FavoriteIcon, MenuBook as ReadIcon,
} from '@mui/icons-material';
import {
  listFavorites, removeFavorite, readUrl, absoluteContentUrl,
  type Content,
} from '../../services/contentService';

const Favoritos: React.FC = () => {
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listFavorites()
      .then(setItems)
      .catch(e => setError(e?.message || 'Falha ao carregar favoritos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (id: string) => {
    try {
      await removeFavorite(id);
      setItems(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      setError(e?.message || 'Falha ao remover');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1} color="#0A1628">
        Os Meus Favoritos
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {loading ? 'A carregar…' : `${items.length} livros favoritados`}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Box textAlign="center" py={8} bgcolor="#fff" borderRadius={3}>
          <FavoriteIcon sx={{ fontSize: 48, color: '#E5E7EB', mb: 1 }} />
          <Typography fontWeight={600} color="text.secondary">
            Ainda não tens favoritos
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Marca livros como favoritos na Biblioteca
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
                    height: 160, bgcolor: '#001B33',
                    backgroundImage: thumb ? `url(${thumb})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }} />
                  <CardContent sx={{ pb: 0.5 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{c.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.discipline ?? 'Geral'} · {c.totalPages ?? 0} pág.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                    <Tooltip title="Remover dos favoritos">
                      <IconButton size="small" color="error" onClick={() => handleRemove(c.id)}>
                        <FavoriteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Button
                      variant="contained" size="small" fullWidth
                      startIcon={<ReadIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => window.open(readUrl(c.id), '_blank')}
                      disabled={!c.fileUrl}
                      sx={{ bgcolor: '#001B33', textTransform: 'none', '&:hover': { bgcolor: '#002B50' } }}
                    >
                      Ler
                    </Button>
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

export default Favoritos;
