import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, TextField, Alert, CircularProgress, Tooltip,
  Avatar, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Autocomplete, Divider,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Block as BlockIcon,
  MeetingRoom as ClassroomIcon, Search as SearchIcon, Close as CloseIcon,
  FilterList as FilterIcon, WbSunny as MorningIcon,
  WbTwilight as AfternoonIcon, NightsStay as NightIcon,
  People as PeopleIcon, PersonRemove as PersonRemoveIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import {
  classroomService, schoolService, classLevelService, studentService,
  professorService, professorAssignmentService,
  type ClassroomDTO, type SchoolDTO, type ClassLevelDTO, type StudentProfileDTO, type ProfessorDTO,
} from '../../../services/academicService';
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

const SHIFTS = ['Manhã', 'Tarde', 'Noite'];

const shiftStyle: Record<string, { bg: string; color: string; border: string; icon: React.ReactNode }> = {
  'Manhã': { bg: 'rgba(21,101,192,0.08)', color: '#00A651', border: 'rgba(21,101,192,0.2)', icon: <MorningIcon sx={{ fontSize: '14px !important' }} /> },
  'Tarde': { bg: 'rgba(230,81,0,0.08)', color: '#e65100', border: 'rgba(230,81,0,0.2)', icon: <AfternoonIcon sx={{ fontSize: '14px !important' }} /> },
  'Noite': { bg: 'rgba(81,45,168,0.08)', color: '#512da8', border: 'rgba(81,45,168,0.2)', icon: <NightIcon sx={{ fontSize: '14px !important' }} /> },
};

const emptyForm: ClassroomDTO = { name: '', schoolId: 0, classLevelId: 0, shift: '', academicYear: '' };

const ClassroomsPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const isSchoolAdmin = authUser?.role === 'Administrador de Escola';
  const [schoolAdminSchoolId, setSchoolAdminSchoolId] = useState<number | null>(null);

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
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [enrollOpen, setEnrollOpen]             = useState(false);
  const [enrollClassroom, setEnrollClassroom]   = useState<ClassroomDTO | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<StudentProfileDTO[]>([]);
  const [schoolStudents, setSchoolStudents]     = useState<StudentProfileDTO[]>([]);
  const [enrollLoading, setEnrollLoading]       = useState(false);
  const [selectedStudent, setSelectedStudent]   = useState<StudentProfileDTO | null>(null);
  const [enrollError, setEnrollError]           = useState<string | null>(null);
  const [enrollSaving, setEnrollSaving]         = useState(false);

  const [professors, setProfessors]                   = useState<ProfessorDTO[]>([]);
  const [directorOpen, setDirectorOpen]               = useState(false);
  const [directorClassroom, setDirectorClassroom]     = useState<ClassroomDTO | null>(null);
  const [classroomProfessors, setClassroomProfessors] = useState<ProfessorDTO[]>([]);
  const [directorLoading, setDirectorLoading]         = useState(false);
  const [directorError, setDirectorError]             = useState<string | null>(null);
  const [directorSaving, setDirectorSaving]           = useState(false);

  // Reload after save/deactivate — schoolAdminSchoolId is already set in state by then
  const load = async () => {
    try {
      setLoading(true); setError(null);
      const cls = (isSchoolAdmin && schoolAdminSchoolId)
        ? await classroomService.findBySchool(schoolAdminSchoolId)
        : await classroomService.findAll();
      const [sch, lvl, profs] = await Promise.all([schoolService.findAll(), classLevelService.findAll(), professorService.findAll()]);
      setClassrooms(cls); setSchools(sch); setLevels(lvl); setProfessors(profs);
    } catch { setError('Erro ao carregar dados. Verifique a ligação ao servidor.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true); setError(null);
        const [sch, lvl, profs] = await Promise.all([schoolService.findAll(), classLevelService.findAll(), professorService.findAll()]);
        setSchools(sch); setLevels(lvl); setProfessors(profs);
        if (isSchoolAdmin) {
          const profileRes = await api.get<{ schoolId: number }>('/auth/users/school-admin-profile');
          const sid = profileRes.data.schoolId;
          setSchoolAdminSchoolId(sid);
          const cls = await classroomService.findBySchool(sid);
          setClassrooms(cls);
        } else {
          const cls = await classroomService.findAll();
          setClassrooms(cls);
        }
      } catch { setError('Erro ao carregar dados. Verifique a ligação ao servidor.'); }
      finally { setLoading(false); }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => { setPage(0); }, [search, schoolFilter, shiftFilter, yearFilter]);

  const openCreate  = () => {
    setEditing(null);
    setForm({ ...emptyForm, schoolId: isSchoolAdmin && schoolAdminSchoolId ? schoolAdminSchoolId : 0 });
    setDialogOpen(true);
  };
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

  const openEnroll = async (classroom: ClassroomDTO) => {
    setEnrollClassroom(classroom);
    setEnrollOpen(true);
    setEnrollError(null);
    setSelectedStudent(null);
    setEnrollLoading(true);
    try {
      const [enrolled, all] = await Promise.all([
        studentService.findByClassroom(classroom.id!),
        studentService.findBySchool(classroom.schoolId),
      ]);
      setEnrolledStudents(enrolled);
      setSchoolStudents(all);
    } catch {
      setEnrollError('Erro ao carregar alunos');
    } finally {
      setEnrollLoading(false);
    }
  };

  const closeEnroll = () => {
    setEnrollOpen(false);
    setEnrollClassroom(null);
    setSelectedStudent(null);
  };

  const handleAssign = async () => {
    if (!selectedStudent || !enrollClassroom) return;
    try {
      setEnrollSaving(true);
      setEnrollError(null);
      await studentService.assignToClassroom(selectedStudent.userId, enrollClassroom.id!);
      const [enrolled, all] = await Promise.all([
        studentService.findByClassroom(enrollClassroom.id!),
        studentService.findBySchool(enrollClassroom.schoolId),
      ]);
      setEnrolledStudents(enrolled);
      setSchoolStudents(all);
      setSelectedStudent(null);
    } catch {
      setEnrollError('Erro ao matricular aluno');
    } finally {
      setEnrollSaving(false);
    }
  };

  const handleRemoveStudent = async (student: StudentProfileDTO) => {
    if (!enrollClassroom) return;
    if (!window.confirm(`Remover ${student.fullName} desta turma?`)) return;
    try {
      setEnrollSaving(true);
      setEnrollError(null);
      await studentService.assignToClassroom(student.userId, null);
      setEnrolledStudents(prev => prev.filter(s => s.userId !== student.userId));
    } catch {
      setEnrollError('Erro ao remover aluno');
    } finally {
      setEnrollSaving(false);
    }
  };

  const openDirector = async (classroom: ClassroomDTO) => {
    setDirectorClassroom(classroom);
    setDirectorOpen(true);
    setDirectorError(null);
    setDirectorLoading(true);
    try {
      const assignments = await professorAssignmentService.findByClassroom(classroom.id!);
      const assignedIds = new Set(assignments.map(a => a.professorId));
      setClassroomProfessors(professors.filter(p => assignedIds.has(p.id)));
    } catch {
      setDirectorError('Erro ao carregar professores da turma');
    } finally {
      setDirectorLoading(false);
    }
  };

  const closeDirector = () => { setDirectorOpen(false); setDirectorClassroom(null); };

  const handleSetDirector = async (professorId: number | null) => {
    if (!directorClassroom) return;
    try {
      setDirectorSaving(true);
      setDirectorError(null);
      const updated = await classroomService.setDirector(directorClassroom.id!, professorId);
      setClassrooms(prev => prev.map(c => c.id === updated.id ? updated : c));
      setDirectorClassroom(updated);
    } catch {
      setDirectorError('Erro ao definir director de turma');
    } finally {
      setDirectorSaving(false);
    }
  };

  const directorName = (id?: number | null) =>
    id ? (professors.find(p => p.id === id)?.fullName ?? `Prof. #${id}`) : null;

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,#0A1628 0%,#00A651 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, p: 2.5, mb: 3 }}>
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
          {!isSchoolAdmin && (
            <FormControl size="small" sx={{ minWidth: 150, ...inputSx }}>
              <InputLabel>Escola</InputLabel>
              <Select value={schoolFilter} label="Escola" onChange={e => setSchoolFilter(e.target.value as string)}>
                <MenuItem value="">Todas</MenuItem>
                {schools.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
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
          <Box sx={{ px: 3, py: 2, background: 'rgba(248,250,252,0.8)', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 0.8, borderRadius: 1.5, background: 'rgba(0,166,81,0.1)', border: '1px solid rgba(0,166,81,0.2)', display: 'flex' }}>
              <ClassroomIcon sx={{ color: ACCENT, fontSize: 20 }} />
            </Box>
            <Typography variant="h6" color={PRIMARY} sx={{ flex: 1 }}>Lista de Turmas</Typography>
            {!loading && (
              <Chip label={`${classrooms.length} registo${classrooms.length !== 1 ? 's' : ''}`} size="small"
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
                  ) : filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(row => {
                    const s = shiftStyle[row.shift] ?? { bg: '#f1f5f9', color: '#475569', border: 'rgba(0,0,0,0.1)', icon: null };
                    return (
                      <TableRow key={row.id} sx={{ transition: 'background .15s', '&:hover': { background: 'rgba(0,166,81,0.035)' } }}>
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(21,101,192,0.1)', color: '#00A651', fontSize: '0.72rem', fontWeight: 800 }}>
                              {row.name.slice(0, 2).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography fontWeight={600} color={PRIMARY} variant="body2">{row.name}</Typography>
                              {directorName(row.directorId) && (
                                <Typography variant="caption" sx={{ color: ACCENT, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                  <StarIcon sx={{ fontSize: 11 }} />{directorName(row.directorId)}
                                </Typography>
                              )}
                            </Box>
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
                          <Tooltip title="Alunos" placement="top">
                            <IconButton size="small" onClick={() => openEnroll(row)}
                              sx={{ color: ACCENT, mr: 0.5, '&:hover': { bgcolor: 'rgba(0,166,81,0.08)' } }}>
                              <PeopleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Director de Turma" placement="top">
                            <IconButton size="small" onClick={() => openDirector(row)}
                              sx={{ color: row.directorId ? '#f59e0b' : '#94a3b8', mr: 0.5, '&:hover': { bgcolor: 'rgba(245,158,11,0.08)' } }}>
                              <StarIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

          <FormControl fullWidth size="small" sx={inputSx} disabled={isSchoolAdmin}>
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

      {/* ── Enrollment Dialog ── */}
      <Dialog open={enrollOpen} onClose={closeEnroll} maxWidth="sm" fullWidth
        slotProps={{
          backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } },
          paper: { sx: { ...glass, background: 'rgba(255,255,255,0.97)', borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' } },
        }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg,#0A1628 0%,#00A651 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PeopleIcon sx={{ color: 'rgba(255,255,255,0.9)' }} />
              <Box>
                <Typography variant="h6" color="white">Alunos</Typography>
                {enrollClassroom && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{enrollClassroom.name}</Typography>
                )}
              </Box>
            </Box>
            <IconButton onClick={closeEnroll} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {enrollError && (
            <Alert severity="error" sx={{ m: 2, borderRadius: 2 }} onClose={() => setEnrollError(null)}>{enrollError}</Alert>
          )}
          {enrollLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: ACCENT }} />
            </Box>
          ) : (
            <>
              <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary"
                  sx={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1, mb: 1.5 }}>
                  Matricular Novo Aluno
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={schoolStudents.filter(s => s.classroomId !== enrollClassroom?.id)}
                    getOptionLabel={s => `${s.fullName} (${s.username})`}
                    value={selectedStudent}
                    onChange={(_, val) => setSelectedStudent(val)}
                    renderInput={params => (
                      <TextField {...params} placeholder="Pesquisar aluno da escola…" sx={inputSx} />
                    )}
                    noOptionsText="Nenhum aluno disponível"
                    isOptionEqualToValue={(a, b) => a.userId === b.userId}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAssign}
                    disabled={!selectedStudent || enrollSaving}
                    sx={{ ...gradBtn, px: 2.5, whiteSpace: 'nowrap', minWidth: 110 }}
                  >
                    {enrollSaving ? <CircularProgress size={16} color="inherit" /> : 'Matricular'}
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ mt: 2 }} />

              <Box sx={{ px: 3, pt: 2, pb: 0.5 }}>
                <Typography variant="subtitle2" color="text.secondary"
                  sx={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
                  Alunos Matriculados ({enrolledStudents.length})
                </Typography>
              </Box>

              {enrolledStudents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5, px: 3 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: 'rgba(0,0,0,0.1)', mb: 1 }} />
                  <Typography color="text.secondary" variant="body2">
                    Nenhum aluno matriculado nesta turma.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ px: 2, pb: 2, pt: 1, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {enrolledStudents.map(s => (
                    <Box key={s.userId} sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      p: 1.5, borderRadius: 2,
                      bgcolor: 'rgba(0,166,81,0.04)',
                      border: '1px solid rgba(0,166,81,0.12)',
                    }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(0,166,81,0.15)', color: ACCENT, fontSize: '0.7rem', fontWeight: 800 }}>
                        {s.fullName?.slice(0, 2).toUpperCase() ?? '??'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} color={PRIMARY} noWrap>{s.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.username}</Typography>
                      </Box>
                      <Tooltip title="Remover da turma">
                        <IconButton size="small" onClick={() => handleRemoveStudent(s)}
                          sx={{ color: '#ef5350', '&:hover': { bgcolor: 'rgba(239,83,80,0.08)' } }}>
                          <PersonRemoveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Director Dialog ── */}
      <Dialog open={directorOpen} onClose={closeDirector} maxWidth="xs" fullWidth
        slotProps={{
          backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } },
          paper: { sx: { ...glass, background: 'rgba(255,255,255,0.97)', borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden' } },
        }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg,#0A1628 0%,#f59e0b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <StarIcon sx={{ color: 'rgba(255,255,255,0.9)' }} />
              <Box>
                <Typography variant="h6" color="white">Director de Turma</Typography>
                {directorClassroom && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{directorClassroom.name}</Typography>
                )}
              </Box>
            </Box>
            <IconButton onClick={closeDirector} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {directorError && (
            <Alert severity="error" sx={{ m: 2, borderRadius: 2 }} onClose={() => setDirectorError(null)}>{directorError}</Alert>
          )}
          {directorLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#f59e0b' }} />
            </Box>
          ) : (
            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" color="text.secondary"
                sx={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1, mb: 0.5 }}>
                Professores desta turma
              </Typography>
              {classroomProfessors.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <StarIcon sx={{ fontSize: 36, color: 'rgba(0,0,0,0.1)', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Nenhum professor atribuído a esta turma ainda.</Typography>
                </Box>
              ) : (
                classroomProfessors.map(prof => {
                  const isDirector = directorClassroom?.directorId === prof.id;
                  return (
                    <Box key={prof.id} sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2,
                      bgcolor: isDirector ? 'rgba(245,158,11,0.08)' : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${isDirector ? 'rgba(245,158,11,0.3)' : 'rgba(0,0,0,0.07)'}`,
                      cursor: 'pointer', transition: 'all .15s',
                      '&:hover': { bgcolor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.25)' },
                    }}
                      onClick={() => !directorSaving && handleSetDirector(isDirector ? null : prof.id)}
                    >
                      <Avatar sx={{ width: 34, height: 34, bgcolor: isDirector ? 'rgba(245,158,11,0.2)' : 'rgba(0,0,0,0.06)', color: isDirector ? '#d97706' : '#64748b', fontSize: '0.7rem', fontWeight: 800 }}>
                        {(prof.fullName ?? prof.username).slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} color={PRIMARY} noWrap>{prof.fullName ?? prof.username}</Typography>
                        <Typography variant="caption" color="text.secondary">{prof.username}</Typography>
                      </Box>
                      {isDirector && (
                        <Chip label="Director" size="small"
                          sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#d97706', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700, fontSize: '0.65rem' }} />
                      )}
                      {directorSaving && <CircularProgress size={16} sx={{ color: '#f59e0b' }} />}
                    </Box>
                  );
                })
              )}
              {directorClassroom?.directorId && (
                <Button size="small" onClick={() => handleSetDirector(null)} disabled={directorSaving}
                  sx={{ mt: 1, color: '#ef5350', textTransform: 'none', fontSize: '0.78rem', alignSelf: 'flex-end' }}>
                  Remover director
                </Button>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ClassroomsPage;
