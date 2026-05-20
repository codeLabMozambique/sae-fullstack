import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, TextField, Alert, CircularProgress, Tooltip,
  InputAdornment, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Block as BlockIcon,
  MenuBook as SubjectIcon, Search as SearchIcon, Close as CloseIcon,
  FilterList as FilterIcon, Tag as CodeIcon,
} from '@mui/icons-material';
import { subjectService, classLevelService, type SubjectDTO, type ClassLevelDTO } from '../../../services/academicService';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

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

const emptyForm: SubjectDTO = { name: '', description: '', code: '', classLevelId: undefined, schoolId: undefined };

const SubjectsPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const isSchoolAdmin = authUser?.role === 'Administrador de Escola';
  const [schoolAdminSchoolId, setSchoolAdminSchoolId] = useState<number | null>(null);

  const [subjects, setSubjects]     = useState<SubjectDTO[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevelDTO[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<SubjectDTO | null>(null);
  const [form, setForm]             = useState<SubjectDTO>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch]         = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage]             = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const load = async (sid?: number) => {
    const schoolId = sid ?? schoolAdminSchoolId;
    try {
      setLoading(true); setError(null);
      const [subj, lvl] = await Promise.all([
        isSchoolAdmin && schoolId ? subjectService.findBySchool(schoolId) : subjectService.findAll(),
        classLevelService.findAll(),
      ]);
      setSubjects(subj); setClassLevels(lvl);
    }
    catch { setError('Erro ao carregar disciplinas. Verifique a ligação ao servidor.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true); setError(null);
        if (isSchoolAdmin) {
          const profileRes = await api.get<{ schoolId: number }>('/auth/users/school-admin-profile');
          const sid = profileRes.data.schoolId;
          setSchoolAdminSchoolId(sid);
          const [subj, lvl] = await Promise.all([subjectService.findBySchool(sid), classLevelService.findAll()]);
          setSubjects(subj); setClassLevels(lvl);
        } else {
          const [subj, lvl] = await Promise.all([subjectService.findAll(), classLevelService.findAll()]);
          setSubjects(subj); setClassLevels(lvl);
        }
      } catch { setError('Erro ao carregar disciplinas. Verifique a ligação ao servidor.'); }
      finally { setLoading(false); }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => subjects.filter(s => {
    const q = search.toLowerCase();
    const matchText = !q
      || s.name.toLowerCase().includes(q)
      || (s.code ?? '').toLowerCase().includes(q)
      || (s.description ?? '').toLowerCase().includes(q);
    const matchLevel = !levelFilter || String(s.classLevelId) === levelFilter;
    return matchText && matchLevel;
  }), [subjects, search, levelFilter]);

  useEffect(() => { setPage(0); }, [search, levelFilter]);

  const openCreate  = () => {
    setEditing(null);
    setForm({ ...emptyForm, schoolId: isSchoolAdmin && schoolAdminSchoolId ? schoolAdminSchoolId : undefined });
    setDialogOpen(true);
  };;
  const openEdit    = (r: SubjectDTO) => { setEditing(r); setForm({ ...r }); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyForm); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('O nome da disciplina é obrigatório.'); return; }
    if (!form.classLevelId) { setError('Seleccione o nível de classe.'); return; }
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
      { bg: 'rgba(21,101,192,0.1)', color: '#00A651' },
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#0A1628">Disciplinas</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Gestão do currículo académico</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' }, borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}>
            Nova Disciplina
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, ...glass }} onClose={() => setError(null)}>{error}</Alert>}

        {/* ── Search ── */}
        <Box sx={{ ...glass, borderRadius: 3, p: 2, mb: 2.5, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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
            sx={{ flex: 1, minWidth: 200, maxWidth: 360, ...inputSx }}
          />
          <FormControl size="small" sx={{ minWidth: 160, ...inputSx }}>
            <InputLabel>Nível de Classe</InputLabel>
            <Select value={levelFilter} label="Nível de Classe" onChange={e => setLevelFilter(e.target.value as string)}>
              <MenuItem value="">Todos os níveis</MenuItem>
              {classLevels.map(l => <MenuItem key={l.id} value={String(l.id)}>{l.name}</MenuItem>)}
            </Select>
          </FormControl>
          {(search || levelFilter) && (
            <Button size="small" onClick={() => { setSearch(''); setLevelFilter(''); }} sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.8rem' }}>
              Limpar
            </Button>
          )}
          <Chip label={`${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`} size="small"
            sx={{ bgcolor: 'rgba(0,166,81,0.1)', color: ACCENT, ml: 'auto', border: '1px solid rgba(0,166,81,0.2)' }} />
        </Box>

        {/* ── Table ── */}
        <Box sx={{ ...glass, borderRadius: 3, overflow: 'hidden' }} className="animate-fade-in">
          <Box sx={{ px: 3, py: 2, background: 'rgba(248,250,252,0.8)', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 0.8, borderRadius: 1.5, background: 'rgba(0,166,81,0.1)', border: '1px solid rgba(0,166,81,0.2)', display: 'flex' }}>
              <SubjectIcon sx={{ color: ACCENT, fontSize: 20 }} />
            </Box>
            <Typography variant="h6" color={PRIMARY} sx={{ flex: 1 }}>Lista de Disciplinas</Typography>
            {!loading && (
              <Chip label={`${subjects.length} registo${subjects.length !== 1 ? 's' : ''}`} size="small"
                sx={{ bgcolor: 'rgba(0,166,81,0.1)', color: ACCENT, border: '1px solid rgba(0,166,81,0.2)' }} />
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, background: 'rgba(255,255,255,0.5)' }}>
              <CircularProgress sx={{ color: ACCENT }} />
            </Box>
          ) : (
            <>
            <TableContainer sx={{ background: 'transparent' }}>
              <Table sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(0,0,0,0.025)' }}>
                    {['Código', 'Nome', 'Nível', 'Descrição', 'Ações'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.7, py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ border: 'none', py: 0 }}>
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <SubjectIcon sx={{ fontSize: 52, color: 'rgba(0,0,0,0.08)', mb: 1.5 }} />
                          <Typography color="text.secondary" fontWeight={500}>Nenhuma disciplina encontrada</Typography>
                          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                            {(search || levelFilter) ? 'Tente ajustar os filtros de pesquisa' : 'Crie a primeira disciplina clicando em "Nova Disciplina"'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(row => {
                    const { bg, color } = row.code ? codeColor(row.code) : { bg: 'rgba(0,0,0,0.05)', color: '#757575' };
                    const levelName = classLevels.find(l => l.id === row.classLevelId)?.name;
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
                        <TableCell sx={{ py: 1.5 }}>
                          {levelName
                            ? <Chip label={levelName} size="small" sx={{ bgcolor: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)' }} />
                            : <Typography variant="body2" color="text.disabled">—</Typography>
                          }
                        </TableCell>
                        <TableCell sx={{ color: '#475569', maxWidth: 280, py: 1.5 }}>
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
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
              sx={{ borderTop: '1px solid rgba(0,0,0,0.06)', bgcolor: 'rgba(248,250,252,0.6)' }}
            />
            </>
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
          <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg,#0A1628 0%,#00A651 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                slotProps={{ htmlInput: { maxLength: 20 } }} sx={inputSx}
                helperText="Máx. 20 caracteres" />
            </Box>
            <TextField label="Nome *" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Ex: Matemática" fullWidth size="small" sx={inputSx} />
          </Box>
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Nível de Classe *</InputLabel>
            <Select
              value={form.classLevelId ?? ''}
              label="Nível de Classe *"
              onChange={e => setForm(p => ({ ...p, classLevelId: Number(e.target.value) || undefined }))}>
              {classLevels.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField
            label="Descrição" value={form.description ?? ''}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Breve descrição da disciplina e seus objectivos…"
            fullWidth size="small" multiline rows={3}
            slotProps={{ htmlInput: { maxLength: 1000 } }} sx={inputSx}
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
