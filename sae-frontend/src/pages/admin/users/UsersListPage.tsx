import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, TextField, Alert, CircularProgress, Tooltip,
  InputAdornment, Avatar, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Search as SearchIcon,
  Close as CloseIcon, Group as GroupIcon, FilterList as FilterIcon,
  Person as PersonIcon, School as SchoolIcon,
} from '@mui/icons-material';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

/* ── Types ── */
interface UserDTO {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  nTelefone?: string;
  role: string;
  status: number;
}

interface ProfessorProfileDTO {
  id: number;
  fullName: string;
  username: string;
  email: string;
  schoolId: number | null;
  department: string;
  specialization: string;
  institutionalContact: string;
}

interface StudentProfileDTO {
  userId: number;
  fullName: string;
  username: string;
  email: string;
  schoolId: number | null;
  classroomId: number | null;
  grade: string;
  age: number | null;
}

interface SchoolDTO {
  id: number;
  name: string;
}

interface ClassroomDTO {
  id: number;
  name: string;
  schoolId: number;
  classLevelId: number;
}

interface ClassLevelDTO {
  id: number;
  name: string;
}

/* ── Design tokens ── */
const ACCENT  = '#00A651';
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
  '&:disabled': { background: '#ccc', boxShadow: 'none' },
  boxShadow: '0 4px 15px rgba(0,166,81,0.35)',
  borderRadius: '10px', textTransform: 'none' as const, fontWeight: 700,
} as const;

const cancelBtn = {
  textTransform: 'none' as const, color: 'text.secondary', fontWeight: 500,
  borderRadius: '10px', px: 2.5, border: '1px solid rgba(0,0,0,0.1)',
  '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
} as const;

/* ── Helpers ── */
const ROLES = ['ADMIN', 'SCHOOL_ADMIN', 'PROFESSOR', 'STUDENT'];

const roleChip: Record<string, { label: string; bg: string; color: string }> = {
  ADMIN:        { label: 'Admin',          bg: 'rgba(156,39,176,0.1)',  color: '#7b1fa2' },
  SCHOOL_ADMIN: { label: 'Admin de Escola', bg: 'rgba(0,125,60,0.1)',   color: '#007d3c' },
  PROFESSOR:    { label: 'Professor',      bg: 'rgba(21,101,192,0.1)',  color: '#00A651' },
  STUDENT:      { label: 'Estudante',      bg: 'rgba(0,166,81,0.1)',    color: '#00A651' },
  GUEST:        { label: 'Visitante',      bg: 'rgba(158,158,158,0.1)', color: '#616161' },
};

function initials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const avatarColors = ['#00A651','#7b1fa2','#00A651','#e65100','#00838f','#c62828'];
const avatarColor  = (id: number) => avatarColors[id % avatarColors.length];

/* ── Dialog title bar ── */
const DialogHeader: React.FC<{ icon: React.ReactNode; title: string; onClose: () => void }> = ({ icon, title, onClose }) => (
  <DialogTitle sx={{ p: 0 }}>
    <Box sx={{ px: 3, py: 2.5, background: `linear-gradient(135deg,${PRIMARY} 0%,#00A651 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {icon}
        <Typography variant="h6" color="white">{title}</Typography>
      </Box>
      <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>
);

const dialogPaperSx = {
  ...glass, background: 'rgba(255,255,255,0.97)',
  borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden',
};

/* ════════════════════════════════════════════════════════════════ */
const UsersListPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const isSchoolAdmin = authUser?.role === 'Administrador de Escola' || authUser?.role === 'SCHOOL_ADMIN';

  const [schoolAdminSchoolId, setSchoolAdminSchoolId] = useState<number | null>(null);

  const [users, setUsers]     = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  /* ── Create dialog ── */
  const [createOpen, setCreateOpen] = useState(false);
  const [createRole, setCreateRole] = useState('ADMIN');
  const [createForm, setCreateForm] = useState({
    fullname: '', nTelefone: '', email: '', password: '',
    schoolId: '', department: '', specialization: '', institutionalContact: '',
    classroomId: '', grade: '', age: '',
  });
  const [creating, setCreating] = useState(false);

  /* ── Edit dialog ── */
  const [editOpen, setEditOpen]   = useState(false);
  const [editForm, setEditForm]   = useState({ userId: 0, fullname: '', email: '' });
  const [updating, setUpdating]   = useState(false);

  /* ── Professor profile dialog ── */
  const [profOpen, setProfOpen]   = useState(false);
  const [profForm, setProfForm]   = useState<ProfessorProfileDTO | null>(null);
  const [profUpdate, setProfUpdate] = useState({ userId: 0, schoolId: '', department: '', specialization: '', institutionalContact: '' });
  const [profSaving, setProfSaving] = useState(false);

  /* ── Student profile dialog ── */
  const [studOpen, setStudOpen]   = useState(false);
  const [studForm, setStudForm]   = useState<StudentProfileDTO | null>(null);
  const [studUpdate, setStudUpdate] = useState({ userId: 0, schoolId: '', classroomId: '', grade: '', age: '' });
  const [studSaving, setStudSaving] = useState(false);

  /* ── Student level selectors (cascade) ── */
  const [createStudLevelId, setCreateStudLevelId] = useState<number | ''>('');
  const [studLevelId, setStudLevelId] = useState<number | ''>('');

  /* ── Pagination ── */
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /* ── Reference data ── */
  const [schools, setSchools]         = useState<SchoolDTO[]>([]);
  const [classrooms, setClassrooms]   = useState<ClassroomDTO[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevelDTO[]>([]);

  /* ── Load ── */
  const load = async () => {
    try {
      setLoading(true); setError(null);
      const endpoint = isSchoolAdmin ? '/auth/users/my-school/members' : '/auth/users/all';
      const { data } = await api.get<UserDTO[]>(endpoint);
      setUsers(data);
    } catch { setError('Erro ao carregar utilizadores.'); }
    finally   { setLoading(false); }
  };
  useEffect(() => {
    load();
    Promise.all([
      api.get<SchoolDTO[]>('/academic/school/all'),
      api.get<ClassroomDTO[]>('/academic/classroom/all'),
      api.get<ClassLevelDTO[]>('/academic/class-level/all'),
    ]).then(([sch, cls, lvl]) => {
      setSchools(sch.data);
      setClassrooms(cls.data);
      setClassLevels(lvl.data);
    }).catch(() => {});
    if (isSchoolAdmin) {
      api.get<{ schoolId: number }>('/auth/users/school-admin-profile')
        .then(r => setSchoolAdminSchoolId(r.data.schoolId))
        .catch(() => {});
    }
  }, []);

  const filtered = useMemo(() => users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.username?.toLowerCase().includes(q)
      || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  }), [users, search, roleFilter]);

  useEffect(() => { setPage(0); }, [search, roleFilter]);

  const levelsForCreateSchool = useMemo(() => {
    if (!createForm.schoolId) return classLevels;
    const ids = new Set(classrooms.filter(c => c.schoolId === Number(createForm.schoolId)).map(c => c.classLevelId));
    return classLevels.filter(l => l.id !== undefined && ids.has(l.id!));
  }, [classrooms, classLevels, createForm.schoolId]);

  const levelsForStudSchool = useMemo(() => {
    if (!studUpdate.schoolId) return classLevels;
    const ids = new Set(classrooms.filter(c => c.schoolId === Number(studUpdate.schoolId)).map(c => c.classLevelId));
    return classLevels.filter(l => l.id !== undefined && ids.has(l.id!));
  }, [classrooms, classLevels, studUpdate.schoolId]);

  const classroomsForCreate = useMemo(() => {
    let res = classrooms;
    if (createForm.schoolId) res = res.filter(c => c.schoolId === Number(createForm.schoolId));
    if (createStudLevelId !== '') res = res.filter(c => c.classLevelId === createStudLevelId);
    return res;
  }, [classrooms, createForm.schoolId, createStudLevelId]);

  const classroomsForStudent = useMemo(() => {
    let res = classrooms;
    if (studUpdate.schoolId) res = res.filter(c => c.schoolId === Number(studUpdate.schoolId));
    if (studLevelId !== '') res = res.filter(c => c.classLevelId === studLevelId);
    return res;
  }, [classrooms, studUpdate.schoolId, studLevelId]);

  const allowedRoles = isSchoolAdmin ? ['PROFESSOR', 'STUDENT'] : ROLES;

  /* ── Create ── */
  const openCreate = () => {
    const defaultSchoolId = isSchoolAdmin && schoolAdminSchoolId ? String(schoolAdminSchoolId) : '';
    setCreateForm({ fullname: '', nTelefone: '', email: '', password: '', schoolId: defaultSchoolId, department: '', specialization: '', institutionalContact: '', classroomId: '', grade: '', age: '' });
    setCreateRole(isSchoolAdmin ? 'PROFESSOR' : 'ADMIN');
    setCreateStudLevelId('');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!createForm.fullname.trim() || !createForm.nTelefone.trim() || !createForm.password.trim()) {
      setError('Nome, telefone e password são obrigatórios.'); return;
    }
    if (createRole === 'SCHOOL_ADMIN' && !createForm.schoolId) {
      setError('É obrigatório selecionar uma escola para o Administrador de Escola.'); return;
    }
    try {
      setCreating(true); setError(null);
      if (createRole === 'PROFESSOR') {
        await api.post('/auth/users/signup/professor', {
          fullname: createForm.fullname, nTelefone: createForm.nTelefone,
          email: createForm.email, password: createForm.password,
          schoolId: createForm.schoolId ? Number(createForm.schoolId) : null,
          department: createForm.department, specialization: createForm.specialization,
          institutionalContact: createForm.institutionalContact,
        });
      } else if (createRole === 'STUDENT') {
        await api.post('/auth/users/signup/student', {
          fullname: createForm.fullname, nTelefone: createForm.nTelefone,
          email: createForm.email, password: createForm.password,
          schoolId: createForm.schoolId ? Number(createForm.schoolId) : null,
          classroomId: createForm.classroomId ? Number(createForm.classroomId) : null,
          grade: createForm.grade,
          age: createForm.age ? Number(createForm.age) : null,
        });
      } else if (createRole === 'SCHOOL_ADMIN') {
        await api.post('/auth/users/signup/school-admin', {
          fullname: createForm.fullname, nTelefone: createForm.nTelefone,
          email: createForm.email, password: createForm.password,
          schoolId: Number(createForm.schoolId),
        });
      } else {
        await api.post('/auth/users/signup', {
          fullname: createForm.fullname, username: createForm.nTelefone,
          email: createForm.email, password: createForm.password,
        });
      }
      setCreateOpen(false); await load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Erro ao criar utilizador.');
    }
    finally  { setCreating(false); }
  };

  /* ── Edit ── */
  const openEdit = (u: UserDTO) => {
    setEditForm({ userId: u.id, fullname: u.fullName ?? '', email: u.email ?? '' });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    try {
      setUpdating(true); setError(null);
      await api.put('/auth/users/update', editForm);
      setEditOpen(false); await load();
    } catch { setError('Erro ao actualizar utilizador.'); }
    finally  { setUpdating(false); }
  };

  /* ── Professor profile ── */
  const openProfProfile = async (u: UserDTO) => {
    try {
      setError(null);
      const { data } = await api.get<ProfessorProfileDTO>(`/auth/users/professor-profile?userId=${u.id}`);
      setProfForm(data);
      setProfUpdate({ userId: u.id, schoolId: String(data.schoolId ?? ''), department: data.department ?? '', specialization: data.specialization ?? '', institutionalContact: data.institutionalContact ?? '' });
    } catch {
      setProfForm(null);
      setProfUpdate({ userId: u.id, schoolId: '', department: '', specialization: '', institutionalContact: '' });
    }
    setProfOpen(true);
  };

  const handleProfSave = async () => {
    try {
      setProfSaving(true); setError(null);
      await api.put('/auth/users/professor-profile', {
        userId: profUpdate.userId,
        schoolId: profUpdate.schoolId ? Number(profUpdate.schoolId) : null,
        department: profUpdate.department, specialization: profUpdate.specialization,
        institutionalContact: profUpdate.institutionalContact,
      });
      setProfOpen(false); await load();
    } catch { setError('Erro ao guardar perfil de professor.'); }
    finally  { setProfSaving(false); }
  };

  /* ── Student profile ── */
  const openStudProfile = async (u: UserDTO) => {
    try {
      setError(null);
      const { data } = await api.get<StudentProfileDTO>(`/auth/users/student-profile?userId=${u.id}`);
      setStudForm(data);
      setStudUpdate({ userId: u.id, schoolId: String(data.schoolId ?? ''), classroomId: String(data.classroomId ?? ''), grade: data.grade ?? '', age: String(data.age ?? '') });
      if (data.classroomId) {
        const room = classrooms.find(c => c.id === data.classroomId);
        setStudLevelId(room?.classLevelId ?? '');
      } else {
        setStudLevelId('');
      }
    } catch {
      setStudForm(null);
      setStudUpdate({ userId: u.id, schoolId: '', classroomId: '', grade: '', age: '' });
      setStudLevelId('');
    }
    setStudOpen(true);
  };

  const handleStudSave = async () => {
    try {
      setStudSaving(true); setError(null);
      await api.put('/auth/users/student-profile', {
        userId: studUpdate.userId,
        schoolId: studUpdate.schoolId ? Number(studUpdate.schoolId) : null,
        classroomId: studUpdate.classroomId ? Number(studUpdate.classroomId) : null,
        grade: studUpdate.grade,
        age: studUpdate.age ? Number(studUpdate.age) : null,
      });
      setStudOpen(false); await load();
    } catch { setError('Erro ao guardar perfil de estudante.'); }
    finally  { setStudSaving(false); }
  };

  /* ════════════════════════════════════════════════════════════════ */
  return (
    <Box sx={{ minHeight: '100%', background: 'linear-gradient(160deg,#eef2ff 0%,#f8fafc 50%,#f0fdf4 100%)', p: 3, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,166,81,.07) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: -80, left: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(156,39,176,.05) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `linear-gradient(135deg,${PRIMARY} 0%,#00A651 100%)`, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, p: 2.5, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.2, borderRadius: 2, background: 'rgba(0,166,81,0.15)', border: '1px solid rgba(0,166,81,0.25)', display: 'flex' }}>
              <GroupIcon sx={{ color: '#4caf50', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" color="white" sx={{ lineHeight: 1.2 }}>Utilizadores</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.3 }}>Gestão de todos os utilizadores do sistema</Typography>
            </Box>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ ...gradBtn, px: 3 }}>
            Novo Utilizador
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, ...glass }} onClose={() => setError(null)}>{error}</Alert>}

        {/* Filter bar */}
        <Box sx={{ ...glass, borderRadius: 3, p: 2, mb: 2.5, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <TextField
            size="small" placeholder="Pesquisar por nome, telefone ou email…"
            value={search} onChange={e => setSearch(e.target.value)}
            slotProps={{ input: {
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
              endAdornment: search ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch('')}><CloseIcon sx={{ fontSize: 15 }} /></IconButton></InputAdornment> : null,
            }}}
            sx={{ flex: 1, minWidth: 220, maxWidth: 380, ...inputSx }}
          />
          <FormControl size="small" sx={{ minWidth: 150, ...inputSx }}>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              {ROLES.map(r => <MenuItem key={r} value={r}>{roleChip[r]?.label ?? r}</MenuItem>)}
            </Select>
          </FormControl>
          {(search || roleFilter) && (
            <Button size="small" onClick={() => { setSearch(''); setRoleFilter(''); }} sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.8rem' }}>
              Limpar
            </Button>
          )}
          <Chip label={`${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`} size="small"
            sx={{ bgcolor: 'rgba(0,166,81,0.1)', color: ACCENT, ml: 'auto', border: '1px solid rgba(0,166,81,0.2)' }} />
        </Box>

        {/* Table */}
        <Box sx={{ ...glass, borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, background: `linear-gradient(135deg,${PRIMARY} 0%,#1e3a5f 100%)`, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 0.8, borderRadius: 1.5, background: 'rgba(0,166,81,0.15)', border: '1px solid rgba(0,166,81,0.2)', display: 'flex' }}>
              <GroupIcon sx={{ color: '#4caf50', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" color="white" sx={{ flex: 1 }}>Lista de Utilizadores</Typography>
            {!loading && (
              <Chip label={`${users.length} registo${users.length !== 1 ? 's' : ''}`} size="small"
                sx={{ bgcolor: 'rgba(0,166,81,0.15)', color: '#4caf50', border: '1px solid rgba(0,166,81,0.25)' }} />
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, background: 'rgba(255,255,255,0.5)' }}>
              <CircularProgress sx={{ color: ACCENT }} />
            </Box>
          ) : (
            <>
            <TableContainer sx={{ background: 'transparent' }}>
              <Table sx={{ minWidth: 680 }}>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(0,0,0,0.025)' }}>
                    {['Utilizador', 'Telefone', 'Email', 'Role', 'Estado', 'Ações'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.7, py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ border: 'none', py: 0 }}>
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <GroupIcon sx={{ fontSize: 52, color: 'rgba(0,0,0,0.08)', mb: 1.5 }} />
                          <Typography color="text.secondary" fontWeight={500}>Nenhum utilizador encontrado</Typography>
                          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                            {search || roleFilter ? 'Tente ajustar os filtros' : 'Crie o primeiro utilizador clicando em "Novo Utilizador"'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(u => {
                    const rc = roleChip[u.role] ?? { label: u.role, bg: 'rgba(158,158,158,0.1)', color: '#616161' };
                    return (
                      <TableRow key={u.id} sx={{ transition: 'background .15s', '&:hover': { background: 'rgba(0,166,81,0.035)' } }}>
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: avatarColor(u.id), fontSize: '0.75rem', fontWeight: 700, boxShadow: `0 2px 8px ${avatarColor(u.id)}55` }}>
                              {initials(u.fullName)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600} color={PRIMARY}>{u.fullName || '—'}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#475569', fontFamily: 'monospace', fontSize: '0.85rem', py: 1.5 }}>{u.username}</TableCell>
                        <TableCell sx={{ color: '#475569', py: 1.5 }}>{u.email || '—'}</TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Chip label={rc.label} size="small" sx={{ bgcolor: rc.bg, color: rc.color, border: `1px solid ${rc.color}33`, fontWeight: 700, fontSize: '0.78rem' }} />
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Chip label={u.status === 1 ? 'Ativo' : 'Inativo'} size="small"
                            color={u.status === 1 ? 'success' : 'error'} variant="outlined" />
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <Tooltip title="Editar dados" placement="top">
                            <IconButton size="small" onClick={() => openEdit(u)} sx={{ color: '#1976d2', mr: 0.5, '&:hover': { bgcolor: 'rgba(25,118,210,0.08)' } }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {u.role === 'PROFESSOR' && (
                            <Tooltip title="Perfil de professor" placement="top">
                              <IconButton size="small" onClick={() => openProfProfile(u)} sx={{ color: '#7b1fa2', mr: 0.5, '&:hover': { bgcolor: 'rgba(123,31,162,0.08)' } }}>
                                <PersonIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {u.role === 'STUDENT' && (
                            <Tooltip title="Perfil de estudante" placement="top">
                              <IconButton size="small" onClick={() => openStudProfile(u)} sx={{ color: ACCENT, '&:hover': { bgcolor: 'rgba(0,166,81,0.08)' } }}>
                                <SchoolIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {u.role === 'SCHOOL_ADMIN' && (
                            <Tooltip title="Administrador de Escola" placement="top">
                              <IconButton size="small" sx={{ color: '#007d3c', '&:hover': { bgcolor: 'rgba(0,125,60,0.08)' }, cursor: 'default' }}>
                                <SchoolIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
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

      {/* ═══════════════════════════ CREATE DIALOG ═══════════════════════════ */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } }, paper: { sx: dialogPaperSx } }}>
        <DialogHeader icon={<AddIcon sx={{ color: '#4caf50' }} />} title="Novo Utilizador" onClose={() => setCreateOpen(false)} />
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl size="small" fullWidth sx={inputSx}>
              <InputLabel>Role *</InputLabel>
              <Select label="Role *" value={createRole} onChange={e => setCreateRole(e.target.value)}>
                {allowedRoles.map(r => <MenuItem key={r} value={r}>{roleChip[r]?.label ?? r}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Nome completo *" size="small" fullWidth value={createForm.fullname}
              onChange={e => setCreateForm(p => ({ ...p, fullname: e.target.value }))} sx={inputSx} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Nº Telefone *" size="small" fullWidth value={createForm.nTelefone}
                onChange={e => setCreateForm(p => ({ ...p, nTelefone: e.target.value }))} sx={inputSx} />
              <TextField label="Email" size="small" fullWidth value={createForm.email}
                onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} sx={inputSx} />
            </Box>
            <TextField label="Password *" type="password" size="small" fullWidth value={createForm.password}
              onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} sx={inputSx} />

            {createRole === 'SCHOOL_ADMIN' && (
              <FormControl size="small" fullWidth sx={inputSx} required>
                <InputLabel>Escola *</InputLabel>
                <Select label="Escola *" value={createForm.schoolId}
                  onChange={e => setCreateForm(p => ({ ...p, schoolId: String(e.target.value) }))}>
                  <MenuItem value=""><em>— Selecionar escola —</em></MenuItem>
                  {schools.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {createRole === 'PROFESSOR' && (
              <>
                <FormControl size="small" fullWidth sx={inputSx} disabled={isSchoolAdmin}>
                  <InputLabel>Escola</InputLabel>
                  <Select label="Escola" value={createForm.schoolId}
                    onChange={e => setCreateForm(p => ({ ...p, schoolId: String(e.target.value) }))}>
                    <MenuItem value=""><em>— Selecionar escola —</em></MenuItem>
                    {schools.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Departamento" size="small" fullWidth value={createForm.department}
                  onChange={e => setCreateForm(p => ({ ...p, department: e.target.value }))} sx={inputSx} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="Especialização" size="small" fullWidth value={createForm.specialization}
                    onChange={e => setCreateForm(p => ({ ...p, specialization: e.target.value }))} sx={inputSx} />
                  <TextField label="Contacto Institucional" size="small" fullWidth value={createForm.institutionalContact}
                    onChange={e => setCreateForm(p => ({ ...p, institutionalContact: e.target.value }))} sx={inputSx} />
                </Box>
              </>
            )}

            {createRole === 'STUDENT' && (
              <>
                <FormControl size="small" fullWidth sx={inputSx} disabled={isSchoolAdmin}>
                  <InputLabel>Escola</InputLabel>
                  <Select label="Escola" value={createForm.schoolId}
                    onChange={e => { setCreateForm(p => ({ ...p, schoolId: String(e.target.value), classroomId: '', grade: '' })); setCreateStudLevelId(''); }}>
                    <MenuItem value=""><em>— Selecionar escola —</em></MenuItem>
                    {schools.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth sx={inputSx} disabled={!createForm.schoolId}>
                  <InputLabel>Nível de Ensino</InputLabel>
                  <Select label="Nível de Ensino" value={createStudLevelId}
                    onChange={e => { setCreateStudLevelId(Number(e.target.value)); setCreateForm(p => ({ ...p, classroomId: '', grade: '' })); }}>
                    <MenuItem value=""><em>— Selecionar nível —</em></MenuItem>
                    {levelsForCreateSchool.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" fullWidth sx={inputSx} disabled={!createStudLevelId}>
                  <InputLabel>Turma</InputLabel>
                  <Select label="Turma" value={createForm.classroomId}
                    onChange={e => {
                      const cId = Number(e.target.value);
                      const room = classrooms.find(c => c.id === cId);
                      const level = room ? classLevels.find(l => l.id === room.classLevelId) : null;
                      setCreateForm(p => ({ ...p, classroomId: String(cId), grade: level?.name ?? '' }));
                    }}>
                    <MenuItem value=""><em>— Selecionar turma —</em></MenuItem>
                    {classroomsForCreate.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Idade" size="small" fullWidth value={createForm.age}
                  onChange={e => setCreateForm(p => ({ ...p, age: e.target.value }))} sx={inputSx} />
              </>
            )}
          </Box>
        </DialogContent>
        <Box sx={{ px: 3, pb: 3, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={() => setCreateOpen(false)} sx={cancelBtn}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating} sx={{ ...gradBtn, px: 3, minWidth: 110 }}>
            {creating ? <CircularProgress size={18} color="inherit" /> : 'Criar'}
          </Button>
        </Box>
      </Dialog>

      {/* ═══════════════════════════ EDIT DIALOG ═══════════════════════════ */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth
        slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } }, paper: { sx: dialogPaperSx } }}>
        <DialogHeader icon={<EditIcon sx={{ color: '#4caf50' }} />} title="Editar Utilizador" onClose={() => setEditOpen(false)} />
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Nome completo" size="small" fullWidth value={editForm.fullname}
              onChange={e => setEditForm(p => ({ ...p, fullname: e.target.value }))} sx={inputSx} autoFocus />
            <TextField label="Email" size="small" fullWidth value={editForm.email}
              onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} sx={inputSx} />
          </Box>
        </DialogContent>
        <Box sx={{ px: 3, pb: 3, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={() => setEditOpen(false)} sx={cancelBtn}>Cancelar</Button>
          <Button variant="contained" onClick={handleEdit} disabled={updating} sx={{ ...gradBtn, px: 3, minWidth: 120 }}>
            {updating ? <CircularProgress size={18} color="inherit" /> : 'Actualizar'}
          </Button>
        </Box>
      </Dialog>

      {/* ═══════════════════════════ PROFESSOR PROFILE DIALOG ═══════════════════════════ */}
      <Dialog open={profOpen} onClose={() => setProfOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } }, paper: { sx: dialogPaperSx } }}>
        <DialogHeader icon={<PersonIcon sx={{ color: '#4caf50' }} />} title="Perfil de Professor" onClose={() => setProfOpen(false)} />
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          {profForm && (
            <Box sx={{ mb: 2.5, p: 2, borderRadius: 2, bgcolor: 'rgba(0,166,81,0.05)', border: '1px solid rgba(0,166,81,0.15)' }}>
              <Typography variant="body2" fontWeight={600} color={PRIMARY}>{profForm.fullName}</Typography>
              <Typography variant="caption" color="text.secondary">{profForm.username} · {profForm.email}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl size="small" fullWidth sx={inputSx}>
              <InputLabel>Escola</InputLabel>
              <Select label="Escola" value={profUpdate.schoolId}
                onChange={e => setProfUpdate(p => ({ ...p, schoolId: String(e.target.value) }))}>
                <MenuItem value=""><em>— Selecionar escola —</em></MenuItem>
                {schools.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Departamento" size="small" fullWidth value={profUpdate.department}
              onChange={e => setProfUpdate(p => ({ ...p, department: e.target.value }))} sx={inputSx} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Especialização" size="small" fullWidth value={profUpdate.specialization}
                onChange={e => setProfUpdate(p => ({ ...p, specialization: e.target.value }))} sx={inputSx} />
              <TextField label="Contacto Institucional" size="small" fullWidth value={profUpdate.institutionalContact}
                onChange={e => setProfUpdate(p => ({ ...p, institutionalContact: e.target.value }))} sx={inputSx} />
            </Box>
          </Box>
        </DialogContent>
        <Box sx={{ px: 3, pb: 3, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={() => setProfOpen(false)} sx={cancelBtn}>Cancelar</Button>
          <Button variant="contained" onClick={handleProfSave} disabled={profSaving} sx={{ ...gradBtn, px: 3, minWidth: 120 }}>
            {profSaving ? <CircularProgress size={18} color="inherit" /> : 'Guardar'}
          </Button>
        </Box>
      </Dialog>

      {/* ═══════════════════════════ STUDENT PROFILE DIALOG ═══════════════════════════ */}
      <Dialog open={studOpen} onClose={() => setStudOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } }, paper: { sx: dialogPaperSx } }}>
        <DialogHeader icon={<SchoolIcon sx={{ color: '#4caf50' }} />} title="Perfil de Estudante" onClose={() => setStudOpen(false)} />
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          {studForm && (
            <Box sx={{ mb: 2.5, p: 2, borderRadius: 2, bgcolor: 'rgba(0,166,81,0.05)', border: '1px solid rgba(0,166,81,0.15)' }}>
              <Typography variant="body2" fontWeight={600} color={PRIMARY}>{studForm.fullName}</Typography>
              <Typography variant="caption" color="text.secondary">{studForm.username} · {studForm.email}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl size="small" fullWidth sx={inputSx}>
              <InputLabel>Escola</InputLabel>
              <Select label="Escola" value={studUpdate.schoolId}
                onChange={e => { setStudUpdate(p => ({ ...p, schoolId: String(e.target.value), classroomId: '', grade: '' })); setStudLevelId(''); }}>
                <MenuItem value=""><em>— Selecionar escola —</em></MenuItem>
                {schools.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth sx={inputSx} disabled={!studUpdate.schoolId}>
              <InputLabel>Nível de Ensino</InputLabel>
              <Select label="Nível de Ensino" value={studLevelId}
                onChange={e => { setStudLevelId(Number(e.target.value)); setStudUpdate(p => ({ ...p, classroomId: '', grade: '' })); }}>
                <MenuItem value=""><em>— Selecionar nível —</em></MenuItem>
                {levelsForStudSchool.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth sx={inputSx} disabled={!studLevelId}>
              <InputLabel>Turma</InputLabel>
              <Select label="Turma" value={studUpdate.classroomId}
                onChange={e => {
                  const cId = Number(e.target.value);
                  const room = classrooms.find(c => c.id === cId);
                  const level = room ? classLevels.find(l => l.id === room.classLevelId) : null;
                  setStudUpdate(p => ({ ...p, classroomId: String(cId), grade: level?.name ?? '' }));
                }}>
                <MenuItem value=""><em>— Selecionar turma —</em></MenuItem>
                {classroomsForStudent.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Idade" size="small" fullWidth value={studUpdate.age}
              onChange={e => setStudUpdate(p => ({ ...p, age: e.target.value }))} sx={inputSx} />
          </Box>
        </DialogContent>
        <Box sx={{ px: 3, pb: 3, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={() => setStudOpen(false)} sx={cancelBtn}>Cancelar</Button>
          <Button variant="contained" onClick={handleStudSave} disabled={studSaving} sx={{ ...gradBtn, px: 3, minWidth: 120 }}>
            {studSaving ? <CircularProgress size={18} color="inherit" /> : 'Guardar'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default UsersListPage;
