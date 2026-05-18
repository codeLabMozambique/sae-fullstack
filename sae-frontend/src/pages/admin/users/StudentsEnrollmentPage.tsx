import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip, Button, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, CircularProgress, Alert, Tooltip, InputAdornment, Avatar, MenuItem,
  Select, FormControl, InputLabel, Tabs, Tab,
} from '@mui/material';
import {
  Search as SearchIcon, Close as CloseIcon, School as SchoolIcon,
  HowToReg as EnrollIcon, SwapHoriz as ChangeIcon, PersonOff as UnenrollIcon,
} from '@mui/icons-material';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import {
  studentService, schoolService, classroomService,
  type StudentProfileDTO, type SchoolDTO, type ClassroomDTO,
} from '../../../services/academicService';

const ACCENT  = '#00A651';
const PRIMARY = '#0A1628';

const glass = {
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.88)',
  boxShadow: '0 8px 32px rgba(31,38,135,0.08)',
} as const;

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: 'rgba(248,250,252,0.8)',
    '&:hover fieldset': { borderColor: ACCENT },
    '&.Mui-focused fieldset': { borderColor: ACCENT, borderWidth: 2 },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: ACCENT },
} as const;

const avatarColors = ['#1565c0','#7b1fa2','#00A651','#e65100','#00838f','#c62828'];
const avatarColor  = (id: number) => avatarColors[id % avatarColors.length];
const initials     = (name?: string) =>
  name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';

interface EnrollForm {
  userId: number;
  schoolId: string;
  classroomId: string;
  grade: string;
  age: string;
  studentName: string;
}

const StudentsEnrollmentPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const isSchoolAdmin = authUser?.role === 'Administrador de Escola' || authUser?.role === 'SCHOOL_ADMIN';

  const [students,   setStudents]   = useState<StudentProfileDTO[]>([]);
  const [schools,    setSchools]    = useState<SchoolDTO[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomDTO[]>([]);
  const [mySchoolId, setMySchoolId] = useState<number | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState('');
  const [tab,        setTab]        = useState(0); // 0=Matriculados, 1=Por Matricular
  const [schoolFilter, setSchoolFilter] = useState('');
  const [page,       setPage]       = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState<EnrollForm>({ userId: 0, schoolId: '', classroomId: '', grade: '', age: '', studentName: '' });
  const [saving,     setSaving]     = useState(false);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const [studs, schs, cls] = await Promise.all([
        studentService.findAll(),
        schoolService.findAll(),
        classroomService.findAll(),
      ]);
      setStudents(studs);
      setSchools(schs);
      setClassrooms(cls);
    } catch { setError('Erro ao carregar estudantes.'); }
    finally   { setLoading(false); }
  };

  useEffect(() => {
    load();
    if (isSchoolAdmin) {
      api.get<{ schoolId: number }>('/auth/users/school-admin-profile')
        .then(r => { setMySchoolId(r.data.schoolId); setSchoolFilter(String(r.data.schoolId)); })
        .catch(() => {});
    }
  }, []);

  useEffect(() => { setPage(0); }, [search, tab, schoolFilter]);

  const enrolled    = useMemo(() => students.filter(s => s.classroomId != null), [students]);
  const notEnrolled = useMemo(() => students.filter(s => s.classroomId == null), [students]);

  const filtered = useMemo(() => {
    const source = tab === 0 ? enrolled : notEnrolled;
    return source.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || s.fullName?.toLowerCase().includes(q)
        || s.username?.toLowerCase().includes(q)
        || s.email?.toLowerCase().includes(q);
      const matchSchool = !schoolFilter || String(s.schoolId) === schoolFilter;
      return matchSearch && matchSchool;
    });
  }, [tab, enrolled, notEnrolled, search, schoolFilter]);

  const schoolName   = (id?: number | null) => schools.find(s => s.id === id)?.name ?? '—';
  const classroomName = (id?: number | null) => classrooms.find(c => c.id === id)?.name ?? '—';

  const classroomsForSchool = useMemo(() =>
    enrollForm.schoolId ? classrooms.filter(c => c.schoolId === Number(enrollForm.schoolId)) : classrooms,
    [classrooms, enrollForm.schoolId]);

  const openEnroll = (s: StudentProfileDTO) => {
    const sid = isSchoolAdmin && mySchoolId ? String(mySchoolId) : String(s.schoolId ?? '');
    setEnrollForm({
      userId: s.userId,
      schoolId: sid,
      classroomId: String(s.classroomId ?? ''),
      grade: s.grade ?? '',
      age: String(s.age ?? ''),
      studentName: s.fullName,
    });
    setEnrollOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true); setError(null);
      await api.put('/auth/users/student-profile', {
        userId: enrollForm.userId,
        schoolId: enrollForm.schoolId ? Number(enrollForm.schoolId) : null,
        classroomId: enrollForm.classroomId ? Number(enrollForm.classroomId) : null,
        grade: enrollForm.grade || null,
        age: enrollForm.age ? Number(enrollForm.age) : null,
      });
      setEnrollOpen(false); await load();
    } catch { setError('Erro ao guardar matrícula.'); }
    finally   { setSaving(false); }
  };

  const handleRemove = async (s: StudentProfileDTO) => {
    try {
      await api.put('/auth/users/student-profile', {
        userId: s.userId, schoolId: s.schoolId,
        classroomId: null, grade: s.grade, age: s.age,
      });
      await load();
    } catch { setError('Erro ao remover da turma.'); }
  };

  return (
    <Box sx={{ minHeight: '100%', background: 'linear-gradient(160deg,#f0fdf4 0%,#f8fafc 50%,#eff6ff 100%)', p: 3 }}>

      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg,#0A1628 0%,#00A651 100%)', borderRadius: 3, p: 2.5, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 1.2, borderRadius: 2, background: 'rgba(0,166,81,0.2)', border: '1px solid rgba(0,166,81,0.3)', display: 'flex' }}>
            <EnrollIcon sx={{ color: '#6ee7b7', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" color="white" fontWeight={700}>Matrícula de Estudantes</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.3 }}>
              {isSchoolAdmin ? 'Estudantes da sua escola' : 'Todos os estudantes do sistema'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`${enrolled.length} matriculados`} size="small"
            sx={{ bgcolor: 'rgba(0,166,81,0.2)', color: '#6ee7b7', border: '1px solid rgba(0,166,81,0.3)' }} />
          <Chip label={`${notEnrolled.length} por matricular`} size="small"
            sx={{ bgcolor: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }} />
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Filters */}
      <Box sx={{ ...glass, borderRadius: 3, p: 2, mb: 2.5, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size="small" placeholder="Pesquisar por nome, telefone ou email…"
          value={search} onChange={e => setSearch(e.target.value)}
          slotProps={{ input: {
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
            endAdornment: search ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch('')}><CloseIcon sx={{ fontSize: 15 }} /></IconButton></InputAdornment> : null,
          }}}
          sx={{ flex: 1, minWidth: 220, maxWidth: 380, ...inputSx }}
        />
        {!isSchoolAdmin && (
          <FormControl size="small" sx={{ minWidth: 180, ...inputSx }}>
            <InputLabel>Escola</InputLabel>
            <Select label="Escola" value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)}>
              <MenuItem value="">Todas as escolas</MenuItem>
              {schools.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
        )}
        <Chip label={`${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`} size="small"
          sx={{ bgcolor: 'rgba(0,166,81,0.1)', color: ACCENT, ml: 'auto', border: '1px solid rgba(0,166,81,0.2)' }} />
      </Box>

      {/* Tabs + Table */}
      <Box sx={{ ...glass, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{
            px: 2, borderBottom: '1px solid rgba(0,0,0,0.08)',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: ACCENT },
            '& .MuiTabs-indicator': { bgcolor: ACCENT },
          }}>
          <Tab label={`Matriculados (${enrolled.length})`} />
          <Tab label={`Por Matricular (${notEnrolled.length})`} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: ACCENT }} />
          </Box>
        ) : (
          <>
          <TableContainer>
            <Table sx={{ minWidth: tab === 0 ? 980 : 700 }}>
              <TableHead>
                <TableRow sx={{ background: 'rgba(0,0,0,0.025)' }}>
                  {(tab === 0
                    ? ['Cód. Matrícula', 'Estudante', 'Telefone', 'Email', 'Escola', 'Turma', 'Nível', 'Idade', 'Ações']
                    : ['Estudante', 'Telefone', 'Email', 'Escola', 'Idade', 'Ações']
                  ).map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.7, py: 1.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tab === 0 ? 9 : 6} sx={{ border: 'none', textAlign: 'center', py: 8 }}>
                      <SchoolIcon sx={{ fontSize: 48, color: 'rgba(0,0,0,0.08)', mb: 1 }} />
                      <Typography color="text.secondary">
                        {tab === 0 ? 'Nenhum estudante matriculado' : 'Todos os estudantes estão matriculados'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(s => (
                  <TableRow key={s.userId} sx={{ '&:hover': { background: 'rgba(0,166,81,0.03)' } }}>
                    {tab === 0 && (
                      <TableCell>
                        {s.enrollmentCode ? (
                          <Chip label={s.enrollmentCode} size="small"
                            sx={{ bgcolor: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)', fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700 }} />
                        ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                      </TableCell>
                    )}
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: avatarColor(s.userId), fontSize: '0.75rem', fontWeight: 700 }}>
                          {initials(s.fullName)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600} color={PRIMARY} noWrap sx={{ maxWidth: 140 }}>{s.fullName || '—'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{s.username}</TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.83rem' }}>{s.email || '—'}</TableCell>
                    <TableCell>
                      {s.schoolId ? (
                        <Chip label={schoolName(s.schoolId)} size="small"
                          sx={{ bgcolor: 'rgba(21,101,192,0.08)', color: '#1565c0', border: '1px solid rgba(21,101,192,0.2)', maxWidth: 130, fontSize: '0.75rem' }} />
                      ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                    </TableCell>

                    {tab === 0 && (
                      <>
                      <TableCell>
                        <Chip label={classroomName(s.classroomId)} size="small"
                          sx={{ bgcolor: 'rgba(0,166,81,0.08)', color: '#00a651', border: '1px solid rgba(0,166,81,0.2)', maxWidth: 140, fontSize: '0.75rem' }} />
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '0.83rem' }}>{s.grade || '—'}</TableCell>
                      </>
                    )}

                    <TableCell sx={{ color: '#475569', fontSize: '0.83rem' }}>{s.age ?? '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title={tab === 0 ? 'Alterar turma' : 'Matricular'}>
                        <IconButton size="small" onClick={() => openEnroll(s)}
                          sx={{ color: ACCENT, mr: 0.5, '&:hover': { bgcolor: 'rgba(0,166,81,0.08)' } }}>
                          {tab === 0 ? <ChangeIcon fontSize="small" /> : <EnrollIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      {tab === 0 && (
                        <Tooltip title="Remover da turma">
                          <IconButton size="small" onClick={() => handleRemove(s)}
                            sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}>
                            <UnenrollIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div" count={filtered.length} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]} labelRowsPerPage="Por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            sx={{ borderTop: '1px solid rgba(0,0,0,0.06)', bgcolor: 'rgba(248,250,252,0.6)' }}
          />
          </>
        )}
      </Box>

      {/* Enrollment Dialog */}
      <Dialog open={enrollOpen} onClose={() => setEnrollOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } }, paper: { sx: { ...glass, background: 'rgba(255,255,255,0.97)', borderRadius: 4, overflow: 'hidden' } } }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg,#0A1628 0%,#00A651 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <EnrollIcon sx={{ color: '#6ee7b7' }} />
              <Box>
                <Typography variant="h6" color="white" fontWeight={700}>Matrícula</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>{enrollForm.studentName}</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setEnrollOpen(false)} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" fullWidth sx={inputSx} disabled={isSchoolAdmin}>
                <InputLabel>Escola *</InputLabel>
                <Select label="Escola *" value={enrollForm.schoolId}
                  onChange={e => setEnrollForm(p => ({ ...p, schoolId: String(e.target.value), classroomId: '' }))}>
                  <MenuItem value=""><em>— Selecionar —</em></MenuItem>
                  {schools.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth sx={inputSx}>
                <InputLabel>Turma *</InputLabel>
                <Select label="Turma *" value={enrollForm.classroomId}
                  onChange={e => setEnrollForm(p => ({ ...p, classroomId: String(e.target.value) }))}>
                  <MenuItem value=""><em>— Selecionar —</em></MenuItem>
                  {classroomsForSchool.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Nível de Ensino" size="small" fullWidth value={enrollForm.grade}
                onChange={e => setEnrollForm(p => ({ ...p, grade: e.target.value }))} sx={inputSx} placeholder="Ex: 10ª Classe" />
              <TextField label="Idade" size="small" fullWidth value={enrollForm.age} type="number"
                onChange={e => setEnrollForm(p => ({ ...p, age: e.target.value }))} sx={inputSx} />
            </Box>
          </Box>
        </DialogContent>
        <Box sx={{ px: 3, pb: 3, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={() => setEnrollOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary', borderRadius: '10px', px: 2.5, border: '1px solid rgba(0,0,0,0.1)' }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !enrollForm.classroomId}
            sx={{ background: 'linear-gradient(135deg,#00A651 0%,#00c96a 100%)', textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3, minWidth: 110,
              boxShadow: '0 4px 15px rgba(0,166,81,0.35)', '&:hover': { boxShadow: '0 6px 20px rgba(0,166,81,0.45)' } }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Confirmar Matrícula'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default StudentsEnrollmentPage;
