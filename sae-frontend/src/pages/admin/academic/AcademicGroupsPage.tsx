import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, TextField, Alert, CircularProgress, Tooltip,
  Avatar, InputAdornment, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Block as BlockIcon,
  AccountTree as GroupsIcon, Search as SearchIcon, Close as CloseIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import {
  academicGroupService, schoolService,
  type AcademicGroupDTO, type SchoolDTO,
} from '../../../services/academicService';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';

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
  '&:disabled': { background: '#ccc', boxShadow: 'none', transform: 'none' },
  boxShadow: '0 4px 15px rgba(0,166,81,0.35)',
  borderRadius: '10px', textTransform: 'none' as const, fontWeight: 700,
} as const;

const emptyForm = (schoolId: number): AcademicGroupDTO => ({ name: '', code: '', description: '', schoolId });

const AcademicGroupsPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const isSchoolAdmin = authUser?.role === 'Administrador de Escola';
  const [schoolAdminSchoolId, setSchoolAdminSchoolId] = useState<number | null>(null);

  const [groups, setGroups]             = useState<AcademicGroupDTO[]>([]);
  const [schools, setSchools]           = useState<SchoolDTO[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editing, setEditing]           = useState<AcademicGroupDTO | null>(null);
  const [form, setForm]                 = useState<AcademicGroupDTO>(emptyForm(0));
  const [submitting, setSubmitting]     = useState(false);
  const [search, setSearch]             = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [page, setPage]                 = useState(0);
  const [rowsPerPage, setRowsPerPage]   = useState(10);

  const load = async (sid?: number) => {
    try {
      setLoading(true); setError(null);
      const effectiveSid = sid ?? schoolAdminSchoolId;
      const grps = (isSchoolAdmin && effectiveSid)
        ? await academicGroupService.findBySchool(effectiveSid)
        : await academicGroupService.findAll();
      setGroups(grps);
    } catch { setError('Erro ao carregar grupos. Verifique a ligação ao servidor.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true); setError(null);
        const sch = await schoolService.findAll();
        setSchools(sch);
        if (isSchoolAdmin) {
          const res = await api.get<{ schoolId: number }>('/auth/users/school-admin-profile');
          const sid = res.data.schoolId;
          setSchoolAdminSchoolId(sid);
          setGroups(await academicGroupService.findBySchool(sid));
        } else {
          setGroups(await academicGroupService.findAll());
        }
      } catch { setError('Erro ao carregar dados. Verifique a ligação ao servidor.'); }
      finally { setLoading(false); }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => groups.filter(g => {
    const q = search.toLowerCase();
    const schName = schools.find(s => s.id === g.schoolId)?.name ?? '';
    const hit = !q || g.name.toLowerCase().includes(q) || (g.code ?? '').toLowerCase().includes(q) || schName.toLowerCase().includes(q);
    return hit && (!schoolFilter || String(g.schoolId) === schoolFilter);
  }), [groups, schools, search, schoolFilter]);

  useEffect(() => { setPage(0); }, [search, schoolFilter]);

  const openCreate = () => {
    setEditing(null);
    const sid = isSchoolAdmin && schoolAdminSchoolId ? schoolAdminSchoolId : 0;
    setForm(emptyForm(sid));
    setDialogOpen(true);
  };
  const openEdit    = (g: AcademicGroupDTO) => { setEditing(g); setForm({ ...g }); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyForm(0)); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('O nome do grupo é obrigatório.'); return; }
    if (!form.schoolId)    { setError('Seleccione a escola.'); return; }
    try {
      setSubmitting(true); setError(null);
      editing?.id
        ? await academicGroupService.update({ ...form, id: editing.id })
        : await academicGroupService.save(form);
      closeDialog(); await load();
    } catch { setError('Erro ao salvar grupo.'); }
    finally { setSubmitting(false); }
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Desativar este grupo académico?')) return;
    try { setError(null); await academicGroupService.deactivate(id); await load(); }
    catch { setError('Erro ao desativar grupo.'); }
  };

  const schoolName = (id: number) => schools.find(s => s.id === id)?.name ?? '—';
  const hasFilters = !!(search || schoolFilter);
  const clearFilters = () => { setSearch(''); setSchoolFilter(''); };

  return (
    <Box sx={{ minHeight: '100%', background: 'linear-gradient(160deg,#f0fdf4 0%,#f8fafc 50%,#f0fdf4 100%)', p: 3, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,166,81,.07) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: -80, left: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,166,81,.05) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `linear-gradient(135deg,${PRIMARY} 0%,${ACCENT} 100%)`, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, p: 2.5, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.2, borderRadius: 2, background: 'rgba(0,166,81,0.2)', border: '1px solid rgba(0,166,81,0.3)', display: 'flex' }}>
              <GroupsIcon sx={{ color: 'white', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" color="white" sx={{ lineHeight: 1.2 }}>Grupos Académicos</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.3 }}>Grupos do ciclo médio por escola (11ª/12ª Classe)</Typography>
            </Box>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ ...gradBtn, px: 3 }}>
            Novo Grupo
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, ...glass }} onClose={() => setError(null)}>{error}</Alert>}

        {/* ── Filters ── */}
        <Box sx={{ ...glass, borderRadius: 3, p: 2, mb: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <TextField
            size="small" placeholder="Pesquisar por nome ou código…"
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
            <FormControl size="small" sx={{ minWidth: 180, ...inputSx }}>
              <InputLabel>Escola</InputLabel>
              <Select value={schoolFilter} label="Escola" onChange={e => setSchoolFilter(e.target.value as string)}>
                <MenuItem value="">Todas</MenuItem>
                {schools.map(s => <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          {hasFilters && (
            <Button size="small" onClick={clearFilters} sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.8rem' }}>
              Limpar
            </Button>
          )}
          <Chip label={`${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`} size="small"
            sx={{ bgcolor: `rgba(0,166,81,0.1)`, color: ACCENT, ml: 'auto', border: `1px solid rgba(0,166,81,0.25)` }} />
        </Box>

        {/* ── Table ── */}
        <Box sx={{ ...glass, borderRadius: 3, overflow: 'hidden' }} className="animate-fade-in">
          <Box sx={{ px: 3, py: 2, background: 'rgba(248,250,252,0.8)', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 0.8, borderRadius: 1.5, background: `rgba(0,166,81,0.1)`, border: `1px solid rgba(0,166,81,0.2)`, display: 'flex' }}>
              <GroupsIcon sx={{ color: ACCENT, fontSize: 20 }} />
            </Box>
            <Typography variant="h6" color={PRIMARY} sx={{ flex: 1 }}>Lista de Grupos</Typography>
            {!loading && (
              <Chip label={`${groups.length} registo${groups.length !== 1 ? 's' : ''}`} size="small"
                sx={{ bgcolor: `rgba(0,166,81,0.1)`, color: ACCENT, border: `1px solid rgba(0,166,81,0.2)` }} />
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, background: 'rgba(255,255,255,0.5)' }}>
              <CircularProgress sx={{ color: ACCENT }} />
            </Box>
          ) : (
            <>
            <TableContainer sx={{ background: 'transparent' }}>
              <Table sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(0,0,0,0.025)' }}>
                    {['Grupo', 'Código', 'Escola', 'Descrição', 'Ações'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.7, py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ border: 'none', py: 0 }}>
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <GroupsIcon sx={{ fontSize: 52, color: 'rgba(0,0,0,0.08)', mb: 1.5 }} />
                          <Typography color="text.secondary" fontWeight={500}>Nenhum grupo encontrado</Typography>
                          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                            {hasFilters ? 'Tente ajustar os filtros' : 'Crie o primeiro grupo clicando em "Novo Grupo"'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(row => (
                    <TableRow key={row.id} sx={{ transition: 'background .15s', '&:hover': { background: `rgba(0,166,81,0.025)` } }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: `rgba(0,166,81,0.12)`, color: ACCENT, fontSize: '0.72rem', fontWeight: 800 }}>
                            {(row.code ?? row.name).slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Typography fontWeight={600} color={PRIMARY} variant="body2">{row.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {row.code
                          ? <Chip label={row.code} size="small" sx={{ bgcolor: `rgba(0,166,81,0.08)`, color: ACCENT, border: `1px solid rgba(0,166,81,0.2)`, fontWeight: 700 }} />
                          : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell sx={{ color: '#475569' }}>
                        <Typography variant="body2">{schoolName(row.schoolId)}</Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#64748b', maxWidth: 260 }}>
                        <Typography variant="body2" noWrap>{row.description || '—'}</Typography>
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
                  ))}
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
          <Box sx={{ px: 3, py: 2.5, background: `linear-gradient(135deg,${PRIMARY} 0%,${ACCENT} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <GroupsIcon sx={{ color: 'white' }} />
              <Typography variant="h6" color="white">{editing ? 'Editar Grupo' : 'Novo Grupo Académico'}</Typography>
            </Box>
            <IconButton onClick={closeDialog} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField label="Nome do Grupo *" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Ex: Grupo A — Letras com Matemática" fullWidth size="small" autoFocus sx={inputSx} />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Código" value={form.code ?? ''}
              onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
              placeholder="Ex: A, GEO-A" fullWidth size="small" sx={inputSx} />

            <FormControl fullWidth size="small" sx={inputSx} disabled={isSchoolAdmin}>
              <InputLabel>Escola *</InputLabel>
              <Select value={form.schoolId || ''} label="Escola *"
                onChange={e => setForm(p => ({ ...p, schoolId: Number(e.target.value) }))}>
                {schools.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          <TextField label="Descrição" value={form.description ?? ''}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Descrição opcional (disciplinas específicas, etc.)"
            fullWidth size="small" multiline rows={2} sx={inputSx} />

          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `rgba(0,166,81,0.05)`, border: `1px solid rgba(0,166,81,0.15)` }}>
            <Typography variant="caption" color={ACCENT}>
              Os grupos académicos aplicam-se ao <strong>ciclo médio (11ª e 12ª Classe)</strong>. Cada escola define os seus próprios grupos.
            </Typography>
          </Box>
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

export default AcademicGroupsPage;
