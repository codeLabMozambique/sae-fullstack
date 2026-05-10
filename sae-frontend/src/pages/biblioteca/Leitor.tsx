import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, Stack, IconButton, CircularProgress,
  Alert, Card, CardContent, Dialog, DialogContent, DialogActions,
  TextField, Divider, MenuItem, Snackbar,
} from '@mui/material';
import {
  ArrowBack as BackIcon, CloudDone as OfflineIcon, Public as PublicIcon,
  MenuBook as PagesIcon, EmojiEvents as GoalIcon, Person as AuthorIcon,
  CalendarToday as CalendarIcon, School as SchoolIcon, Category as CatIcon,
  CloudDownload as SaveOfflineIcon, DeleteOutline as RemoveOfflineIcon,
} from '@mui/icons-material';
import PdfReader from '../../components/biblioteca/PdfReader';
import {
  getContentById, getProgress, readUrl, createGoal, absoluteContentUrl,
  type Content, type ReadingProgressView,
} from '../../services/contentService';
import { useOfflineContent } from '../../hooks/useOfflineContent';
import SpeechButton from '../../components/biblioteca/SpeechButton';

const FREQ_OPTIONS = [
  { value: 'DAILY',          label: 'Diário' },
  { value: 'EVERY_2_DAYS',   label: 'A cada 2 dias' },
  { value: 'WEEKLY',         label: 'Semanal' },
  { value: 'BEFORE_DEADLINE', label: 'Antes do prazo' },
];

const Leitor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const offline = useOfflineContent();

  const [content, setContent] = useState<Content | null>(null);
  const [initialPage, setInitialPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [introOpen, setIntroOpen] = useState(true);
  const [goalStep, setGoalStep] = useState(false);

  // goal form
  const [goalPages, setGoalPages] = useState<number>(0);
  const [goalDaily, setGoalDaily] = useState<number>(0);
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalFreq, setGoalFreq] = useState('DAILY');
  const [goalEmail, setGoalEmail] = useState('');
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalSaved, setGoalSaved] = useState(false);
  const [offlineSnack, setOfflineSnack] = useState<string | null>(null);

  const isAuthed = !!localStorage.getItem('sae_token');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getContentById(id),
      isAuthed
        ? getProgress(id).catch(() => null as ReadingProgressView | null)
        : Promise.resolve(null),
    ])
      .then(([c, prog]) => {
        setContent(c);
        if (prog?.currentPage) setInitialPage(prog.currentPage);
      })
      .catch(e => setError(e?.message || 'Conteúdo não encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCreateGoal = async () => {
    if (!content || goalPages <= 0 || !goalDeadline) {
      setGoalError('Preencha o número de páginas e a data limite');
      return;
    }
    try {
      const payload: Parameters<typeof createGoal>[0] = {
        title: `Ler "${content.title}"`,
        targetPages: goalPages,
        deadline: goalDeadline,
        goalType: 'BOOK',
        contentId: content.id,
        contentTitle: content.title,
        contentThumbnail: absoluteContentUrl(content.thumbnailUrl) ?? undefined,
      };
      if (goalDaily > 0) payload.dailyPagesTarget = goalDaily;
      if (goalEmail) {
        (payload as any).reminderEmail = goalEmail;
        (payload as any).reminderEnabled = true;
        (payload as any).reminderFrequency = goalFreq;
      }
      await createGoal(payload);
      setGoalSaved(true);
      setGoalStep(false);
      setIntroOpen(false);
    } catch {
      setGoalError('Falha ao criar meta. Tenta novamente.');
    }
  };

  if (!id) return null;

  if (loading) return (
    <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
  );

  if (error || !content) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Voltar</Button>
        <Alert severity="error">{error || 'Conteúdo não encontrado'}</Alert>
      </Box>
    );
  }

  const isCached = offline.cachedIds.has(content.id);
  const thumbUrl = absoluteContentUrl(content.thumbnailUrl);

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <IconButton onClick={() => navigate(-1)} sx={{
          bgcolor: '#fff', border: '1px solid #E5E7EB', '&:hover': { bgcolor: '#F9FAFB' },
        }}>
          <BackIcon />
        </IconButton>
        <Box flex={1} minWidth={0}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="h6" fontWeight={700} color="#0A1628" noWrap>
              {content.title}
            </Typography>
            {isCached && (
              <Chip size="small" icon={<OfflineIcon sx={{ fontSize: '14px !important' }} />}
                label="Offline" sx={{ bgcolor: '#00A651', color: '#fff', fontWeight: 700 }} />
            )}
            {!offline.isOnline && <Chip size="small" label="Sem internet" color="warning" />}
            {goalSaved && (
              <Chip size="small" icon={<GoalIcon sx={{ fontSize: '14px !important' }} />}
                label="Meta criada" sx={{ bgcolor: '#F59E0B', color: '#fff', fontWeight: 700 }} />
            )}
          </Stack>
          <Stack direction="row" spacing={1.5} mt={0.5} flexWrap="wrap">
            {content.discipline && (
              <Typography variant="caption" color="text.secondary"><strong>{content.discipline}</strong></Typography>
            )}
            {content.level && (
              <Typography variant="caption" color="text.secondary">· {content.level}</Typography>
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

      <PdfReader url={readUrl(content.id)} contentId={content.id} initialPage={initialPage} />

      <Card sx={{ mt: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1.5} flex={1}>
              <PublicIcon sx={{ color: '#00A651', fontSize: 20, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary">
                Leitura apenas dentro da plataforma. O progresso é guardado automaticamente.
              </Typography>
            </Stack>
            {isCached ? (
              <Stack direction="row" alignItems="center" spacing={0.75} flexShrink={0}>
                <Chip
                  size="small"
                  icon={<OfflineIcon sx={{ fontSize: '13px !important' }} />}
                  label="Disponível offline"
                  sx={{ bgcolor: '#F0FDF4', color: '#00A651', fontWeight: 700, fontSize: '0.68rem' }}
                />
                <Button
                  size="small"
                  startIcon={offline.busy.has(content.id)
                    ? <CircularProgress size={12} />
                    : <RemoveOfflineIcon sx={{ fontSize: 14 }} />}
                  disabled={offline.busy.has(content.id)}
                  onClick={async () => {
                    await offline.removeOffline(content.id);
                    setOfflineSnack('Removido do dispositivo');
                  }}
                  sx={{ textTransform: 'none', color: '#DC2626', fontSize: '0.72rem',
                    '&:hover': { bgcolor: '#FEF2F2' }, minWidth: 0 }}
                >
                  Remover
                </Button>
              </Stack>
            ) : offline.isOnline ? (
              <Button
                size="small"
                variant="outlined"
                startIcon={offline.busy.has(content.id)
                  ? <CircularProgress size={12} sx={{ color: '#00A651' }} />
                  : <SaveOfflineIcon sx={{ fontSize: 14 }} />}
                disabled={offline.busy.has(content.id)}
                onClick={async () => {
                  await offline.saveOffline(content.id);
                  setOfflineSnack('Guardado para leitura offline!');
                }}
                sx={{
                  textTransform: 'none', borderColor: '#00A651', color: '#00A651',
                  fontSize: '0.72rem', flexShrink: 0,
                  '&:hover': { bgcolor: '#F0FDF4', borderColor: '#00A651' },
                }}
              >
                {offline.busy.has(content.id) ? 'A guardar…' : 'Guardar offline'}
              </Button>
            ) : (
              <Chip size="small" label="Sem internet" color="warning" />
            )}
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={!!offlineSnack}
        autoHideDuration={3000}
        onClose={() => setOfflineSnack(null)}
        message={offlineSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* ─── Popup introdução (estilo ficha de livro) ─────────── */}
      <Dialog
        open={introOpen && !goalStep}
        onClose={() => setIntroOpen(false)}
        maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', minHeight: 360 }}>

            {/* Capa */}
            <Box sx={{
              width: 200, minWidth: 200, flexShrink: 0,
              background: 'linear-gradient(160deg, #0A1628 0%, #001B33 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {thumbUrl ? (
                <Box component="img" src={thumbUrl} alt={content.title}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <Box textAlign="center">
                  <PagesIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 1 }} />
                  <Typography variant="caption" color="rgba(255,255,255,0.4)" display="block" px={1}>
                    {content.discipline ?? 'SAE'}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Detalhes */}
            <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="h5" fontWeight={800} color="#0A1628" lineHeight={1.2} mb={0.5}>
                  {content.title}
                </Typography>
                {content.uploadedByName && (
                  <Typography variant="body2" color="#00A651" fontWeight={600}>
                    {content.uploadedByName}
                  </Typography>
                )}
              </Box>

              {/* Chips de metadados */}
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {content.discipline && (
                  <Chip size="small" icon={<SchoolIcon />} label={content.discipline}
                    sx={{ bgcolor: '#EEF2FF', color: '#4338CA' }} />
                )}
                {content.level && (
                  <Chip size="small" label={content.level} sx={{ bgcolor: '#F0FDF4', color: '#166534' }} />
                )}
                {content.totalPages && (
                  <Chip size="small" icon={<PagesIcon />} label={`${content.totalPages} pág.`}
                    sx={{ bgcolor: '#F9FAFB' }} />
                )}
                {content.year && (
                  <Chip size="small" icon={<CalendarIcon />} label={String(content.year)}
                    sx={{ bgcolor: '#F9FAFB' }} />
                )}
                {content.publisher && (
                  <Chip size="small" label={content.publisher} sx={{ bgcolor: '#F9FAFB' }} />
                )}
              </Stack>

              {content.description && (
                <>
                  <Divider />
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
                    {content.description.length > 360
                      ? content.description.slice(0, 360) + '…'
                      : content.description}
                  </Typography>
                </>
              )}

              {initialPage > 1 && (
                <Alert severity="info" sx={{ mt: 'auto' }}>
                  Continuas da página <strong>{initialPage}</strong>.
                </Alert>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1, bgcolor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
          {isAuthed && (
            <Button variant="outlined" startIcon={<GoalIcon />}
              onClick={() => setGoalStep(true)}
              sx={{ textTransform: 'none', borderColor: '#001B33', color: '#001B33' }}>
              Definir Meta de Leitura
            </Button>
          )}
          <Box flex={1} />
          <Button onClick={() => setIntroOpen(false)} sx={{ textTransform: 'none' }}>
            Fechar
          </Button>
          <Button variant="contained" onClick={() => setIntroOpen(false)}
            sx={{ bgcolor: '#001B33', '&:hover': { bgcolor: '#002B50' }, textTransform: 'none', px: 3 }}>
            Começar a Ler
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Popup criação de meta ─────────────────────────────── */}
      <Dialog
        open={goalStep}
        onClose={() => setGoalStep(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #0A1628 0%, #001B33 100%)',
          px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2,
        }}>
          {thumbUrl && (
            <Box component="img" src={thumbUrl} alt=""
              sx={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 1, display: 'block' }} />
          )}
          <Box>
            <Typography variant="overline" color="rgba(255,255,255,0.6)" lineHeight={1}>
              Meta de Leitura
            </Typography>
            <Typography fontWeight={700} color="#fff" fontSize={15} mt={0.25}>
              {content.title}
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ pt: 2.5 }}>
          {goalError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGoalError(null)}>{goalError}</Alert>}
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Páginas a ler (total)" type="number" fullWidth autoFocus
                value={goalPages || ''}
                onChange={e => setGoalPages(Number(e.target.value) || 0)}
                helperText={content.totalPages ? `${content.totalPages} pág. no total` : undefined}
              />
              <TextField
                label="Páginas por dia" type="number" fullWidth
                value={goalDaily || ''}
                onChange={e => setGoalDaily(Number(e.target.value) || 0)}
                helperText="Opcional"
              />
            </Stack>
            <TextField
              label="Data limite" type="date" InputLabelProps={{ shrink: true }} fullWidth
              value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)}
            />

            <Divider><Typography variant="caption" color="text.secondary">Lembrete por email (opcional)</Typography></Divider>

            <TextField
              label="Email para lembretes" type="email" fullWidth
              value={goalEmail} onChange={e => setGoalEmail(e.target.value)}
              placeholder="o-teu-email@exemplo.com"
            />
            {goalEmail && (
              <TextField select label="Frequência" fullWidth value={goalFreq}
                onChange={e => setGoalFreq(e.target.value)}>
                {FREQ_OPTIONS.map(o => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => { setGoalStep(false); setIntroOpen(true); }} sx={{ textTransform: 'none' }}>
            Voltar
          </Button>
          <Button variant="contained" onClick={handleCreateGoal}
            sx={{ bgcolor: '#001B33', '&:hover': { bgcolor: '#002B50' }, textTransform: 'none', px: 3 }}>
            Criar Meta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Leitor;
