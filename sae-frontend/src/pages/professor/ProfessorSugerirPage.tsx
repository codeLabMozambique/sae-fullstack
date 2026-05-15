import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Card, CardContent, CardActions, Button, Chip,
  Stack, Grid, TextField, InputAdornment, IconButton, CircularProgress,
  Alert, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  MenuItem, Select, FormControl, InputLabel, OutlinedInput, Avatar, ListItemText,
} from '@mui/material';
import {
  Search as SearchIcon, MenuBook as ReadIcon, AutoStories as BookIcon,
  Bookmark as SuggestIcon, Close as CloseIcon, Send as SendIcon,
  Schedule as ScheduleIcon, History as HistoryIcon, Delete as DeleteIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import {
  listContents, absoluteContentUrl, type Content,
} from '../../services/contentService';
import {
  createSuggestion, listMySuggestions, deleteSuggestion,
  type ReadingSuggestion,
} from '../../services/suggestionService';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';
import { useNavigate } from 'react-router-dom';

const ProfessorSugerirPage: React.FC = () => {
  const navigate = useNavigate();
  const { classrooms, loading: classroomsLoading } = useMyClassrooms();

  // Catálogo
  const [books, setBooks] = useState<Content[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [search, setSearch] = useState('');

  // Sugestões já feitas
  const [mySuggestions, setMySuggestions] = useState<ReadingSuggestion[]>([]);
  const [loadingSug, setLoadingSug] = useState(true);

  // Modal de sugerir
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Content | null>(null);
  const [classroomIds, setClassroomIds] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const [startPage, setStartPage] = useState<string>('');
  const [endPage, setEndPage] = useState<string>('');
  const [chapterRange, setChapterRange] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Carrega catálogo + sugestões anteriores
  useEffect(() => {
    listContents({ size: 100 })
      .then(res => setBooks(res.content))
      .catch(e => setError(e?.message || 'Falha ao carregar biblioteca'))
      .finally(() => setLoadingBooks(false));
    refreshMine();
  }, []);

  const refreshMine = () => {
    setLoadingSug(true);
    listMySuggestions()
      .then(setMySuggestions)
      .catch(() => undefined)
      .finally(() => setLoadingSug(false));
  };

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      (b.discipline ?? '').toLowerCase().includes(q) ||
      (b.description ?? '').toLowerCase().includes(q)
    );
  }, [books, search]);

  const handleOpenDialog = (book: Content) => {
    setSelectedBook(book);
    setClassroomIds([]);
    setNote(''); setStartPage(''); setEndPage(''); setChapterRange('');
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!selectedBook) return;
    if (classroomIds.length === 0) {
      setError('Escolhe pelo menos uma turma');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const sp = startPage ? Number(startPage) : undefined;
      const ep = endPage ? Number(endPage) : undefined;
      if (sp && selectedBook.totalPages && sp > selectedBook.totalPages) {
        setError(`Página inicial fora do livro (${selectedBook.totalPages} páginas)`);
        setSubmitting(false);
        return;
      }
      const created = await createSuggestion({
        contentId: selectedBook.id,
        classroomIds,
        note: note.trim() || undefined,
        startPage: sp,
        endPage: ep,
        chapterRange: chapterRange.trim() || undefined,
      });
      setSuccess(`Sugestão enviada a ${created.length} turma(s).`);
      setOpenDialog(false);
      refreshMine();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Falha ao criar sugestão');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apagar esta sugestão?')) return;
    try {
      await deleteSuggestion(id);
      setMySuggestions(prev => prev.filter(s => s.id !== id));
    } catch {
      setError('Falha ao apagar');
    }
  };

  const classroomName = (id: number) => classrooms.find(c => c.id === id)?.name ?? `Turma ${id}`;

  return (
    <Box>
      {/* Hero */}
      <Paper elevation={0} sx={{
        borderRadius: 4, p: { xs: 3, md: 4 }, mb: 3,
        background: 'linear-gradient(135deg, #0A1628 0%, #1E3A8A 70%, #00A651 100%)',
        color: '#fff', boxShadow: '0 10px 30px rgba(10,22,40,0.2)',
      }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
          <SuggestIcon sx={{ fontSize: 44, color: '#86EFAC' }} />
          <Box flex={1}>
            <Typography variant="h4" fontWeight={800}>Sugerir Leitura</Typography>
            <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>
              Escolhe um livro da biblioteca e indica páginas ou capítulos que os teus alunos devem ler.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Sugestões anteriores */}
      {mySuggestions.length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, mb: 3, border: '1px solid #F1F5F9' }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <HistoryIcon sx={{ color: '#6B7280' }} />
            <Typography variant="h6" fontWeight={700}>Sugestões recentes ({mySuggestions.length})</Typography>
          </Stack>
          <Stack spacing={1.5}>
            {mySuggestions.slice(0, 5).map(s => (
              <Stack key={s.id} direction="row" alignItems="center" spacing={2}
                sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2 }}
              >
                <Avatar sx={{ bgcolor: '#0A1628', width: 40, height: 40 }}>
                  <BookIcon fontSize="small" />
                </Avatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={700}>{s.contentTitle}</Typography>
                  }
                  secondary={
                    <Stack direction="row" spacing={1} mt={0.5} alignItems="center" flexWrap="wrap">
                      <Chip size="small" label={classroomName(s.classroomId)}
                        sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 600, fontSize: '0.65rem' }} />
                      {s.startPage && (
                        <Chip size="small" icon={<ReadIcon sx={{ fontSize: '14px !important' }} />}
                          label={s.endPage ? `pp. ${s.startPage}–${s.endPage}` : `desde pág. ${s.startPage}`}
                          sx={{ bgcolor: '#F0FDF4', color: '#00A651', fontWeight: 600, fontSize: '0.65rem' }} />
                      )}
                      {s.chapterRange && (
                        <Chip size="small" label={s.chapterRange}
                          sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600, fontSize: '0.65rem' }} />
                      )}
                    </Stack>
                  }
                />
                <IconButton size="small" onClick={() => handleDelete(s.id)} sx={{ color: '#DC2626' }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Catálogo */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between" mb={2} gap={2}>
        <Typography variant="h6" fontWeight={700} color="#0A1628">
          Biblioteca — escolhe um livro
        </Typography>
        <TextField
          size="small" placeholder="Pesquisar título, disciplina…"
          value={search} onChange={e => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 320 }, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
        />
      </Stack>

      {loadingBooks ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress sx={{ color: '#00A651' }} /></Box>
      ) : filteredBooks.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '2px dashed #E5E7EB', bgcolor: 'transparent' }}>
          <BookIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 1.5 }} />
          <Typography color="textSecondary">Nenhum livro encontrado</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filteredBooks.map(book => {
            const thumb = absoluteContentUrl(book.thumbnailUrl);
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={book.id}>
                <Card sx={{
                  borderRadius: 3, height: '100%',
                  display: 'flex', flexDirection: 'column',
                  border: '1px solid #F1F5F9',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: '#00A651', boxShadow: '0 8px 20px rgba(0,166,81,0.12)' },
                }}>
                  <Box sx={{
                    height: 150, bgcolor: '#0A1628',
                    backgroundImage: thumb ? `url(${thumb})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    position: 'relative',
                  }}>
                    {book.discipline && (
                      <Chip size="small" label={book.discipline}
                        sx={{ position: 'absolute', top: 8, left: 8,
                          bgcolor: 'rgba(255,255,255,0.92)', fontWeight: 700, fontSize: '0.65rem' }} />
                    )}
                  </Box>
                  <CardContent sx={{ flex: 1, pb: 1 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{book.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {book.totalPages ?? 0} páginas · {book.level ?? '—'}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button fullWidth variant="contained" startIcon={<SuggestIcon />}
                      onClick={() => handleOpenDialog(book)}
                      sx={{ bgcolor: '#00A651', textTransform: 'none', fontWeight: 700, borderRadius: 2,
                        '&:hover': { bgcolor: '#008C44' } }}
                    >
                      Sugerir
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Dialog — criar sugestão */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between"
            sx={{ px: 3, py: 2, bgcolor: '#0A1628', color: '#fff' }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <SuggestIcon sx={{ color: '#86EFAC' }} />
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>Sugerir leitura</Typography>
                <Typography variant="h6" fontWeight={700} noWrap>{selectedBook?.title}</Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setOpenDialog(false)} sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5} mt={1}>
            {/* Turmas */}
            <FormControl fullWidth disabled={classroomsLoading}>
              <InputLabel>Turmas</InputLabel>
              <Select
                multiple
                value={classroomIds}
                onChange={e => setClassroomIds(typeof e.target.value === 'string'
                  ? e.target.value.split(',').map(Number) : e.target.value as number[])}
                input={<OutlinedInput label="Turmas" />}
                renderValue={(selected) => (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {(selected as number[]).map(id => (
                      <Chip key={id} size="small" label={classroomName(id)} />
                    ))}
                  </Stack>
                )}
                sx={{ borderRadius: 2.5 }}
              >
                {classrooms.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name} <Typography variant="caption" sx={{ ml: 1, color: '#9CA3AF' }}>· {c.classLevelName}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Páginas */}
            <Stack direction="row" spacing={1.5}>
              <TextField
                type="number" label="Página inicial" value={startPage}
                onChange={e => setStartPage(e.target.value)}
                placeholder={selectedBook?.totalPages ? `1 a ${selectedBook.totalPages}` : 'ex: 12'}
                fullWidth size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />
              <TextField
                type="number" label="Página final (opcional)" value={endPage}
                onChange={e => setEndPage(e.target.value)}
                fullWidth size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />
            </Stack>

            {/* Capítulos */}
            <TextField
              label="Capítulo / Secção (opcional)" value={chapterRange}
              onChange={e => setChapterRange(e.target.value)}
              placeholder="ex: Capítulo 3 — Equações"
              fullWidth size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />

            <Divider />

            <TextField
              label="Nota para os alunos" value={note}
              onChange={e => setNote(e.target.value)}
              multiline rows={3}
              placeholder="ex: Leiam com atenção os exercícios resolvidos no fim do capítulo."
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button
            variant="contained" startIcon={<SendIcon />} onClick={handleSubmit}
            disabled={submitting || classroomIds.length === 0}
            sx={{ bgcolor: '#00A651', textTransform: 'none', fontWeight: 700, borderRadius: 2.5, px: 3,
              '&:hover': { bgcolor: '#008C44' } }}
          >
            {submitting ? 'A enviar…' : 'Enviar Sugestão'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfessorSugerirPage;
