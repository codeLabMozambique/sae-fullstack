import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, TextField, Alert, CircularProgress, Tooltip,
  Avatar, InputAdornment, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  Add as AddIcon, Block as BlockIcon, AssignmentInd as AssignIcon,
  Search as SearchIcon, Close as CloseIcon, FilterList as FilterIcon,
  Person as PersonIcon, MenuBook as SubjectIcon,
} from '@mui/icons-material';
import {
  professorAssignmentService, professorService, classroomService, subjectService,
  type ProfessorAssignmentDTO, type ProfessorDTO, type ClassroomDTO, type SubjectDTO,
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

const emptyForm: ProfessorAssignmentDTO = { professorId: 0, classroomId: 0, subjectId: 0 };

function initials(name?: string, username?: string): string {
  const src = name || username || '?';
  return src.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

/* deterministic colour per professor id */
const avatarColor = (id: number) => {
  const palette = ['#1565c0', '#7b1fa2', '#00838f', '#e65100', '#2e7d32', '#4527a0'];
  return palette[id % palette.length];
};

const ProfessorAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<ProfessorAssignmentDTO[]>([]);
  const [professors, setProfessors]   = useState<ProfessorDTO[]>([]);
  const [classrooms, setClassrooms]   = useState<ClassroomDTO[]>([]);
  const [subjects, setSubjects]       = useState<SubjectDTO[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [form, setForm]               = useState<ProfessorAssignmentDTO>(emptyForm);
  const [submitting, setSubmitting]   = useState(false);
  const [search, setSearch]           = useState('');
  const [classroomFilter, setClassroomFilter] = useState('');
  const [subjectFilter, setSubjectFilter]     = useState('');

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const [asgn, profs, cls, subj] = await Promise.all([
        professorAssignmentService.findAll(), professorService.findAll(),
        classroomService.findAll(), subjectService.findAll(),
      ]);
      setAssignments(asgn); setProfessors(profs); setClassrooms(cls); setSubjects(subj);
    } catch { setError('Erro ao carregar dados. Verifique a ligação ao servidor.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => assignments.filter(a => {
    const prof = professors.find(p => p.id === a.professorId);
    const name = prof ? (prof.fullName || prof.username || '') : '';
    const hit = !search || name.toLowerCase().includes(search.toLowerCase());
    return hit
      && (!classroomFilter || String(a.classroomId) === classroomFilter)
      && (!subjectFilter || String(a.subjectId) === subjectFilter);
  }), [assignments, professors, search, classroomFilter, subjectFilter]);

  const openCreate  = () => { setForm(emptyForm); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setForm(emptyForm); };

  const handleSubmit = async () => {
    if (!form.professorId || !form.classroomId || !form.subjectId) {
      setError('Seleccione professor, turma e disciplina.'); return;
    }
    try {
      setSubmitting(true); setError(null);
      await professorAssignmentService.save(form);
      closeDialog(); await load();
    } catch { setError('Erro ao criar atribuição. Verifique se já não existe uma igual.'); }
    finally { setSubmitting(false); }
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Remover esta atribuição?')) return;
    try { setError(null); await professorAssignmentService.deactivate(id); await load(); }
    catch { setError('Erro ao remover atribuição.'); }
  };

  const profName  = (id: number) => { const p = professors.find(p => p.id === id); return p ? (p.fullName || p.username) : `ID ${id}`; };
  const clsName   = (id: number) => classrooms.find(c => c.id === id)?.name ?? `ID ${id}`;
  const subjName  = (id: number) => subjects.find(s => s.id === id)?.name ?? `ID ${id}`;
  const hasFilters = !!(search || classroomFilter || subjectFilter);

  return (
    <Box sx={{ minHeight: '100%', background: 'linear-gradient(160deg,#eef2ff 0%,#f8fafc 50%,#f0fdf4 100%)', p: 3, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,166,81,.07) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: -80, left: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(21,101,192,.06) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,#0A1628 0%,#1565c0 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, p: 2.5, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.2, borderRadius: 2, background: 'rgba(0,166,81,0.15)', border: '1px solid rgba(0,166,81,0.25)', display: 'flex' }}>
              <AssignIcon sx={{ color: '#4caf50', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" color="white" sx={{ lineHeight: 1.2 }}>Atribuições de Professores</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.3 }}>Associação de professores a turmas e disciplinas</Typography>
            </Box>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ ...gradBtn, px: 3 }}>
            Nova Atribuição
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, ...glass }} onClose={() => setError(null)}>{error}</Alert>}

        {/* ── Filters ── */}
        <Box sx={{ ...glass, borderRadius: 3, p: 2, mb: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <TextField
            size="small" placeholder="Pesquisar por nome do professor…"
            value={search} onChange={e => setSearch(e.target.value)}
            slotProps={{ input: {
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
              endAdornment: search ? (
                <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch('')}><CloseIcon sx={{ fontSize: 15 }} /></IconButton></InputAdornment>
              ) : null,
            } }}
            sx={{ flex: 1, minWidth: 220, ...inputSx }}
          />
          <FormControl size="small" sx={{ minWidth: 170, ...inputSx }}>
            <InputLabel>Turma</InputLabel>
            <Select value={classroomFilter} label="Turma" onChange={e => setClassroomFilter(e.target.value as string)}>
              <MenuItem value="">Todas as turmas</MenuItem>
              {classrooms.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 170, ...inputSx }}>
            <InputLabel>Disciplina</InputLabel>
            <Select value={subjectFilter} label="Disciplina" onChange={e => setSubjectFilter(e.target.value as string)}>
              <MenuItem value="">Todas</MenuItem>
              {subjects.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
          {hasFilters && (
            <Button size="small" onClick={() => { setSearch(''); setClassroomFilter(''); setSubjectFilter(''); }}
              sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.8rem' }}>
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
              <AssignIcon sx={{ color: '#4caf50', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" color="white" sx={{ flex: 1 }}>Lista de Atribuições</Typography>
            {!loading && (
              <Chip label={`${assignments.length} registo${assignments.length !== 1 ? 's' : ''}`} size="small"
                sx={{ bgcolor: 'rgba(0,166,81,0.15)', color: '#4caf50', border: '1px solid rgba(0,166,81,0.25)' }} />
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, background: 'rgba(255,255,255,0.5)' }}>
              <CircularProgress sx={{ color: ACCENT }} />
            </Box>
          ) : (
            <TableContainer sx={{ background: 'transparent' }}>
              <Table sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(0,0,0,0.025)' }}>
                    {['Professor', 'Turma', 'Disciplina', 'Ações'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.7, py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ border: 'none', py: 0 }}>
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <AssignIcon sx={{ fontSize: 52, color: 'rgba(0,0,0,0.08)', mb: 1.5 }} />
                          <Typography color="text.secondary" fontWeight={500}>Nenhuma atribuição encontrada</Typography>
                          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                            {hasFilters ? 'Tente ajustar os filtros de pesquisa' : 'Crie a primeira atribuição clicando em "Nova Atribuição"'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(row => {
                    const prof = professors.find(p => p.id === row.professorId);
                    const bgColor = avatarColor(row.professorId);
                    return (
                      <TableRow key={row.id} sx={{ transition: 'background .15s', '&:hover': { background: 'rgba(0,166,81,0.035)' } }}>
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: bgColor, fontSize: '0.72rem', fontWeight: 800, boxShadow: `0 2px 8px ${bgColor}44` }}>
                              {initials(prof?.fullName, prof?.username)}
                            </Avatar>
                            <Box>
                              <Typography fontWeight={600} color={PRIMARY} variant="body2">{profName(row.professorId)}</Typography>
                              {prof?.department && (
                                <Typography variant="caption" color="text.disabled">{prof.department}</Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={clsName(row.classroomId)} size="small"
                            sx={{ bgcolor: 'rgba(81,45,168,0.08)', color: '#512da8', border: '1px solid rgba(81,45,168,0.2)' }} />
                        </TableCell>
                        <TableCell>
                          <Chip icon={<SubjectIcon sx={{ fontSize: '14px !important', color: `${ACCENT} !important` }} />}
                            label={subjName(row.subjectId)} size="small"
                            sx={{ bgcolor: 'rgba(0,166,81,0.08)', color: ACCENT, border: '1px solid rgba(0,166,81,0.2)' }} />
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <Tooltip title="Remover atribuição" placement="top">
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
              <AssignIcon sx={{ color: '#4caf50' }} />
              <Typography variant="h6" color="white">Nova Atribuição</Typography>
            </Box>
            <IconButton onClick={closeDialog} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Professor select with avatar preview */}
          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Professor *</InputLabel>
            <Select value={form.professorId || ''} label="Professor *"
              onChange={e => setForm(p => ({ ...p, professorId: Number(e.target.value) }))}>
              {professors.length === 0
                ? <MenuItem disabled value="">Nenhum professor disponível</MenuItem>
                : professors.map(p => (
                  <MenuItem key={p.id} value={p.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 26, height: 26, bgcolor: avatarColor(p.id), fontSize: '0.62rem', fontWeight: 800 }}>
                        {initials(p.fullName, p.username)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{p.fullName || p.username}</Typography>
                        {p.department && <Typography variant="caption" color="text.secondary">{p.department}</Typography>}
                      </Box>
                    </Box>
                  </MenuItem>
                ))
              }
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Turma *</InputLabel>
            <Select value={form.classroomId || ''} label="Turma *"
              onChange={e => setForm(p => ({ ...p, classroomId: Number(e.target.value) }))}>
              {classrooms.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={inputSx}>
            <InputLabel>Disciplina *</InputLabel>
            <Select value={form.subjectId || ''} label="Disciplina *"
              onChange={e => setForm(p => ({ ...p, subjectId: Number(e.target.value) }))}>
              {subjects.map(s => (
                <MenuItem key={s.id} value={s.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {s.code && <Chip label={s.code} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(0,166,81,0.1)', color: ACCENT }} />}
                    <Typography variant="body2">{s.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Summary preview */}
          {form.professorId > 0 && form.classroomId > 0 && form.subjectId > 0 && (
            <Box sx={{ p: 2, borderRadius: 2, background: 'linear-gradient(135deg,rgba(0,166,81,0.06) 0%,rgba(21,101,192,0.06) 100%)', border: '1px solid rgba(0,166,81,0.15)' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Resumo da atribuição
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip icon={<PersonIcon sx={{ fontSize: '14px !important' }} />} label={profName(form.professorId)} size="small"
                  sx={{ bgcolor: 'rgba(21,101,192,0.1)', color: '#1565c0' }} />
                <Typography variant="caption" color="text.disabled">→</Typography>
                <Chip label={clsName(form.classroomId)} size="small" sx={{ bgcolor: 'rgba(81,45,168,0.1)', color: '#512da8' }} />
                <Typography variant="caption" color="text.disabled">→</Typography>
                <Chip label={subjName(form.subjectId)} size="small" sx={{ bgcolor: 'rgba(0,166,81,0.1)', color: ACCENT }} />
              </Box>
            </Box>
          )}
        </DialogContent>

        <Box sx={{ px: 3, pb: 3, pt: 1.5, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={closeDialog} sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 500, borderRadius: '10px', px: 2.5, border: '1px solid rgba(0,0,0,0.1)', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', transform: 'none' } }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ ...gradBtn, px: 3, minWidth: 110 }}>
            {submitting ? <CircularProgress size={18} color="inherit" /> : 'Atribuir'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ProfessorAssignmentsPage;
