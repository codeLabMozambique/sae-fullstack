import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import {
  Card, CardContent, CardActions,
  Typography, Button, TextField, InputAdornment, Box,
  Chip, Stack, IconButton, Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  MenuBook as ReadIcon,
  Code as CodeIcon,
  Functions as FunctionsIcon,
  Storage as StorageIcon,
  Psychology as PsychologyIcon,
  Router as RouterIcon,
} from '@mui/icons-material';

// ── Types ─────────────────────────────────────────────────────

interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  year: number;
  pages: number;
}

// ── Data ──────────────────────────────────────────────────────

const books: Book[] = [
  { id: 1, title: 'Introdução à Programação', author: 'João Silva', category: 'Programação', year: 2022, pages: 412 },
  { id: 2, title: 'Cálculo Diferencial I', author: 'Ana Costa', category: 'Matemática', year: 2021, pages: 580 },
  { id: 3, title: 'Sistemas Distribuídos', author: 'Pedro Santos', category: 'Sistemas', year: 2023, pages: 344 },
  { id: 4, title: 'Inteligência Artificial Aplicada', author: 'Maria Luz', category: 'IA', year: 2023, pages: 496 },
  { id: 5, title: 'Redes de Computadores', author: 'Carlos Freitas', category: 'Redes', year: 2020, pages: 372 },
  { id: 6, title: 'Algoritmos e Estruturas de Dados', author: 'Sofia Matos', category: 'Programação', year: 2022, pages: 528 },
  { id: 7, title: 'Álgebra Linear para Engenharia', author: 'Miguel Sousa', category: 'Matemática', year: 2021, pages: 460 },
  { id: 8, title: 'Segurança de Sistemas', author: 'Luísa Ferreira', category: 'Sistemas', year: 2023, pages: 318 },
];

const CATEGORIES = ['Todas', 'Programação', 'Matemática', 'Sistemas', 'IA', 'Redes'];

// ── Book cover config ─────────────────────────────────────────
// All gradients start from the project's dark navy (#001B33) for brand consistency

type CoverConfig = { gradient: string; Icon: React.ElementType };

const COVER_CONFIG: Record<string, CoverConfig> = {
  Programação: {
    gradient: 'linear-gradient(145deg, #001B33 0%, #1D3A8A 55%, #2563EB 100%)',
    Icon: CodeIcon,
  },
  Matemática: {
    gradient: 'linear-gradient(145deg, #0D0B1E 0%, #4C1D95 55%, #6D28D9 100%)',
    Icon: FunctionsIcon,
  },
  Sistemas: {
    gradient: 'linear-gradient(145deg, #001B33 0%, #064E3B 55%, #00A651 100%)',
    Icon: StorageIcon,
  },
  IA: {
    gradient: 'linear-gradient(145deg, #1A0B2E 0%, #7E1D5F 55%, #A21CAF 100%)',
    Icon: PsychologyIcon,
  },
  Redes: {
    gradient: 'linear-gradient(145deg, #001B33 0%, #0C3A5F 55%, #0369A1 100%)',
    Icon: RouterIcon,
  },
};

const DEFAULT_COVER: CoverConfig = {
  gradient: 'linear-gradient(145deg, #001B33 0%, #002B50 100%)',
  Icon: ReadIcon,
};

// ── Book Cover component ───────────────────────────────────────

const BookCover: React.FC<{ book: Book }> = ({ book }) => {
  const { gradient, Icon } = COVER_CONFIG[book.category] ?? DEFAULT_COVER;

  return (
    <Box
      sx={{
        height: 175,
        background: gradient,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 2.25,
      }}
    >
      {/* Decorative orbs */}
      <Box sx={{
        position: 'absolute', top: -28, right: -28,
        width: 100, height: 100, borderRadius: '50%',
        bgcolor: 'rgba(255,255,255,0.05)',
        pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', bottom: -20, left: -20,
        width: 80, height: 80, borderRadius: '50%',
        bgcolor: 'rgba(255,255,255,0.04)',
        pointerEvents: 'none',
      }} />

      {/* Large background icon */}
      <Box sx={{
        position: 'absolute',
        right: -10, bottom: -8,
        color: 'rgba(255,255,255,0.08)',
        '& svg': { fontSize: 100 },
        pointerEvents: 'none',
      }}>
        <Icon />
      </Box>

      {/* Top: category label */}
      <Typography sx={{
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontSize: '0.55rem',
        position: 'relative',
        zIndex: 1,
      }}>
        {book.category}
      </Typography>

      {/* Bottom: title + author */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography sx={{
          color: '#fff',
          fontWeight: 700,
          lineHeight: 1.3,
          fontSize: '0.88rem',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          mb: 0.5,
        }}>
          {book.title}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem' }}>
          {book.author}
        </Typography>
      </Box>
    </Box>
  );
};

// ── Main component ────────────────────────────────────────────

const CHIP_STYLE: Record<string, { active: string; text: string }> = {
  Programação: { active: '#2563EB', text: '#DBEAFE' },
  Matemática:  { active: '#6D28D9', text: '#EDE9FE' },
  Sistemas:    { active: '#00A651', text: '#DCFCE7' },
  IA:          { active: '#A21CAF', text: '#FAE8FF' },
  Redes:       { active: '#0369A1', text: '#E0F2FE' },
};

const Biblioteca: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');

  const filtered = books.filter(b => {
    const q = search.toLowerCase();
    const matchSearch =
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q);
    const matchCat = category === 'Todas' || b.category === category;
    return matchSearch && matchCat;
  });

  return (
    <Box>
      {/* ── Header ── */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0A1628">
            Biblioteca Digital
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {books.length} títulos disponíveis
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Pesquisar título ou autor..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#9CA3AF' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            width: { xs: '100%', sm: 280 },
            '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: 2 },
          }}
        />
      </Box>

      {/* ── Category filters ── */}
      <Stack direction="row" flexWrap="wrap" sx={{ mb: 3, gap: 1 }}>
        {CATEGORIES.map(cat => {
          const isActive = category === cat;
          const style = CHIP_STYLE[cat];
          return (
            <Chip
              key={cat}
              label={cat}
              clickable
              onClick={() => setCategory(cat)}
              sx={{
                fontWeight: isActive ? 700 : 500,
                bgcolor: isActive
                  ? (style?.active ?? '#0A1628')
                  : '#fff',
                color: isActive ? '#fff' : '#6B7280',
                border: '1px solid',
                borderColor: isActive
                  ? (style?.active ?? '#0A1628')
                  : '#E5E7EB',
                '&:hover': {
                  bgcolor: isActive
                    ? (style?.active ?? '#0A1628')
                    : '#F9FAFB',
                },
              }}
            />
          );
        })}
      </Stack>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            bgcolor: '#fff',
            borderRadius: 3,
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          }}
        >
          <ReadIcon sx={{ fontSize: 48, color: '#E5E7EB', mb: 1 }} />
          <Typography fontWeight={600} color="text.secondary">
            Nenhum livro encontrado
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map(book => (
            <Grid key={book.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  border: '1px solid #F3F4F6',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.22s, transform 0.22s',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0,27,51,0.15)',
                    transform: 'translateY(-3px)',
                  },
                }}
              >
                <BookCover book={book} />

                <CardContent sx={{ p: 2, pb: 0.75, flexGrow: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="#111827"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.4,
                      mb: 0.5,
                    }}
                  >
                    {book.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {book.author}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {book.year} · {book.pages} páginas
                  </Typography>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2, pt: 1, gap: 1 }}>
                  <Tooltip title="Download PDF">
                    <IconButton
                      size="small"
                      sx={{
                        border: '1px solid #E5E7EB',
                        borderRadius: 1.5,
                        color: '#9CA3AF',
                        flexShrink: 0,
                        '&:hover': { bgcolor: '#F3F4F6', color: '#374151' },
                      }}
                    >
                      <DownloadIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<ReadIcon sx={{ fontSize: '14px !important' }} />}
                    fullWidth
                    sx={{
                      bgcolor: '#001B33',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.78rem',
                      borderRadius: 1.5,
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
    </Box>
  );
};

export default Biblioteca;
