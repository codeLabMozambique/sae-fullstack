import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, TextField, Alert, CircularProgress, Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Block as BlockIcon,
  MenuBook as SubjectIcon, Search as SearchIcon, Close as CloseIcon,
  FilterList as FilterIcon, Tag as CodeIcon,
} from '@mui/icons-material';
import { subjectService, type SubjectDTO } from '../../../services/academicService';

const ACCENT = '#00A651';
const PRIMARY = '#0A1628';

const glass = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.88)',
  boxShadow: '0 8px 32px rgba(31,38,135,0.08)',
} as const;

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: 'rgba(248,250,252,0.8)',
    transition: 'all 0.2s',
    '&:hover fieldset': { borderColor: ACCENT },
    '&.Mui-focused fieldset': { borderColor: ACCENT, borderWidth: 2 },
    '&.Mui-focused': { backgroundColor: 'rgba(255,255,255,0.95)' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: ACCENT },
} as const;

const gradBtn = {
  background: 'linear-gradient(135deg,#00A651 0%,#00c96a 100%)',
  '&:hover': { background: 'linear-gradient(135deg,#008f44 0%,#00a855 100%)', boxShadow: '0 6px 20px rgba(0,166,81,0.45)' },
  '&:disabled': { background: '#ccc', boxShadow: 'none', transform: 'none' },
  boxShadow: '0 4px 15px rgba(0,166,81,0.35)',
  borderRadius: '10px', textTransform: 'none' as const, fontWeight: 700,
} as const;

const emptyForm: SubjectDTO = { name: '', description: '', code: '' };

const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects]     = useState<SubjectDTO[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<SubjectDTO | null>(null);
  const [form, setForm]             = useState<SubjectDTO>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch]         = useState('');

  const load = async () => {
    try { setLoading(true); setError(null); setSubjects(await subjectService.findAll()); }
    catch { setError('Erro ao carregar disciplinas. Verifique a ligação ao servidor.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => subjects.filter(s => {
    const q = search.toLowerCase();
    return !q
      || s.name.toLowerCase().includes(q)
      || (s.code ?? '').toLowerCase().includes(q)
      || (s.description ?? '').toLowerCase().includes(q);
  }), [subjects, search]);

  const openCreate  = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit    = (r: SubjectDTO) => { setEditing(r); setForm({ ...r }); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyForm); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('O nome da disciplina é obrigatório.'); return; }
    try {
      setSubmitting(true); setError(null);
      editing?.id ? await subjectService.update({ ...form, id: editing.id }) : await subjectService.save(form);
      closeDialog(); await load();
    } catch { setError('Erro ao salvar disciplina.'); }
    finally { setSubmitting(false); }
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Desativar esta disciplina?')) return;
    try { setError(null); await subjectService.deactivate(id); await load(); }
    catch { setError('Erro ao desativar disciplina.'); }
  };

  /* code badge colour derived from the code string */
  const codeColor = (code: string) => {
    const colors = [
      { bg: 'rgba(0,166,81,0.1)', color: '#00A651' },
      { bg: 'rgba(21,101,192,0.1)', color: '#1565c0' },
      { bg: 'rgba(156,39,176,0.1)', color: '#7b1fa2' },
      { bg: 'rgba(0,131,143,0.1)', color: '#00838f' },
      { bg: 'rgba(230,81,0,0.1)', color: '#e65100' },
    ];
    const idx = code.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  return (
    <Box sx={{ minHeight: '100%', background: 'linear-gradient(160deg,#eef2ff 0%,#f8fafc 50%,#f0fdf4 100%)', p: 3, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,166,81,.07) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: -80, left: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(156,39,176,.05) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,#0A1628 0%,#1565c0 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, p: 2.5, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.2, borderRadius: 2, background: 'rgba(0,166,81,0.15)', border: '1px solid rgba(0,166,81,0.25)', display: 'flex' }}>
              <SubjectIcon sx={{ color: '#4caf50', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" color="white" sx={{ lineHeight: 1.2 }}>Disciplinas</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.3 }}>Gestão do currículo académico</Typography>
            </Box>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ ...gradBtn, px: 3 }}>
            Nova Disciplina
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, ...glass }} onClose={() => setError(null)}>{error}</Alert>}

        {/* ── Search ── */}
        <Box sx={{ ...glass, borderRadius: 3, p: 2, mb: 2.5, display: 'flex', gap: 2, alignItems: 'center' }}>
          <FilterIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <TextField
            size="small" placeholder="Pesquisar por nome, código ou descrição…"
            value={search} onChange={e => setSearch(e.target.value)}
            slotProps={{ input: {
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
              endAdornment: search ? (
                <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch('')}><CloseIcon sx={{ fontSize: 15 }} /></IconButton></InputAdornment>
              ) : null,
            } }}
            sx={{ flex: 1, maxWidth: 420, ...inputSx }}
          />
          {search && (
            <Button size="small" onClick={() => setSearch('')} sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.8rem' }}>
              Limpar
            </Button>
          )}
          <Chip label={`${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`} size="small"
            sx={{ bgcolor: 'rgba(0,166,81,0.1)', color: ACCENT, ml: 'auto', border: '1px solid rgba(0,166,81,0.2)' }} />
        </Box>

        {/* ── Table ── */}
        <Box sx={{ ...glass, borderRadius: 3, overflow: 'hidden' }} className="animate-fade-in">
          <Box sx={{ px: 3, py: 2, background: 'linear-gradient(135deg,#0A1628 0%,#1e3a5f 100%)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 0.8, borderRadius: 1.5, background: 'rgba(0,166,81,0.15)', border: '1px solid rgba(0,166,81,0.2)', display: 'flex' }}>
              <SubjectIcon sx={{ color: '#4caf50', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" color="white" sx={{ flex: 1 }}>Lista de Disciplinas</Typography>
            {!loading && (
              <Chip label={`${subjects.length} registo${subjects.length !== 1 ? 's' : ''}`} size="small"
                sx={{ bgcolor: 'rgba(0,166,81,0.15)', color: '#4caf50', border: '1px solid rgba(0,166,81,0.25)' }} />
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, background: 'rgba(255,255,255,0.5)' }}>
              <CircularProgress sx={{ color: ACCENT }} />
            </Box>
          ) : (
            <TableContainer sx={{ background: 'transparent' }}>
              <Table sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(0,0,0,0.025)' }}>
                    {['Código', 'Nome', 'Descrição', 'Ações'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.7, py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ border: 'none', py: 0 }}>
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <SubjectIcon sx={{ fontSize: 52, color: 'rgba(0,0,0,0.08)', mb: 1.5 }} />
                          <Typography color="text.secondary" fontWeight={500}>Nenhuma disciplina encontrada</Typography>
                          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                            {search ? 'Tente ajustar o termo de pesquisa' : 'Crie a primeira disciplina clicando em "Nova Disciplina"'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(row => {
                    const { bg, color } = row.code ? codeColor(row.code) : { bg: 'rgba(0,0,0,0.05)', color: '#757575' };
                    return (
                      <TableRow key={row.id} sx={{ transition: 'background .15s', '&:hover': { background: 'rgba(0,166,81,0.035)' } }}>
                        <TableCell sx={{ py: 1.5, width: 120 }}>
                          {row.code ? (
                            <Chip icon={<CodeIcon sx={{ fontSize: '14px !important', color: `${color} !important` }} />}
                              label={row.code} size="small"
                              sx={{ bgcolor: bg, color, border: `1px solid ${color}33`, fontWeight: 700 }} />
                          ) : (
                            <Typography variant="body2" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography fontWeight={600} color={PRIMARY} variant="body2">{row.name}</Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#475569', maxWidth: 340, py: 1.5 }}>
                          <Typography variant="body2" noWrap title={row.description}>
                            {row.description || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <Tooltip title="Editar" placement="top">
                            <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: '#1976d2', mr: 0.5, '&:hover': { bgcolor: 'rgba(25,118,210,0.08)' } }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Desativar" placement="top">
                            <IconButton size="small" onClick={() => row.id !== undefined && handleDeactivate(row.id)}
                              sx={{ color: '#ef5350', '&:hover': { bgcolor: 'rgba(239,83,80,0.08)' } }}>
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>

      {/* ── Dialog ── */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth
        slotProps={{
          backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } },
          paper: { sx: { ...glass, background: 'rgba(255,255,255,0.97)', borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' } },
        }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg,#0A1628 0%,#1565c0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <SubjectIcon sx={{ color: '#4caf50' }} />
              <Typography variant="h6" color="white">{editing ? 'Editar Disciplina' : 'Nova Disciplina'}</Typography>
            </Box>
            <IconButton onClick={closeDialog} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: '0 0 140px' }}>
              <TextField label="Código" value={form.code ?? ''}
                onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                placeholder="Ex: MAT" fullWidth size="small"
                inputProps={{ maxLength: 20 }} sx={inputSx}
                helperText="Máx. 20 caracteres" />
            </Box>
            <TextField label="Nome *" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Matemática" fullWidth size="small" sx={inputSx} />
          </Box>
          <TextField
            label="Descrição" value={form.description ?? ''}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Breve descrição da disciplina e seus objectivos…"
            fullWidth size="small" multiline rows={3}
            inputProps={{ maxLength: 1000 }} sx={inputSx}
            helperText={`${(form.description ?? '').length}/1000`}
          />
        </DialogContent>

        <Box sx={{ px: 3, pb: 3, pt: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={closeDialog} sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 500, borderRadius: '10px', px: 2.5, border: '1px solid rgba(0,0,0,0.1)', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', transform: 'none' } }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ ...gradBtn, px: 3, minWidth: 110 }}>
            {submitting ? <CircularProgress size={18} color="inherit" /> : editing ? 'Actualizar' : 'Salvar'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default SubjectsPage;
