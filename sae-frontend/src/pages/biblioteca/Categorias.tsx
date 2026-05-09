import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, IconButton, Collapse,
  CircularProgress, Alert, Chip, Stack, TextField, InputAdornment,
} from '@mui/material';
import {
  ExpandMore, ExpandLess, Folder as FolderIcon, FolderOpen as FolderOpenIcon,
  AutoStories as BookIcon, Search as SearchIcon, Public as PublicIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { listCategoriesTree, type Category } from '../../services/contentService';
import SpeechButton from '../../components/biblioteca/SpeechButton';

interface NodeProps {
  cat: Category;
  depth?: number;
  search: string;
}

// recursivamente verifica se cat ou subcat tem o termo
function nodeMatches(cat: Category, q: string): boolean {
  if (!q) return true;
  const norm = (s: string | null | undefined) =>
    (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const term = norm(q);
  if (norm(cat.name).includes(term) || norm(cat.description).includes(term)) return true;
  return cat.children?.some(c => nodeMatches(c, q)) ?? false;
}

const CategoryNode: React.FC<NodeProps> = ({ cat, depth = 0, search }) => {
  const [open, setOpen] = useState(depth < 1 || search.length > 0);
  const navigate = useNavigate();
  const hasChildren = (cat.children?.length ?? 0) > 0;

  if (!nodeMatches(cat, search)) return null;

  // Cores diferenciadas por profundidade
  const tones = depth === 0
    ? { bg: '#001B33', border: '#001B33', icon: '#00A651' }
    : depth === 1
      ? { bg: '#F8FAFC', border: '#E5E7EB', icon: '#3B82F6' }
      : { bg: '#F9FAFB', border: '#F3F4F6', icon: '#9CA3AF' };

  return (
    <>
      <Box
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) setOpen(!open);
          else navigate(`/student/library?discipline=${encodeURIComponent(cat.name)}`);
        }}
        sx={{
          ml: depth * 3,
          mb: 1,
          p: 1.5, pl: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: tones.border,
          bgcolor: depth === 0 ? tones.bg : '#fff',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 1.5,
          transition: 'all 0.18s',
          '&:hover': {
            transform: 'translateX(2px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          },
        }}
      >
        <Box sx={{
          width: 36, height: 36, borderRadius: 1.5,
          bgcolor: depth === 0 ? 'rgba(255,255,255,0.1)' : '#F0FDF4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: depth === 0 ? '#00A651' : tones.icon,
          flexShrink: 0,
        }}>
          {hasChildren
            ? (open ? <FolderOpenIcon /> : <FolderIcon />)
            : <BookIcon />}
        </Box>

        <Box flex={1} minWidth={0}>
          <Typography
            fontWeight={depth === 0 ? 800 : 600}
            color={depth === 0 ? '#fff' : '#0A1628'}
            sx={{ fontSize: depth === 0 ? '1rem' : '0.95rem' }}
            noWrap
          >
            {cat.name}
          </Typography>
          {cat.description && (
            <Typography
              variant="caption"
              color={depth === 0 ? 'rgba(255,255,255,0.65)' : 'text.secondary'}
              sx={{ display: 'block' }}
              noWrap
            >
              {cat.description}
            </Typography>
          )}
        </Box>

        {hasChildren && (
          <Chip
            size="small"
            label={cat.children!.length}
            sx={{
              fontWeight: 700,
              bgcolor: depth === 0 ? 'rgba(255,255,255,0.15)' : '#F0FDF4',
              color: depth === 0 ? '#fff' : '#00A651',
              height: 22,
            }}
          />
        )}
        <SpeechButton text={`${cat.name}. ${cat.description ?? ''}`} />
        {hasChildren && (
          <IconButton size="small" sx={{ color: depth === 0 ? '#fff' : '#9CA3AF' }}>
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Box>

      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          {cat.children!.map(c => (
            <CategoryNode key={c.id} cat={c} depth={depth + 1} search={search} />
          ))}
        </Collapse>
      )}
    </>
  );
};

const Categorias: React.FC = () => {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listCategoriesTree()
      .then(setTree)
      .catch(e => setError(e?.message || 'Falha ao carregar categorias'))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    let total = 0;
    const walk = (cs: Category[]) => cs.forEach(c => { total++; if (c.children) walk(c.children); });
    walk(tree);
    return { roots: tree.length, total };
  }, [tree]);

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2} mb={3}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
            <Typography variant="h5" fontWeight={700} color="#0A1628">
              Categorias da Biblioteca
            </Typography>
            <Chip
              size="small" icon={<PublicIcon sx={{ fontSize: '14px !important' }} />}
              label="Acesso público" sx={{ bgcolor: '#F0FDF4', color: '#00A651', fontWeight: 600 }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {loading
              ? 'A carregar…'
              : `${stats.roots} áreas · ${stats.total} categorias no total — alinhadas ao SNE de Moçambique`}
          </Typography>
        </Box>

        <TextField
          size="small" placeholder="Pesquisar categoria…"
          value={search} onChange={e => setSearch(e.target.value)}
          sx={{
            width: { xs: '100%', sm: 280 },
            '& .MuiOutlinedInput-root': { bgcolor: '#fff', borderRadius: 2 },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: '#9CA3AF' }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : tree.length === 0 ? (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <FolderIcon sx={{ fontSize: 48, color: '#E5E7EB', mb: 1 }} />
            <Typography fontWeight={600} color="text.secondary">
              Sem categorias registadas
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {tree.map(c => <CategoryNode key={c.id} cat={c} search={search} />)}
        </Box>
      )}
    </Box>
  );
};

export default Categorias;
