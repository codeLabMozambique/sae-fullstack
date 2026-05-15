import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Card, CardContent, CardActions, Button, Chip,
  Stack, Grid, CircularProgress, Alert, Avatar, Divider,
} from '@mui/material';
import {
  MenuBook as ReadIcon, Bookmark as SuggestIcon,
  Schedule as ScheduleIcon, Person as PersonIcon, Class as ClassIcon,
} from '@mui/icons-material';
import {
  listStudentSuggestions, type ReadingSuggestion,
} from '../../services/suggestionService';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';
import { useNavigate } from 'react-router-dom';

const StudentSugestoesPage: React.FC = () => {
  const navigate = useNavigate();
  const { classrooms, loading: classroomsLoading } = useMyClassrooms();
  const [suggestions, setSuggestions] = useState<ReadingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (classroomsLoading) return;
    if (classrooms.length === 0) {
      setSuggestions([]); setLoading(false);
      return;
    }
    listStudentSuggestions(classrooms.map(c => c.id))
      .then(setSuggestions)
      .catch(e => setError(e?.message || 'Falha ao carregar sugestões'))
      .finally(() => setLoading(false));
  }, [classrooms, classroomsLoading]);

  const classroomName = (id: number) => classrooms.find(c => c.id === id)?.name ?? `Turma ${id}`;

  const handleOpen = (s: ReadingSuggestion) => {
    // Passa a página inicial via query string — o Leitor abre exactamente ali
    const qs = s.startPage ? `?page=${s.startPage}` : '';
    navigate(`/leitor/${s.contentId}${qs}`);
  };

  return (
    <Box>
      {/* Hero */}
      <Paper elevation={0} sx={{
        borderRadius: 4, p: { xs: 3, md: 4 }, mb: 3,
        background: 'linear-gradient(135deg, #0A1628 0%, #1E3A8A 50%, #00A651 100%)',
        color: '#fff', boxShadow: '0 10px 30px rgba(10,22,40,0.2)',
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <SuggestIcon sx={{ fontSize: 44, color: '#86EFAC' }} />
          <Box>
            <Typography variant="h4" fontWeight={800}>Sugestões de Leitura</Typography>
            <Typography variant="body1" sx={{ opacity: 0.85, mt: 0.5 }}>
              Livros e capítulos recomendados pelos teus professores.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading || classroomsLoading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress sx={{ color: '#00A651' }} /></Box>
      ) : suggestions.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '2px dashed #E5E7EB', bgcolor: 'transparent' }}>
          <SuggestIcon sx={{ fontSize: 56, color: '#D1D5DB', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Sem sugestões por agora
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Quando os teus professores recomendarem leituras, aparecem aqui.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {suggestions.map(s => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={s.id}>
              <Card sx={{
                borderRadius: 3, height: '100%',
                display: 'flex', flexDirection: 'column',
                border: '1px solid #F1F5F9',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#00A651', boxShadow: '0 8px 20px rgba(0,166,81,0.12)' },
              }}>
                <CardContent sx={{ flex: 1, p: 3 }}>
                  <Stack direction="row" alignItems="flex-start" spacing={2} mb={2}>
                    <Avatar sx={{
                      bgcolor: '#0A1628', width: 48, height: 48, borderRadius: 2,
                    }}>
                      <ReadIcon />
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1 }}>
                        SUGESTÃO DE LEITURA
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{
                        lineHeight: 1.25, mt: 0.25,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {s.contentTitle}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Ranges */}
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
                    {s.startPage && (
                      <Chip
                        size="small"
                        icon={<ReadIcon sx={{ fontSize: '14px !important' }} />}
                        label={s.endPage ? `Páginas ${s.startPage}–${s.endPage}` : `Desde página ${s.startPage}`}
                        sx={{ bgcolor: '#F0FDF4', color: '#00A651', fontWeight: 700 }}
                      />
                    )}
                    {s.chapterRange && (
                      <Chip
                        size="small"
                        label={s.chapterRange}
                        sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700 }}
                      />
                    )}
                  </Stack>

                  {/* Nota do professor */}
                  {s.note && (
                    <Box sx={{
                      p: 1.5, mb: 2, bgcolor: '#F8FAFC', borderLeft: '3px solid #00A651',
                      borderRadius: '0 8px 8px 0',
                    }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                        NOTA DO PROFESSOR
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: '#374151' }}>
                        "{s.note}"
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  <Stack spacing={0.75}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PersonIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                      <Typography variant="caption" color="text.secondary">
                        {s.professorName || s.professorUsername}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ClassIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                      <Typography variant="caption" color="text.secondary">
                        {classroomName(s.classroomId)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ScheduleIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
                  <Button
                    fullWidth variant="contained" startIcon={<ReadIcon />}
                    onClick={() => handleOpen(s)}
                    sx={{
                      bgcolor: '#0A1628', textTransform: 'none', fontWeight: 700, borderRadius: 2,
                      '&:hover': { bgcolor: '#001B33' },
                    }}
                  >
                    {s.startPage ? `Ler na página ${s.startPage}` : 'Abrir livro'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default StudentSugestoesPage;
