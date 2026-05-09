import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, Stack, IconButton, CircularProgress,
  Alert, Card, CardContent,
} from '@mui/material';
import {
  ArrowBack as BackIcon, CloudDone as OfflineIcon, Public as PublicIcon,
  Person as AuthorIcon, MenuBook as PagesIcon,
} from '@mui/icons-material';
import PdfReader from '../../components/biblioteca/PdfReader';
import {
  getContentById, getProgress, readUrl, type Content, type ReadingProgressView,
} from '../../services/contentService';
import { useOfflineContent } from '../../hooks/useOfflineContent';
import SpeechButton from '../../components/biblioteca/SpeechButton';

const Leitor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const offline = useOfflineContent();

  const [content, setContent] = useState<Content | null>(null);
  const [initialPage, setInitialPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const isAuthed = !!localStorage.getItem('sae_token');
    Promise.all([
      getContentById(id),
      // Só pede progresso se houver token (utilizador anónimo não tem progresso)
      isAuthed ? getProgress(id).catch(() => null as ReadingProgressView | null) : Promise.resolve(null),
    ])
      .then(([c, prog]) => {
        setContent(c);
        if (prog?.currentPage) setInitialPage(prog.currentPage);
      })
      .catch(e => setError(e?.message || 'Conteúdo não encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) return null;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !content) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Voltar
        </Button>
        <Alert severity="error">{error || 'Conteúdo não encontrado'}</Alert>
      </Box>
    );
  }

  const isCached = offline.cachedIds.has(content.id);

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <IconButton onClick={() => navigate(-1)} sx={{
          bgcolor: '#fff', border: '1px solid #E5E7EB',
          '&:hover': { bgcolor: '#F9FAFB' },
        }}>
          <BackIcon />
        </IconButton>
        <Box flex={1} minWidth={0}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="h6" fontWeight={700} color="#0A1628" noWrap>
              {content.title}
            </Typography>
            {isCached && (
              <Chip
                size="small" icon={<OfflineIcon sx={{ fontSize: '14px !important' }} />}
                label="Offline"
                sx={{ bgcolor: '#00A651', color: '#fff', fontWeight: 700 }}
              />
            )}
            {!offline.isOnline && (
              <Chip size="small" label="Sem internet" color="warning" />
            )}
          </Stack>
          <Stack direction="row" spacing={1.5} mt={0.5} flexWrap="wrap">
            {content.discipline && (
              <Typography variant="caption" color="text.secondary">
                <strong>{content.discipline}</strong>
              </Typography>
            )}
            {content.level && (
              <Typography variant="caption" color="text.secondary">
                · {content.level}
              </Typography>
            )}
            {content.uploadedByName && (
              <Typography variant="caption" color="text.secondary">
                · <AuthorIcon sx={{ fontSize: 12 }} /> {content.uploadedByName}
              </Typography>
            )}
            {content.totalPages && (
              <Typography variant="caption" color="text.secondary">
                · <PagesIcon sx={{ fontSize: 12 }} /> {content.totalPages} pág.
              </Typography>
            )}
          </Stack>
        </Box>
        <SpeechButton text={`${content.title}. ${content.description ?? ''}`} size="medium" />
      </Stack>

      {/* Reader */}
      <PdfReader
        url={readUrl(content.id)}
        contentId={content.id}
        initialPage={initialPage}
      />

      {/* Política TdR */}
      <Card sx={{ mt: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <PublicIcon sx={{ color: '#00A651', fontSize: 20 }} />
            <Typography variant="caption" color="text.secondary">
              Leitura apenas dentro da plataforma. O progresso e o tempo são guardados
              automaticamente. {!isCached && offline.isOnline && (
                <strong>Guarda offline</strong>
              )} {!isCached && offline.isOnline && 'na Biblioteca para ler sem internet.'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Leitor;
