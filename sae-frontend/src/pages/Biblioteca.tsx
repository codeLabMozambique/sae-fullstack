import React, { useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import {
  Card, CardContent, CardActions,
  Typography, Button, TextField, InputAdornment, Box,
  Chip, Stack, IconButton, Tooltip, CircularProgress, Alert, Snackbar,
} from '@mui/material';
import {
  Search as SearchIcon,
  MenuBook as ReadIcon,
  Code as CodeIcon,
  Functions as FunctionsIcon,
  Storage as StorageIcon,
  Psychology as PsychologyIcon,
  Router as RouterIcon,
  Science as ScienceIcon,
  HistoryEdu as HistoryIcon,
  Translate as TranslateIcon,
  Biotech as BiotechIcon,
  TrendingUp as EconomyIcon,
  FavoriteBorder as FavOutlineIcon,
  Favorite as FavIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  CloudDownload as SaveOfflineIcon,
  CloudDone as SavedOfflineIcon,
  WifiOff as OfflineIcon,
} from '@mui/icons-material';
import {
  listContents,
  searchContents,
  listDisciplines,
  listFavorites,
  addFavorite,
  removeFavorite,
  absoluteContentUrl,
  type Content,
  type Discipline,
} from '../services/contentService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { useOfflineContent } from '../hooks/useOfflineContent';
import { useAuth } from '../context/AuthContext';
import SpeechButton from '../components/biblioteca/SpeechButton';

// ── Cover config (mantém o look consistente) ──────────────────

type CoverConfig = { gradient: string; Icon: React.ElementType };

const COVER_CONFIG: Record<string, CoverConfig> = {
  Programação: { gradient: 'linear-gradient(145deg, #001B33 0%, #1D3A8A 55%, #2563EB 100%)', Icon: CodeIcon },
  Informática: { gradient: 'linear-gradient(145deg, #001B33 0%, #1D3A8A 55%, #2563EB 100%)', Icon: CodeIcon },
  Matemática:  { gradient: 'linear-gradient(145deg, #0D0B1E 0%, #4C1D95 55%, #6D28D9 100%)', Icon: FunctionsIcon },
  Matematica:  { gradient: 'linear-gradient(145deg, #0D0B1E 0%, #4C1D95 55%, #6D28D9 100%)', Icon: FunctionsIcon },
  Física:      { gradient: 'linear-gradient(145deg, #001B33 0%, #064E3B 55%, #00A651 100%)', Icon: StorageIcon },
  Química:     { gradient: 'linear-gradient(145deg, #1A0B2E 0%, #7E1D5F 55%, #A21CAF 100%)', Icon: ScienceIcon },
  Quimica:     { gradient: 'linear-gradient(145deg, #1A0B2E 0%, #7E1D5F 55%, #A21CAF 100%)', Icon: ScienceIcon },
  Biologia:    { gradient: 'linear-gradient(145deg, #001B33 0%, #064E3B 55%, #16A34A 100%)', Icon: BiotechIcon },
  História:    { gradient: 'linear-gradient(145deg, #1A0F02 0%, #78350F 55%, #B45309 100%)', Icon: HistoryIcon },
  Português:   { gradient: 'linear-gradient(145deg, #1B0A0A 0%, #7F1D1D 55%, #DC2626 100%)', Icon: ReadIcon },
  Inglês:      { gradient: 'linear-gradient(145deg, #001B33 0%, #0C3A5F 55%, #0369A1 100%)', Icon: TranslateIcon },
  Economia:    { gradient: 'linear-gradient(145deg, #042F2E 0%, #134E4A 55%, #0D9488 100%)', Icon: EconomyIcon },
  Tecnologia:  { gradient: 'linear-gradient(145deg, #001B33 0%, #0C3A5F 55%, #0369A1 100%)', Icon: RouterIcon },
  IA:          { gradient: 'linear-gradient(145deg, #1A0B2E 0%, #7E1D5F 55%, #A21CAF 100%)', Icon: PsychologyIcon },
};

const DEFAULT_COVER: CoverConfig = {
  gradient: 'linear-gradient(145deg, #001B33 0%, #002B50 100%)',
  Icon: ReadIcon,
};

// ── Book Cover ────────────────────────────────────────────────

const BookCover: React.FC<{ book: Content }> = ({ book }) => {
  const discipline = book.discipline ?? '';
  const { gradient, Icon } = COVER_CONFIG[discipline] ?? DEFAULT_COVER;
  const thumb = absoluteContentUrl(book.thumbnailUrl);

  // Se houver thumbnail, mostra a imagem; senão, fallback para o gradient + ícone
  if (thumb) {
    return (
      <Box
        sx={{
          height: 175,
          backgroundImage: `url(${thumb})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {discipline && (
          <Chip
            size="small"
            label={discipline}
            sx={{
              position: 'absolute', top: 8, left: 8,
              bgcolor: 'rgba(255,255,255,0.92)', fontWeight: 600,
              fontSize: '0.65rem',
            }}
          />
        )}
      </Box>
    );
  }

  return (
    <Box sx={{
      height: 175, background: gradient, position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2.25,
    }}>
      <Box sx={{ position: 'absolute', top: -28, right: -28, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.05)' }} />
      <Box sx={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
      <Box sx={{ position: 'absolute', right: -10, bottom: -8, color: 'rgba(255,255,255,0.08)', '& svg': { fontSize: 100 } }}>
        <Icon />
      </Box>
      <Typography sx={{
        color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: 1.5, fontSize: '0.55rem', position: 'relative', zIndex: 1,
      }}>
        {discipline || 'Geral'}
      </Typography>
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography sx={{
          color: '#fff', fontWeight: 700, lineHeight: 1.3, fontSize: '0.88rem',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', mb: 0.5,
        }}>
          {book.title}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem' }}>
          {book.uploadedByName ?? book.uploadedBy ?? 'SAE'}
        </Typography>
      </Box>
    </Box>
  );
};

// ── Main ─────────────────────────────────────────────────────

const ALL_LABEL = 'Todas';

// Níveis alinhados ao SNE de Moçambique
const SNE_LEVELS = [
  'Todos',
  'Primário',
  'Secundário 1º Ciclo',
  'Secundário 2º Ciclo',
  'Universitário',
  'EAD',
];

const Biblioteca: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeDiscipline, setActiveDiscipline] = useState<string>(ALL_LABEL);
  const [activeLevel, setActiveLevel] = useState<string>('Todos');
  const [books, setBooks] = useState<Content[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackMsg, setSnackMsg] = useState<string | null>(null);

  const voice = useVoiceSearch('pt-PT');
  const offline = useOfflineContent();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isPublicMode = location.pathname.startsWith('/biblioteca');

  // Carrega disciplinas e favoritos
  useEffect(() => {
    listDisciplines().then(setDisciplines).catch(() => undefined);
    listFavorites()
      .then(items => setFavIds(new Set(items.map(i => i.id))))
      .catch(() => undefined); // utilizador não autenticado: ignora silenciosamente
  }, []);

  // Quando o reconhecimento de voz devolve um transcript, usa-o como pesquisa
  useEffect(() => {
    if (voice.transcript) {
      setSearch(voice.transcript);
      voice.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.transcript]);

  const toggleFavorite = async (id: string) => {
    const isFav = favIds.has(id);
    setFavIds(prev => {
      const next = new Set(prev);
      isFav ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      if (isFav) await removeFavorite(id);
      else await addFavorite(id);
    } catch {
      // reverte em caso de erro
      setFavIds(prev => {
        const next = new Set(prev);
        isFav ? next.add(id) : next.delete(id);
        return next;
      });
    }
  };

  // Carrega conteúdos sempre que muda a disciplina ou nível seleccionados
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params: { discipline?: string; level?: string; size: number } = { size: 50 };
    if (activeDiscipline !== ALL_LABEL) params.discipline = activeDiscipline;
    if (activeLevel !== 'Todos') params.level = activeLevel;
    listContents(params)
      .then(res => setBooks(res.content))
      .catch(err => setError(err?.message || 'Falha ao carregar a biblioteca'))
      .finally(() => setLoading(false));
  }, [activeDiscipline, activeLevel]);

  // Pesquisa por texto — debounced via efeito + timer
  useEffect(() => {
    if (!search.trim()) return; // evita correr no mount
    const t = setTimeout(() => {
      setLoading(true);
      searchContents(search.trim(), 0, 50)
        .then(res => setBooks(res.content))
        .catch(err => setError(err?.message || 'Falha na pesquisa'))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Quando o utilizador limpa a pesquisa, recarrega lista filtrada
  useEffect(() => {
    if (search.trim()) return;
    const params: { discipline?: string; level?: string; size: number } = { size: 50 };
    if (activeDiscipline !== ALL_LABEL) params.discipline = activeDiscipline;
    if (activeLevel !== 'Todos') params.level = activeLevel;
    listContents(params)
      .then(res => setBooks(res.content))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search === '']);

  const categories = useMemo(
    () => [ALL_LABEL, ...disciplines.map(d => d.name)],
    [disciplines]
  );

  const handleOfflineToggle = async (book: Content) => {
    const wasCached = offline.cachedIds.has(book.id);
    try {
      if (wasCached) {
        await offline.removeOffline(book.id);
        setSnackMsg('Removido do dispositivo');
      } else {
        await offline.saveOffline(book.id);
        setSnackMsg('Guardado para leitura offline!');
      }
    } catch {
      setSnackMsg('Falha ao guardar offline');
    }
  };

  const handleRead = (book: Content) => {
    // Política TdR: leitura apenas dentro da plataforma — leitor embebido.
    navigate(isPublicMode ? `/biblioteca/leitor/${book.id}` : `/leitor/${book.id}`);
  };

  return (
    <Box>
      {/* Banner offline */}
      {!offline.isOnline && (
        <Alert
          severity="warning"
          icon={<OfflineIcon />}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          <strong>Estás offline.</strong> Só os {offline.cachedIds.size} livros guardados
          localmente estão disponíveis para leitura.
        </Alert>
      )}

      {/* Header */}
      <Box sx={{
        mb: 3, display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', flexWrap: 'wrap', gap: 2,
      }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Typography variant="h5" fontWeight={700} color="#0A1628">
              Biblioteca Digital
            </Typography>
            <Chip
              size="small" label="SNE Moçambique"
              sx={{ bgcolor: '#F0FDF4', color: '#00A651', fontWeight: 700, fontSize: '0.65rem' }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'A carregar…' : `${books.length} títulos · alinhados ao Sistema Nacional de Educação`}
          </Typography>
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 380 } }}>
          <TextField
            size="small"
            fullWidth
            placeholder={voice.listening ? '🎤 A ouvir… fala agora' : 'Pesquisar título, autor ou tocar no microfone'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#9CA3AF' }} />
                  </InputAdornment>
                ),
                endAdornment: voice.supported ? (
                  <InputAdornment position="end">
                    <Tooltip title={voice.listening ? 'Parar' : 'Pesquisar por voz (pt-PT)'}>
                      <IconButton
                        size="small"
                        onClick={() => voice.listening ? voice.stop() : voice.start()}
                        sx={{
                          color: voice.listening ? '#DC2626' : '#00A651',
                          bgcolor: voice.listening ? '#FEE2E2' : 'transparent',
                          animation: voice.listening ? 'pulse 1.4s ease-in-out infinite' : 'none',
                          '@keyframes pulse': {
                            '0%, 100%': { boxShadow: '0 0 0 0 rgba(220,38,38,0.5)' },
                            '50%':      { boxShadow: '0 0 0 8px rgba(220,38,38,0)' },
                          },
                          '&:hover': { bgcolor: voice.listening ? '#FCA5A5' : '#F0FDF4' },
                        }}
                      >
                        {voice.listening ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#fff', borderRadius: 2,
                ...(voice.listening && { boxShadow: '0 0 0 3px rgba(220,38,38,0.15)' }),
              },
            }}
          />
          {/* Painel de feedback da pesquisa por voz */}
          {(voice.listening || voice.interimTranscript || voice.error) && (
            <Box sx={{
              mt: 0.75, px: 1.5, py: 0.75, borderRadius: 1.5,
              bgcolor: voice.error ? '#FEF2F2' : '#FFF7ED',
              border: `1px solid ${voice.error ? '#FCA5A5' : '#FED7AA'}`,
              fontSize: '0.78rem', color: voice.error ? '#991B1B' : '#7C2D12',
            }}>
              {voice.error ? voice.error
                : voice.interimTranscript
                  ? <em>"{voice.interimTranscript}"</em>
                  : 'A ouvir… fala agora.'}
            </Box>
          )}
          {!voice.supported && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Pesquisa por voz só funciona em Chrome / Edge.
            </Typography>
          )}
        </Box>
      </Box>

      {/* Filtros — Nível SNE */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="caption" fontWeight={700} color="#6B7280" sx={{ letterSpacing: 1.2 }}>
          NÍVEL DE ENSINO
        </Typography>
        <Stack direction="row" flexWrap="wrap" sx={{ mt: 0.5, gap: 1 }}>
          {SNE_LEVELS.map(lv => {
            const isActive = activeLevel === lv;
            return (
              <Chip
                key={lv} label={lv} clickable
                onClick={() => setActiveLevel(lv)}
                sx={{
                  fontWeight: isActive ? 700 : 500,
                  bgcolor: isActive ? '#00A651' : '#fff',
                  color: isActive ? '#fff' : '#6B7280',
                  border: '1px solid',
                  borderColor: isActive ? '#00A651' : '#E5E7EB',
                  '&:hover': { bgcolor: isActive ? '#00A651' : '#F0FDF4' },
                }}
              />
            );
          })}
        </Stack>
      </Box>

      {/* Filtros — Disciplina */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" fontWeight={700} color="#6B7280" sx={{ letterSpacing: 1.2 }}>
          DISCIPLINA
        </Typography>
        <Stack direction="row" flexWrap="wrap" sx={{ mt: 0.5, gap: 1 }}>
          {categories.map(cat => {
            const isActive = activeDiscipline === cat;
            return (
              <Chip
                key={cat} label={cat} clickable
                onClick={() => { setActiveDiscipline(cat); setSearch(''); }}
                sx={{
                  fontWeight: isActive ? 700 : 500,
                  bgcolor: isActive ? '#0A1628' : '#fff',
                  color: isActive ? '#fff' : '#6B7280',
                  border: '1px solid',
                  borderColor: isActive ? '#0A1628' : '#E5E7EB',
                  '&:hover': { bgcolor: isActive ? '#0A1628' : '#F9FAFB' },
                }}
              />
            );
          })}
        </Stack>
      </Box>

      {/* Mensagem de erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : books.length === 0 ? (
        <Box sx={{
          textAlign: 'center', py: 10, bgcolor: '#fff', borderRadius: 3,
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        }}>
          <ReadIcon sx={{ fontSize: 48, color: '#E5E7EB', mb: 1 }} />
          <Typography fontWeight={600} color="text.secondary">
            Nenhum livro encontrado
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {books.map(book => (
            <Grid key={book.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card sx={{
                height: '100%', display: 'flex', flexDirection: 'column',
                borderRadius: 3, border: '1px solid #F3F4F6',
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden',
                transition: 'box-shadow 0.22s, transform 0.22s',
                '&:hover': { boxShadow: '0 8px 24px rgba(0,27,51,0.15)', transform: 'translateY(-3px)' },
              }}>
                <BookCover book={book} />

                <CardContent sx={{ p: 2, pb: 0.75, flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight={700} color="#111827" sx={{
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', lineHeight: 1.4, mb: 0.5,
                  }}>
                    {book.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {book.uploadedByName ?? book.uploadedBy ?? 'SAE'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {book.year ?? '—'} · {book.totalPages ?? 0} páginas
                  </Typography>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, pt: 1, gap: 0.75 }}>
                  {isAuthenticated && (
                    <Tooltip title={favIds.has(book.id) ? 'Remover favorito' : 'Marcar favorito'}>
                      <IconButton size="small" onClick={() => toggleFavorite(book.id)} sx={{
                        border: '1px solid #E5E7EB', borderRadius: 1.5,
                        color: favIds.has(book.id) ? '#DC2626' : '#9CA3AF',
                        flexShrink: 0,
                        '&:hover': { bgcolor: '#F3F4F6' },
                      }}>
                        {favIds.has(book.id)
                          ? <FavIcon sx={{ fontSize: 16 }} />
                          : <FavOutlineIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </Tooltip>
                  )}
                  <SpeechButton
                    text={`${book.title}. ${book.discipline ?? ''}. ${book.description ?? ''}`}
                  />
                  {isAuthenticated && book.fileUrl && (
                    <Tooltip title={
                      offline.busy.has(book.id)
                        ? 'A guardar…'
                        : offline.cachedIds.has(book.id)
                          ? 'Guardado offline — clica para remover'
                          : 'Guardar para ler sem internet'
                    }>
                      <span>
                        <IconButton
                          size="small"
                          disabled={offline.busy.has(book.id)}
                          onClick={() => handleOfflineToggle(book)}
                          sx={{
                            border: '1px solid',
                            borderColor: offline.cachedIds.has(book.id) ? '#00A651' : '#E5E7EB',
                            borderRadius: 1.5,
                            color: offline.cachedIds.has(book.id) ? '#00A651' : '#9CA3AF',
                            flexShrink: 0,
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: offline.cachedIds.has(book.id) ? '#FEF2F2' : '#F0FDF4',
                              borderColor: offline.cachedIds.has(book.id) ? '#FCA5A5' : '#00A651',
                              color: offline.cachedIds.has(book.id) ? '#DC2626' : '#00A651',
                            },
                          }}
                        >
                          {offline.busy.has(book.id) ? (
                            <CircularProgress size={14} sx={{ color: '#00A651' }} />
                          ) : offline.cachedIds.has(book.id) ? (
                            <SavedOfflineIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <SaveOfflineIcon sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  <Button
                    variant="contained" size="small" fullWidth
                    onClick={() => handleRead(book)}
                    startIcon={<ReadIcon sx={{ fontSize: '14px !important' }} />}
                    disabled={!book.fileUrl || (!offline.isOnline && !offline.cachedIds.has(book.id))}
                    sx={{
                      bgcolor: '#001B33', textTransform: 'none', fontWeight: 600,
                      fontSize: '0.78rem', borderRadius: 1.5,
                      '&:hover': { bgcolor: '#002B50' },
                    }}
                  >
                    Ler
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={!!snackMsg}
        autoHideDuration={3000}
        onClose={() => setSnackMsg(null)}
        message={snackMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default Biblioteca;
