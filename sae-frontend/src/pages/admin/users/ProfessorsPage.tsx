import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip, Button, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, CircularProgress, Alert, Tooltip, InputAdornment, Avatar, MenuItem,
  Select, FormControl, InputLabel,
} from '@mui/material';
import {
  Edit as EditIcon, Search as SearchIcon, Close as CloseIcon, Person as PersonIcon,
} from '@mui/icons-material';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { schoolService, type SchoolDTO } from '../../../services/academicService';

interface ProfessorDTO {
  id: number;
  fullName: string;
  username: string;
  email?: string;
  schoolId?: number | null;
  department?: string;
  specialization?: string;
  institutionalContact?: string;
  online?: boolean;
  professorCode?: string;
}

const ACCENT  = '#1565c0';
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

const ProfessorsPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const isSchoolAdmin = authUser?.role === 'Administrador de Escola' || authUser?.role === 'SCHOOL_ADMIN';

  const [professors, setProfessors] = useState<ProfessorDTO[]>([]);
  const [schools,    setSchools]    = useState<SchoolDTO[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ userId: 0, schoolId: '', department: '', specialization: '', institutionalContact: '' });
  const [saving,   setSaving]   = useState(false);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const [profsRes, schoolsRes] = await Promise.all([
        api.get<ProfessorDTO[]>('/auth/users/professors'),
        schoolService.findAll(),
      ]);
      setProfessors(profsRes.data);
      setSchools(schoolsRes);
    } catch { setError('Erro ao carregar professores.'); }
    finally   { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(0); }, [search]);

  const filtered = useMemo(() => professors.filter(p => {
    const q = search.toLowerCase();
    return !q
      || p.fullName?.toLowerCase().includes(q)
      || p.username?.toLowerCase().includes(q)
      || p.specialization?.toLowerCase().includes(q)
      || p.department?.toLowerCase().includes(q);
  }), [professors, search]);

  const schoolName = (id?: number | null) => schools.find(s => s.id === id)?.name ?? '—';

  const openEdit = (p: ProfessorDTO) => {
    setEditForm({
      userId: p.id,
      schoolId: String(p.schoolId ?? ''),
      department: p.department ?? '',
      specialization: p.specialization ?? '',
      institutionalContact: p.institutionalContact ?? '',
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true); setError(null);
      await api.put('/auth/users/professor-profile', {
        userId: editForm.userId,
        schoolId: editForm.schoolId ? Number(editForm.schoolId) : null,
        department: editForm.department,
        specialization: editForm.specialization,
        institutionalContact: editForm.institutionalContact,
      });
      setEditOpen(false); await load();
    } catch { setError('Erro ao guardar perfil.'); }
    finally   { setSaving(false); }
  };

  return (
    <Box sx={{ minHeight: '100%', background: 'linear-gradient(160deg,#eff6ff 0%,#f8fafc 50%,#f0fdf4 100%)', p: 3 }}>

      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg,#0A1628 0%,#1565c0 100%)', borderRadius: 3, p: 2.5, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ p: 1.2, borderRadius: 2, background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.3)', display: 'flex' }}>
            <PersonIcon sx={{ color: '#93c5fd', fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" color="white" fontWeight={700}>Professores</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.3 }}>
              {isSchoolAdmin ? 'Professores da sua escola' : 'Todos os professores do sistema'}
            </Typography>
          </Box>
        </Box>
        {!loading && (
          <Chip label={`${professors.length} professor${professors.length !== 1 ? 'es' : ''}`} size="small"
            sx={{ bgcolor: 'rgba(96,165,250,0.2)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.3)' }} />
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Search */}
      <Box sx={{ ...glass, borderRadius: 3, p: 2, mb: 2.5 }}>
        <TextField
          size="small" placeholder="Pesquisar por nome, departamento ou especialização…"
          value={search} onChange={e => setSearch(e.target.value)}
          slotProps={{ input: {
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
            endAdornment: search
              ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch('')}><CloseIcon sx={{ fontSize: 15 }} /></IconButton></InputAdornment>
              : null,
          }}}
          sx={{ width: '100%', maxWidth: 480, ...inputSx }}
        />
      </Box>

      {/* Table */}
      <Box sx={{ ...glass, borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: ACCENT }} />
          </Box>
        ) : (
          <>
          <TableContainer>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow sx={{ background: 'rgba(0,0,0,0.025)' }}>
                  {['Cód. Professor', 'Professor', 'Telefone', 'Email', 'Escola', 'Departamento', 'Especialização', 'Contacto', 'Estado', 'Ações'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.7, py: 1.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ border: 'none', textAlign: 'center', py: 8 }}>
                      <PersonIcon sx={{ fontSize: 48, color: 'rgba(0,0,0,0.08)', mb: 1 }} />
                      <Typography color="text.secondary">Nenhum professor encontrado</Typography>
                    </TableCell>
                  </TableRow>
                ) : filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(p => (
                  <TableRow key={p.id} sx={{ '&:hover': { background: 'rgba(21,101,192,0.03)' } }}>
                    <TableCell>
                      {p.professorCode ? (
                        <Chip label={p.professorCode} size="small"
                          sx={{ bgcolor: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)', fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700 }} />
                      ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: avatarColor(p.id), fontSize: '0.75rem', fontWeight: 700 }}>
                          {initials(p.fullName)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600} color={PRIMARY} noWrap sx={{ maxWidth: 140 }}>{p.fullName || '—'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{p.username}</TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.83rem' }}>{p.email || '—'}</TableCell>
                    <TableCell>
                      {p.schoolId ? (
                        <Chip label={schoolName(p.schoolId)} size="small"
                          sx={{ bgcolor: 'rgba(21,101,192,0.08)', color: '#1565c0', border: '1px solid rgba(21,101,192,0.2)', maxWidth: 130, fontSize: '0.75rem' }} />
                      ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.83rem', maxWidth: 120 }}>
                      <Typography variant="body2" noWrap>{p.department || '—'}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 150 }}>
                      {p.specialization ? (
                        <Chip label={p.specialization} size="small"
                          sx={{ bgcolor: 'rgba(0,166,81,0.08)', color: '#00a651', border: '1px solid rgba(0,166,81,0.2)', maxWidth: 150, fontSize: '0.75rem' }} />
                      ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.83rem' }}>{p.institutionalContact || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={p.online ? 'Online' : 'Offline'}
                        size="small"
                        color={p.online ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Editar perfil">
                        <IconButton size="small" onClick={() => openEdit(p)} sx={{ color: ACCENT, '&:hover': { bgcolor: 'rgba(21,101,192,0.08)' } }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } }, paper: { sx: { ...glass, background: 'rgba(255,255,255,0.97)', borderRadius: 4, overflow: 'hidden' } } }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg,#0A1628 0%,#1565c0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PersonIcon sx={{ color: '#93c5fd' }} />
              <Typography variant="h6" color="white" fontWeight={700}>Editar Perfil de Professor</Typography>
            </Box>
            <IconButton onClick={() => setEditOpen(false)} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl size="small" fullWidth sx={inputSx} disabled={isSchoolAdmin}>
              <InputLabel>Escola</InputLabel>
              <Select label="Escola" value={editForm.schoolId}
                onChange={e => setEditForm(p => ({ ...p, schoolId: String(e.target.value) }))}>
                <MenuItem value=""><em>— Selecionar —</em></MenuItem>
                {schools.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Departamento" size="small" fullWidth value={editForm.department}
              onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))} sx={inputSx} />
            <TextField label="Especialização" size="small" fullWidth value={editForm.specialization}
              onChange={e => setEditForm(p => ({ ...p, specialization: e.target.value }))} sx={inputSx} />
            <TextField label="Contacto Institucional" size="small" fullWidth value={editForm.institutionalContact}
              onChange={e => setEditForm(p => ({ ...p, institutionalContact: e.target.value }))} sx={inputSx} />
          </Box>
        </DialogContent>
        <Box sx={{ px: 3, pb: 3, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary', borderRadius: '10px', px: 2.5, border: '1px solid rgba(0,0,0,0.1)' }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ background: 'linear-gradient(135deg,#1565c0 0%,#1e88e5 100%)', textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3, minWidth: 110 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Guardar'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ProfessorsPage;
