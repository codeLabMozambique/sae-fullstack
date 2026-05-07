import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, LinearProgress,
  CircularProgress, Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { MenuBook as ReadIcon } from '@mui/icons-material';
import {
  listProgress, readUrl, absoluteContentUrl,
  type ReadingProgressView,
} from '../../services/contentService';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min`;
  return `${seconds}s`;
}

const ContinuarLer: React.FC = () => {
  const [items, setItems] = useState<ReadingProgressView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listProgress('lastReadAt,desc')
      .then(setItems)
      .catch(e => setError(e?.message || 'Falha ao carregar progresso'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1} color="#0A1628">
        Continuar a Ler
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {loading ? 'A carregar…' : `${items.length} livros em progresso`}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Box textAlign="center" py={8} bgcolor="#fff" borderRadius={3}>
          <ReadIcon sx={{ fontSize: 48, color: '#E5E7EB', mb: 1 }} />
          <Typography fontWeight={600} color="text.secondary">Sem leituras em curso</Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {items.map(p => {
            const thumb = absoluteContentUrl(p.thumbnailUrl);
            const pct = p.percentageComplete ?? 0;
            return (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ borderRadius: 3, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', overflow: 'hidden' }}>
                  <Box sx={{
                    width: 110, flexShrink: 0, bgcolor: '#001B33',
                    backgroundImage: thumb ? `url(${thumb})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }} />
                  <CardContent sx={{ flexGrow: 1, py: 2 }}>
                    <Typography variant="body2" fontWeight={700} sx={{
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {p.contentTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      Página {p.currentPage ?? 0} de {p.totalPages ?? 0} · {formatTime(p.totalReadingTimeSeconds)}
                    </Typography>
                    <LinearProgress
                      variant="determinate" value={pct}
                      sx={{ height: 6, borderRadius: 3, mb: 1.5,
                        '& .MuiLinearProgress-bar': { bgcolor: pct >= 100 ? '#16A34A' : '#00A651' } }}
                    />
                    <Typography variant="caption" color="text.secondary" mb={1.5} display="block">
                      {pct.toFixed(0)}% completo
                    </Typography>
                    <Button
                      variant="contained" size="small" fullWidth
                      startIcon={<ReadIcon sx={{ fontSize: '14px !important' }} />}
                      onClick={() => window.open(readUrl(p.contentId), '_blank')}
                      sx={{ bgcolor: '#001B33', textTransform: 'none', '&:hover': { bgcolor: '#002B50' } }}
                    >
                      Continuar
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default ContinuarLer;
