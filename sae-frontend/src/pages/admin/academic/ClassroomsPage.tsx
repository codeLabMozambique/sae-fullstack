import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, TextField, Alert, CircularProgress, Tooltip,
  Avatar, InputAdornment, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Block as BlockIcon,
  MeetingRoom as ClassroomIcon, Search as SearchIcon, Close as CloseIcon,
  FilterList as FilterIcon, WbSunny as MorningIcon,
  WbTwilight as AfternoonIcon, NightsStay as NightIcon,
} from '@mui/icons-material';
import {
  classroomService, schoolService, classLevelService,
  type ClassroomDTO, type SchoolDTO, type ClassLevelDTO,
} from '../../../services/academicService';

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

const SHIFTS = ['Manhã', 'Tarde', 'Noite'];

const shiftStyle: Record<string, { bg: string; color: string; border: string; icon: React.ReactNode }> = {
  'Manhã': { bg: 'rgba(21,101,192,0.08)', color: '#1565c0', border: 'rgba(21,101,192,0.2)', icon: <MorningIcon sx={{ fontSize: '14px !important' }} /> },
  'Tarde': { bg: 'rgba(230,81,0,0.08)', color: '#e65100', border: 'rgba(230,81,0,0.2)', icon: <AfternoonIcon sx={{ fontSize: '14px !important' }} /> },
  'Noite': { bg: 'rgba(81,45,168,0.08)', color: '#512da8', border: 'rgba(81,45,168,0.2)', icon: <NightIcon sx={{ fontSize: '14px !important' }} /> },
};

const emptyForm: ClassroomDTO = { name: '', schoolId: 0, classLevelId: 0, shift: '', academicYear: '' };

const ClassroomsPage: React.FC = () => {
  const [classrooms, setClassrooms] = useState<ClassroomDTO[]>([]);
  const [schools, setSchools]       = useState<SchoolDTO[]>([]);
  const [levels, setLevels]         = useState<ClassLevelDTO[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<ClassroomDTO | null>(null);
  const [form, setForm]             = useState<ClassroomDTO>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch]         = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [shiftFilter, setShiftFilter]   = useState('');
  const [yearFilter, setYearFilter]     = useState('');

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const [cls, sch, lvl] = await Promise.all([classroomService.findAll(), schoolService.findAll(), classLevelService.findAll()]);
      setClassrooms(cls); setSchools(sch); setLevels(lvl);
    } catch { setError('Erro ao carregar dados. Verifique a ligação ao servidor.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const years = useMemo(() =>
    [...new Set(classrooms.map(c => c.academicYear).filter(Boolean))].sort().reverse(), [classrooms]);

  const filtered = useMemo(() => classrooms.filter(c => {
    const q = search.toLowerCase();
    const schName = schools.find(s => s.id === c.schoolId)?.name ?? '';
    const hit = !q || c.name.toLowerCase().includes(q) || schName.toLowerCase().includes(q);
    return hit
      && (!schoolFilter || String(c.schoolId) === schoolFilter)
      && (!shiftFilter || c.shift === shiftFilter)
      && (!yearFilter || c.academicYear === yearFilter);
  }), [classrooms, schools, search, schoolFilter, shiftFilter, yearFilter]);

  const openCreate  = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit    = (r: ClassroomDTO) => { setEditing(r); setForm({ ...r }); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyForm); };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.schoolId || !form.classLevelId || !form.shift || !form.academicYear.trim()) {
      setError('Preencha todos os campos obrigatórios.'); return;
    }
    try {
      setSubmitting(true); setError(null);
      editing?.id ? await classroomService.update({ ...form, id: editing.id }) : await classroomService.save(form);
      closeDialog(); await load();
    } catch { setError('Erro ao salvar turma.'); }
    finally { setSubmitting(false); }
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Desativar esta turma?')) return;
    try { setError(null); await classroomService.deactivate(id); await load(); }
    catch { setError('Erro ao desativar turma.'); }
  };

  const hasFilters = !!(search || schoolFilter || shiftFilter || yearFilter);
  const clearFilters = () => { setSearch(''); setSchoolFilter(''); setShiftFilter(''); setYearFilter(''); };

  const schoolName = (id: number) => schools.find(s => s.id === id)?.name ?? '—';
  const levelName  = (id: number) => levels.find(l => l.id === id)?.name ?? '—';

  return (
    <Box sx={{ minHeight: '100%', background: 'linear-gradient(160deg,#eef2ff 0%,#f8fafc 50%,#f0fdf4 100%)', p: 3, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,166,81,.07) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: -80, left: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(230,81,0,.05) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,#0A1628 0%,#1565c0 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, p: 2.5, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.2, borderRadius: 2, background: 'rgba(0,166,81,0.15)', border: '1px solid rgba(0,166,81,0.25)', display: 'flex' }}>
              <ClassroomIcon sx={{ color: '#4caf50', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" color="white" sx={{ lineHeight: 1.2 }}>Turmas</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.3 }}>Gestão de turmas académicas</Typography>
            </Box>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ ...gradBtn, px: 3 }}>
            Nova Turma
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, ...glass }} onClose={() => setError(null)}>{error}</Alert>}

        {/* ── Filters ── */}
        <Box sx={{ ...glass, borderRadius: 3, p: 2, mb: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <TextField
            size="small" placeholder="Pesquisar por nome da turma ou escola…"
            value={search} onChange={e => setSearch(e.target.value)}
            slotProps={{ input: {
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
              endAdornment: search ? (
                <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch('')}><CloseIcon sx={{ fontSize: 15 }} /></IconButton></InputAdornment>
              ) : null,
            } }}
            sx={{ flex: 1, minWidth: 220, ...inputSx }}
          />
          <FormControl size="small" sx={{ minWidth: 150, ...inputSx }}>
            <InputLabel>Escola</InputLabel>
            <Select value={schoolFilter} label="Escola" onChange={e => setSchoolFilter(e.target.value as string)}>
              <MenuItem value="">Todas</MenuItem>
              {schools.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120, ...inputSx }}>
            <InputLabel>Turno</InputLabel>
            <Select value={shiftFilter} label="Turno" onChange={e => setShiftFilter(e.target.value as string)}>
              <MenuItem value="">Todos</MenuItem>
              {SHIFTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120, ...inputSx }}>
            <InputLabel>Ano</InputLabel>
            <Select value={yearFilter} label="Ano" onChange={e => setYearFilter(e.target.value as string)}>
              <MenuItem value="">Todos</MenuItem>
              {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          {hasFilters && (
            <Button size="small" onClick={clearFilters} sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.8rem' }}>
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
              <ClassroomIcon sx={{ color: '#4caf50', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" color="white" sx={{ flex: 1 }}>Lista de Turmas</Typography>
            {!loading && (
              <Chip label={`${classrooms.length} registo${classrooms.length !== 1 ? 's' : ''}`} size="small"
                sx={{ bgcolor: 'rgba(0,166,81,0.15)', color: '#4caf50', border: '1px solid rgba(0,166,81,0.25)' }} />
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, background: 'rgba(255,255,255,0.5)' }}>
              <CircularProgress sx={{ color: ACCENT }} />
            </Box>
          ) : (
            <TableContainer sx={{ background: 'transparent' }}>
              <Table sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(0,0,0,0.025)' }}>
                    {['Nome', 'Escola', 'Nível', 'Turno', 'Ano Lectivo', 'Ações'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.7, py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ border: 'none', py: 0 }}>
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <ClassroomIcon sx={{ fontSize: 52, color: 'rgba(0,0,0,0.08)', mb: 1.5 }} />
                          <Typography color="text.secondary" fontWeight={500}>Nenhuma turma encontrada</Typography>
                          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                            {hasFilters ? 'Tente ajustar os filtros de pesquisa' : 'Crie a primeira turma clicando em "Nova Turma"'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(row => {
                    const s = shiftStyle[row.shift] ?? { bg: '#f1f5f9', color: '#475569', border: 'rgba(0,0,0,0.1)', icon: null };
                    return (
                      <TableRow key={row.id} sx={{ transition: 'background .15s', '&:hover': { background: 'rgba(0,166,81,0.035)' } }}>
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(21,101,192,0.1)', color: '#1565c0', fontSize: '0.72rem', fontWeight: 800 }}>
                              {row.name.slice(0, 2).toUpperCase()}
                            </Avatar>
                            <Typography fontWeight={600} color={PRIMARY} variant="body2">{row.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#475569' }}>
                          <Typography variant="body2">{schoolName(row.schoolId)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={levelName(row.classLevelId)} size="small"
                            sx={{ bgcolor: 'rgba(0,166,81,0.08)', color: ACCENT, border: '1px solid rgba(0,166,81,0.2)' }} />
                        </TableCell>
                        <TableCell>
                          <Chip icon={s.icon as React.ReactElement} label={row.shift || '—'} size="small"
                            sx={{ bgcolor: s.bg, color: s.color, border: `1px solid ${s.border}` }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={row.academicYear || '—'} size="small"
                            sx={{ bgcolor: 'rgba(0,0,0,0.04)', color: '#475569', fontWeight: 600, border: '1px solid rgba(0,0,0,0.08)' }} />
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
              <ClassroomIcon sx={{ color: '#4caf50' }} />
              <Typography variant="h6" color="white">{editing ? 'Editar Turma' : 'Nova Turma'}</Typography>
            </Box>
            <IconButton onClick={closeDialog} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField label="Nome da Turma *" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Ex: Turma A — 10ª Classe" fullWidth size="small" sx={inputSx} />

          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Escola *</InputLabel>
            <Select value={form.schoolId || ''} label="Escola *"
              onChange={e => setForm(p => ({ ...p, schoolId: Number(e.target.value) }))}>
              {schools.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Nível *</InputLabel>
              <Select value={form.classLevelId || ''} label="Nível *"
                onChange={e => setForm(p => ({ ...p, classLevelId: Number(e.target.value) }))}>
                {levels.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={inputSx}>
              <InputLabel>Turno *</InputLabel>
              <Select value={form.shift} label="Turno *"
                onChange={e => setForm(p => ({ ...p, shift: e.target.value }))}>
                {SHIFTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          <TextField label="Ano Lectivo *" value={form.academicYear}
            onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))}
            placeholder="Ex: 2026" fullWidth size="small" sx={inputSx} />
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

export default ClassroomsPage;
