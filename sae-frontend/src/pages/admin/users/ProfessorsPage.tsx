import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip, Button, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, CircularProgress, Alert, Tooltip, InputAdornment, Avatar, MenuItem,
  Select, FormControl, InputLabel, Tabs, Tab, Badge, LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon, Search as SearchIcon, Close as CloseIcon, Person as PersonIcon,
  CheckCircle as ApproveIcon, Cancel as RejectIcon, HourglassEmpty as PendingIcon,
  Upload as UploadIcon, FileDownload as DownloadIcon, CheckCircleOutline as OkIcon,
  ErrorOutline as ErrIcon, InsertDriveFile as FileIcon,
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
  approvalStatus?: string;
  rejectionReason?: string;
  teachingCycle?: string; // "BASICO" | "MEDIO" | "AMBOS"
}

interface ImportRowResult {
  row: number;
  nTelefone: string;
  fullname: string;
  success: boolean;
  error?: string;
}

interface ImportResult {
  totalRows: number;
  imported: number;
  failed: number;
  rows: ImportRowResult[];
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

const ApprovalChip: React.FC<{ status?: string }> = ({ status }) => {
  if (status === 'APPROVED') return (
    <Chip icon={<ApproveIcon sx={{ fontSize: '14px !important' }} />} label="Aprovado" size="small"
      sx={{ bgcolor: 'rgba(0,166,81,0.1)', color: '#00a651', border: '1px solid rgba(0,166,81,0.3)', fontWeight: 600, fontSize: '0.72rem' }} />
  );
  if (status === 'REJECTED') return (
    <Chip icon={<RejectIcon sx={{ fontSize: '14px !important' }} />} label="Rejeitado" size="small"
      sx={{ bgcolor: 'rgba(198,40,40,0.08)', color: '#c62828', border: '1px solid rgba(198,40,40,0.25)', fontWeight: 600, fontSize: '0.72rem' }} />
  );
  return (
    <Chip icon={<PendingIcon sx={{ fontSize: '14px !important' }} />} label="Pendente" size="small"
      sx={{ bgcolor: 'rgba(230,81,0,0.08)', color: '#e65100', border: '1px solid rgba(230,81,0,0.25)', fontWeight: 600, fontSize: '0.72rem' }} />
  );
};

const ProfessorsPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const isSchoolAdmin = authUser?.role === 'Administrador de Escola' || authUser?.role === 'SCHOOL_ADMIN';

  const [professors,    setProfessors]   = useState<ProfessorDTO[]>([]);
  const [schools,       setSchools]      = useState<SchoolDTO[]>([]);
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState<string | null>(null);
  const [search,        setSearch]       = useState('');
  const [page,          setPage]         = useState(0);
  const [rowsPerPage,   setRowsPerPage]  = useState(10);
  const [tabIndex,      setTabIndex]     = useState(0);   // 0=Todos 1=Pendentes 2=Aprovados 3=Rejeitados

  const [editOpen,  setEditOpen]  = useState(false);
  const [editForm,  setEditForm]  = useState({ userId: 0, schoolId: '', department: '', specialization: '', institutionalContact: '', teachingCycle: '' });
  const [saving,    setSaving]    = useState(false);

  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ProfessorDTO | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [importOpen,    setImportOpen]    = useState(false);
  const [importFile,    setImportFile]    = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult,  setImportResult]  = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  useEffect(() => { setPage(0); }, [search, tabIndex]);

  const byStatus = useMemo(() => ({
    all:      professors,
    pending:  professors.filter(p => !p.approvalStatus || p.approvalStatus === 'PENDING'),
    approved: professors.filter(p => p.approvalStatus === 'APPROVED'),
    rejected: professors.filter(p => p.approvalStatus === 'REJECTED'),
  }), [professors]);

  const tabData = [byStatus.all, byStatus.pending, byStatus.approved, byStatus.rejected];

  const filtered = useMemo(() => {
    const source = tabData[tabIndex] ?? byStatus.all;
    const q = search.toLowerCase();
    return !q ? source : source.filter(p =>
      p.fullName?.toLowerCase().includes(q)
      || p.username?.toLowerCase().includes(q)
      || p.specialization?.toLowerCase().includes(q)
      || p.department?.toLowerCase().includes(q)
    );
  }, [professors, search, tabIndex]);

  const schoolName = (id?: number | null) => schools.find(s => s.id === id)?.name ?? '—';

  const openEdit = (p: ProfessorDTO) => {
    setEditForm({
      userId: p.id,
      schoolId: String(p.schoolId ?? ''),
      department: p.department ?? '',
      specialization: p.specialization ?? '',
      institutionalContact: p.institutionalContact ?? '',
      teachingCycle: p.teachingCycle ?? '',
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
        teachingCycle: editForm.teachingCycle || null,
      });
      setEditOpen(false); await load();
    } catch { setError('Erro ao guardar perfil.'); }
    finally   { setSaving(false); }
  };

  const handleApprove = async (p: ProfessorDTO) => {
    try {
      setActionLoading(true);
      await api.put(`/auth/users/professors/${p.id}/approve`);
      await load();
    } catch { setError('Erro ao aprovar professor.'); }
    finally { setActionLoading(false); }
  };

  const openReject = (p: ProfessorDTO) => {
    setRejectTarget(p); setRejectReason(''); setRejectOpen(true);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      setActionLoading(true);
      await api.put(`/auth/users/professors/${rejectTarget.id}/reject`, { reason: rejectReason });
      setRejectOpen(false); await load();
    } catch { setError('Erro ao rejeitar professor.'); }
    finally { setActionLoading(false); }
  };

  const openImport = () => {
    setImportFile(null); setImportResult(null); setImportOpen(true);
  };

  const handleImport = async () => {
    if (!importFile) return;
    const form = new FormData();
    form.append('file', importFile);
    try {
      setImportLoading(true);
      const res = await api.post<ImportResult>('/auth/users/professors/bulk-import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(res.data);
      if (res.data.imported > 0) await load();
    } catch { setError('Erro ao importar ficheiro.'); }
    finally { setImportLoading(false); }
  };

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/auth/users/professors/import-template', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = 'modelo_professores.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Erro ao descarregar modelo.'); }
  };

  const tabLabels = ['Todos', 'Pendentes', 'Aprovados', 'Rejeitados'];
  const tabCounts = [byStatus.all.length, byStatus.pending.length, byStatus.approved.length, byStatus.rejected.length];

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {byStatus.pending.length > 0 && (
            <Chip
              icon={<PendingIcon sx={{ fontSize: '15px !important', color: '#fbbf24 !important' }} />}
              label={`${byStatus.pending.length} pendente${byStatus.pending.length !== 1 ? 's' : ''}`}
              size="small"
              sx={{ bgcolor: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', fontWeight: 700 }}
            />
          )}
          {!loading && (
            <Chip label={`${professors.length} total`} size="small"
              sx={{ bgcolor: 'rgba(96,165,250,0.2)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.3)' }} />
          )}
          <Button
            startIcon={<UploadIcon sx={{ fontSize: '16px !important' }} />}
            onClick={openImport}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)',
              textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 2,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            Importar
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Tabs + Search */}
      <Box sx={{ ...glass, borderRadius: 3, mb: 2.5, overflow: 'hidden' }}>
        <Tabs
          value={tabIndex} onChange={(_, v) => setTabIndex(v)}
          sx={{ px: 2, borderBottom: '1px solid rgba(0,0,0,0.06)',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 44, fontSize: '0.85rem' },
            '& .Mui-selected': { color: ACCENT },
            '& .MuiTabs-indicator': { backgroundColor: ACCENT },
          }}>
          {tabLabels.map((label, i) => (
            <Tab key={label} label={
              <Badge badgeContent={i === 1 && tabCounts[1] > 0 ? tabCounts[1] : 0}
                color="warning" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 16, height: 16 } }}>
                <span style={{ paddingRight: i === 1 && tabCounts[1] > 0 ? 8 : 0 }}>{label}</span>
              </Badge>
            } />
          ))}
        </Tabs>
        <Box sx={{ p: 2 }}>
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
                  {['Cód. Professor', 'Professor', 'Telefone', 'Email', 'Escola', 'Departamento', 'Especialização', 'Online', 'Aprovação', 'Ações'].map(h => (
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
                    <TableCell>
                      <Chip label={p.online ? 'Online' : 'Offline'} size="small"
                        color={p.online ? 'success' : 'default'} variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={p.rejectionReason ? `Motivo: ${p.rejectionReason}` : ''} placement="top">
                        <span><ApprovalChip status={p.approvalStatus} /></span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <Tooltip title="Editar perfil">
                          <IconButton size="small" onClick={() => openEdit(p)} sx={{ color: ACCENT, '&:hover': { bgcolor: 'rgba(21,101,192,0.08)' } }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {(!p.approvalStatus || p.approvalStatus === 'PENDING' || p.approvalStatus === 'REJECTED') && (
                          <Tooltip title="Aprovar">
                            <span>
                              <IconButton size="small" disabled={actionLoading} onClick={() => handleApprove(p)}
                                sx={{ color: '#00a651', '&:hover': { bgcolor: 'rgba(0,166,81,0.08)' } }}>
                                <ApproveIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        {(!p.approvalStatus || p.approvalStatus === 'PENDING' || p.approvalStatus === 'APPROVED') && (
                          <Tooltip title="Rejeitar">
                            <span>
                              <IconButton size="small" disabled={actionLoading} onClick={() => openReject(p)}
                                sx={{ color: '#c62828', '&:hover': { bgcolor: 'rgba(198,40,40,0.08)' } }}>
                                <RejectIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
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
            <FormControl size="small" fullWidth sx={inputSx}>
              <InputLabel>Ciclo de Ensino</InputLabel>
              <Select label="Ciclo de Ensino" value={editForm.teachingCycle}
                onChange={e => setEditForm(p => ({ ...p, teachingCycle: String(e.target.value) }))}>
                <MenuItem value=""><em>— Não definido —</em></MenuItem>
                <MenuItem value="BASICO">Básico (8ª–10ª Classe)</MenuItem>
                <MenuItem value="MEDIO">Médio (11ª–12ª Classe)</MenuItem>
                <MenuItem value="AMBOS">Ambos os ciclos</MenuItem>
              </Select>
            </FormControl>
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

      {/* Import Dialog */}
      <Dialog open={importOpen} onClose={() => !importLoading && setImportOpen(false)} maxWidth="md" fullWidth
        slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } }, paper: { sx: { ...glass, background: 'rgba(255,255,255,0.97)', borderRadius: 4, overflow: 'hidden' } } }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg,#0A1628 0%,#1565c0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <UploadIcon sx={{ color: '#93c5fd' }} />
              <Typography variant="h6" color="white" fontWeight={700}>Importar Professores</Typography>
            </Box>
            <IconButton onClick={() => setImportOpen(false)} disabled={importLoading} size="small"
              sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          {!importResult ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Instructions */}
              <Box sx={{ bgcolor: 'rgba(21,101,192,0.06)', border: '1px solid rgba(21,101,192,0.18)', borderRadius: 2, p: 2 }}>
                <Typography variant="body2" fontWeight={700} color={ACCENT} sx={{ mb: 0.8 }}>Formato esperado (CSV com ponto-e-vírgula ou Excel .xlsx)</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block', mb: 1 }}>
                  nTelefone ; email ; nomeCompleto ; departamento ; especializacao ; contactoInstitucional ; idEscola
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  A coluna <strong>idEscola</strong> é opcional se for Administrador de Escola.
                  A password inicial gerada é <strong>SAE@{new Date().getFullYear()}</strong> — o professor pode alterá-la após o primeiro login.
                </Typography>
              </Box>

              {/* Template download */}
              <Button
                startIcon={<DownloadIcon />} onClick={downloadTemplate} variant="outlined" size="small"
                sx={{ alignSelf: 'flex-start', textTransform: 'none', borderColor: ACCENT, color: ACCENT, borderRadius: '8px',
                  '&:hover': { bgcolor: 'rgba(21,101,192,0.06)' } }}
              >
                Descarregar Modelo CSV
              </Button>

              {/* Drop zone */}
              <Box
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setImportFile(f); }}
                sx={{
                  border: `2px dashed ${importFile ? ACCENT : 'rgba(0,0,0,0.18)'}`,
                  borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer',
                  bgcolor: importFile ? 'rgba(21,101,192,0.04)' : 'rgba(248,250,252,0.8)',
                  transition: 'all .2s',
                  '&:hover': { borderColor: ACCENT, bgcolor: 'rgba(21,101,192,0.04)' },
                }}
              >
                {importFile ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                    <FileIcon sx={{ color: ACCENT, fontSize: 32 }} />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="body2" fontWeight={700} color={ACCENT}>{importFile.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{(importFile.size / 1024).toFixed(1)} KB</Typography>
                    </Box>
                    <IconButton size="small" onClick={e => { e.stopPropagation(); setImportFile(null); }}
                      sx={{ ml: 1, color: 'text.secondary' }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <UploadIcon sx={{ fontSize: 40, color: 'rgba(0,0,0,0.18)', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Arraste o ficheiro aqui ou <strong style={{ color: ACCENT }}>clique para selecionar</strong>
                    </Typography>
                    <Typography variant="caption" color="text.disabled">CSV, XLSX ou XLS</Typography>
                  </>
                )}
              </Box>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" hidden
                onChange={e => { const f = e.target.files?.[0]; if (f) setImportFile(f); }} />

              {importLoading && <LinearProgress sx={{ borderRadius: 1 }} />}
            </Box>
          ) : (
            /* Results */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1, bgcolor: 'rgba(0,166,81,0.08)', border: '1px solid rgba(0,166,81,0.25)', borderRadius: 2, p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={800} color="#00a651">{importResult.imported}</Typography>
                  <Typography variant="caption" color="text.secondary">Importados</Typography>
                </Box>
                <Box sx={{ flex: 1, bgcolor: importResult.failed > 0 ? 'rgba(198,40,40,0.08)' : 'rgba(248,250,252,0.8)',
                  border: `1px solid ${importResult.failed > 0 ? 'rgba(198,40,40,0.25)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 2, p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={800} color={importResult.failed > 0 ? '#c62828' : 'text.secondary'}>{importResult.failed}</Typography>
                  <Typography variant="caption" color="text.secondary">Com erros</Typography>
                </Box>
                <Box sx={{ flex: 1, bgcolor: 'rgba(248,250,252,0.8)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2, p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={800} color="text.primary">{importResult.totalRows}</Typography>
                  <Typography variant="caption" color="text.secondary">Total de linhas</Typography>
                </Box>
              </Box>

              {importResult.rows.length > 0 && (
                <Box sx={{ maxHeight: 320, overflow: 'auto', borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ background: 'rgba(0,0,0,0.025)' }}>
                        {['Linha', 'Telefone', 'Nome', 'Resultado'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importResult.rows.map(r => (
                        <TableRow key={r.row} sx={{ bgcolor: r.success ? 'rgba(0,166,81,0.03)' : 'rgba(198,40,40,0.04)' }}>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>{r.row}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{r.nTelefone || '—'}</TableCell>
                          <TableCell sx={{ fontSize: '0.83rem' }}>{r.fullname || '—'}</TableCell>
                          <TableCell>
                            {r.success ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <OkIcon sx={{ fontSize: 16, color: '#00a651' }} />
                                <Typography variant="caption" color="#00a651" fontWeight={600}>Criado</Typography>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ErrIcon sx={{ fontSize: 16, color: '#c62828' }} />
                                <Typography variant="caption" color="#c62828">{r.error}</Typography>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <Box sx={{ px: 3, pb: 3, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={() => setImportOpen(false)} disabled={importLoading}
            sx={{ textTransform: 'none', color: 'text.secondary', borderRadius: '10px', px: 2.5, border: '1px solid rgba(0,0,0,0.1)' }}>
            {importResult ? 'Fechar' : 'Cancelar'}
          </Button>
          {!importResult && (
            <Button variant="contained" onClick={handleImport} disabled={!importFile || importLoading}
              sx={{ background: 'linear-gradient(135deg,#1565c0 0%,#1e88e5 100%)', textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3, minWidth: 130 }}>
              {importLoading ? <><CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />A importar…</> : 'Importar Professores'}
            </Button>
          )}
        </Box>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="xs" fullWidth
        slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } }, paper: { sx: { ...glass, background: 'rgba(255,255,255,0.97)', borderRadius: 4, overflow: 'hidden' } } }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5, background: 'linear-gradient(135deg,#7f1d1d 0%,#c62828 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <RejectIcon sx={{ color: '#fca5a5' }} />
              <Typography variant="h6" color="white" fontWeight={700}>Rejeitar Professor</Typography>
            </Box>
            <IconButton onClick={() => setRejectOpen(false)} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Indique o motivo da rejeição de <strong>{rejectTarget?.fullName}</strong>. Este motivo será registado no perfil.
          </Typography>
          <TextField
            label="Motivo da rejeição" multiline rows={3} size="small" fullWidth
            value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="Ex: Documentação incompleta, número de BI inválido…"
            sx={inputSx}
          />
        </DialogContent>
        <Box sx={{ px: 3, pb: 3, pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={() => setRejectOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary', borderRadius: '10px', px: 2.5, border: '1px solid rgba(0,0,0,0.1)' }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleReject} disabled={actionLoading}
            sx={{ background: 'linear-gradient(135deg,#c62828 0%,#ef5350 100%)', textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3, minWidth: 110 }}>
            {actionLoading ? <CircularProgress size={18} color="inherit" /> : 'Rejeitar'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ProfessorsPage;
