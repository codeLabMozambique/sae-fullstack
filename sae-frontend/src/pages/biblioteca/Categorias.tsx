import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, IconButton, Collapse,
  CircularProgress, Alert, List, ListItem, ListItemText, ListItemIcon,
} from '@mui/material';
import {
  ExpandMore, ExpandLess, Folder as FolderIcon, FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { listCategoriesTree, type Category } from '../../services/contentService';

const CategoryNode: React.FC<{ cat: Category; depth?: number }> = ({ cat, depth = 0 }) => {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = cat.children && cat.children.length > 0;

  return (
    <>
      <ListItem
        sx={{
          pl: 2 + depth * 2, cursor: hasChildren ? 'pointer' : 'default',
          '&:hover': { bgcolor: hasChildren ? '#F9FAFB' : 'transparent' },
        }}
        onClick={() => hasChildren && setOpen(!open)}
        secondaryAction={hasChildren ? (
          <IconButton edge="end" size="small">
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        ) : null}
      >
        <ListItemIcon sx={{ minWidth: 36, color: '#00A651' }}>
          {hasChildren ? (open ? <FolderOpenIcon /> : <FolderIcon />) : <FolderIcon />}
        </ListItemIcon>
        <ListItemText
          primary={cat.name}
          secondary={cat.description}
          primaryTypographyProps={{ fontWeight: depth === 0 ? 700 : 500 }}
        />
      </ListItem>
      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {cat.children!.map(c => <CategoryNode key={c.id} cat={c} depth={depth + 1} />)}
          </List>
        </Collapse>
      )}
    </>
  );
};

const Categorias: React.FC = () => {
  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCategoriesTree()
      .then(setTree)
      .catch(e => setError(e?.message || 'Falha ao carregar categorias'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1} color="#0A1628">
        Categorias da Biblioteca
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Explora o catálogo organizado por temas
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <Card sx={{ borderRadius: 3, maxWidth: 720 }}>
          <CardContent>
            {tree.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>
                Sem categorias registadas
              </Typography>
            ) : (
              <List>
                {tree.map(c => <CategoryNode key={c.id} cat={c} />)}
              </List>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Categorias;
