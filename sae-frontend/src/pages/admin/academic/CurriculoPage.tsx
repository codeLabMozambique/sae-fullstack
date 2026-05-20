import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, Alert, CircularProgress, Tooltip, Avatar,
  Select, MenuItem, FormControl, InputLabel, Divider,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon,
  MenuBook as CurriculoIcon, Close as CloseIcon,
  FilterList as FilterIcon, Info as InfoIcon,
  CheckCircle as CheckIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import {
  curriculumService, classLevelService, academicGroupService, subjectService, schoolService,
  type CurriculumEntryDTO, type ClassLevelDTO, type AcademicGroupDTO, type SubjectDTO, type SchoolDTO,
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

const selectSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: 'rgba(248,250,252,0.8)',
    '&:hover fieldset': { borderColor: ACCENT },
    '&.Mui-focused fieldset': { borderColor: ACCENT, borderWidth: 2 },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: ACCENT },
} as const;

const CurriculoPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const isSchoolAdmin = authUser?.role === 'Administrador de Escola' || authUser?.role === 'SCHOOL_ADMIN';

  // dados de referência
  const [schools,  setSchools]  = useState<SchoolDTO[]>([]);
  const [levels,   setLevels]   = useState<ClassLevelDTO[]>([]);
  const [groups,   setGroups]   = useState<AcademicGroupDTO[]>([]);
  const [catalog,  setCatalog]  = useState<SubjectDTO[]>([]);

  // selecção activa
  const [selSchool, setSelSchool] = useState<number | ''>('');
  const [selLevel,  setSelLevel]  = useState<number | ''>('');
  const [selGroup,  setSelGroup]  = useState<number | ''>('');

  // currículo carregado
  const [entries,  setEntries]  = useState<CurriculumEntryDTO[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // diálogo adicionar
  const [addOpen,      setAddOpen]      = useState(false);
  const [addSubjectId, setAddSubjectId] = useState<number | ''>('');
  const [adding,       setAdding]       = useState(false);

  const selectedLevel = levels.find(l => l.id === selLevel);
  const isMedio = selectedLevel?.cycle === 'MEDIO';

  // grupos filtrados pela escola seleccionada
  const schoolGroups = useMemo(
    () => selSchool !== '' ? groups.filter(g => g.schoolId === (selSchool as number)) : [],
    [groups, selSchool],
  );

  // disciplinas ainda não atribuídas ao currículo actual
  const assignedIds = useMemo(() => new Set(entries.map(e => e.subjectId)), [entries]);
  const available   = useMemo(() => catalog.filter(s => !assignedIds.has(s.id!)), [catalog, assignedIds]);

  // carregamento inicial
  useEffect(() => {
    const init = async () => {
      try {
        const [scls, lvls, grps, subjs] = await Promise.all([
          schoolService.findAll(),
          classLevelService.findAll(),
          academicGroupService.findAll(),
          subjectService.findAll(),
        ]);
        setSchools(scls);
        setLevels(lvls);
        setGroups(grps);
        setCatalog(subjs);

        if (isSchoolAdmin) {
          const res = await api.get<{ schoolId: number }>('/auth/users/school-admin-profile');
          setSelSchool(res.data.schoolId);
        }
      } catch { setError('Erro ao carregar dados de referência.'); }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // carrega currículo quando escola + nível (+ grupo se médio) estão seleccionados
  useEffect(() => {
    if (selSchool === '' || !selLevel) { setEntries([]); return; }
    if (isMedio && selGroup === '') { setEntries([]); return; }
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const gid = (isMedio && selGroup !== '') ? (selGroup as number) : undefined;
        setEntries(await curriculumService.findByLevelAndGroup(selSchool as number, selLevel as number, gid));
      } catch { setError('Erro ao carregar currículo.'); }
      finally { setLoading(false); }
    };
    load();
  }, [selSchool, selLevel, selGroup, isMedio]);

  // reset cascata ao mudar escola
  const handleSchoolChange = (id: number | '') => {
    setSelSchool(id);
    setSelLevel('');
    setSelGroup('');
    setEntries([]);
  };

  // reset grupo ao mudar nível
  const handleLevelChange = (id: number | '') => {
    setSelLevel(id);
    setSelGroup('');
    setEntries([]);
  };

  const handleRemove = async (entryId: number) => {
    if (!window.confirm('Remover esta disciplina do currículo?')) return;
    try {
      setError(null);
      await curriculumService.removeEntry(entryId);
      setEntries(prev => prev.filter(e => e.id !== entryId));
    } catch { setError('Erro ao remover disciplina do currículo.'); }
  };

  const handleAdd = async () => {
    if (!addSubjectId || !selLevel || selSchool === '') return;
    setAdding(true); setError(null);
    try {
      const gid = (isMedio && selGroup !== '') ? (selGroup as number) : undefined;
      const entry = await curriculumService.addEntry(selSchool as number, selLevel as number, addSubjectId as number, gid);
      setEntries(prev => [...prev, entry]);
      setAddOpen(false); setAddSubjectId('');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: string } })?.response?.data;
      setError(msg ?? 'Erro ao adicionar disciplina.');
    } finally { setAdding(false); }
  };

  const groupName = (id: number) => groups.find(g => g.id === id)?.name ?? '—';
  const schoolName = schools.find(s => s.id === selSchool)?.name ?? '';

  const contextLabel = useMemo(() => {
    if (!selLevel || selSchool === '') return null;
    const lvlName = selectedLevel?.name ?? '';
    if (!isMedio) return `${schoolName} · ${lvlName} — comum a todos`;
    if (selGroup === '') return null;
    return `${schoolName} · ${lvlName} — ${groupName(selGroup as number)}`;
  }, [selSchool, selLevel, selGroup, isMedio, selectedLevel, schools, groups]); // eslint-disable-line react-hooks/exhaustive-deps

  const canView = selSchool !== '' && selLevel !== '' && (!isMedio || selGroup !== '');

  return (
    <Box sx={{ minHeight: '100%', background: 'linear-gradient(160deg,#f0fdf4 0%,#f8fafc 50%,#f0fdf4 100%)', p: 3, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle,rgba(0,166,81,.07) 0%,transparent 65%)`, pointerEvents: 'none', zIndex: 0 }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} color="#0A1628">Currículo</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Gerir disciplinas por escola, nível e grupo académico</Typography>
          </Box>
          {canView && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setAddSubjectId(''); setAddOpen(true); }}
              disabled={available.length === 0}
              sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' }, '&:disabled': { bgcolor: '#ccc' }, borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}>
              Adicionar Disciplina
            </Button>
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, ...glass }} onClose={() => setError(null)}>{error}</Alert>}

        {/* ── Filtros ── */}
        <Box sx={{ ...glass, borderRadius: 3, p: 2.5, mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterIcon sx={{ color: ACCENT, fontSize: 20 }} />
            <Typography variant="subtitle2" color={PRIMARY} fontWeight={700}>Seleccionar escola, nível e grupo</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>

            {/* Escola */}
            <FormControl size="small" sx={{ minWidth: 240, ...selectSx }} disabled={isSchoolAdmin}>
              <InputLabel>Escola *</InputLabel>
              <Select value={selSchool} label="Escola *"
                onChange={e => handleSchoolChange(e.target.value as number | '')}>
                <MenuItem value=""><em>Seleccionar escola…</em></MenuItem>
                {schools.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon sx={{ fontSize: 16, color: ACCENT }} />
                      {s.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selSchool !== '' && (
              <>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                {/* Nível */}
                <FormControl size="small" sx={{ minWidth: 200, ...selectSx }}>
                  <InputLabel>Nível de Ensino *</InputLabel>
                  <Select value={selLevel} label="Nível de Ensino *"
                    onChange={e => handleLevelChange(e.target.value as number | '')}>
                    <MenuItem value=""><em>Seleccionar…</em></MenuItem>
                    {levels.map(l => (
                      <MenuItem key={l.id} value={l.id}>
                        {l.name}
                        {l.cycle && (
                          <Chip label={l.cycle === 'MEDIO' ? 'Médio' : 'Básico'} size="small"
                            sx={{ ml: 1, height: 18, fontSize: '0.62rem', bgcolor: l.cycle === 'MEDIO' ? 'rgba(0,166,81,0.1)' : 'rgba(10,22,40,0.07)', color: l.cycle === 'MEDIO' ? ACCENT : PRIMARY }} />
                        )}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Grupo (só ciclo médio) */}
                {isMedio && (
                  <>
                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                    <FormControl size="small" sx={{ minWidth: 260, ...selectSx }}>
                      <InputLabel>Grupo Académico *</InputLabel>
                      <Select value={selGroup} label="Grupo Académico *"
                        onChange={e => setSelGroup(e.target.value as number | '')}>
                        <MenuItem value=""><em>Seleccionar grupo…</em></MenuItem>
                        {schoolGroups.map(g => (
                          <MenuItem key={g.id} value={g.id}>
                            {g.name}{g.code ? ` (${g.code})` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                )}
              </>
            )}

            {contextLabel && (
              <Chip icon={<CheckIcon sx={{ fontSize: '14px !important' }} />} label={contextLabel} size="small"
                sx={{ alignSelf: 'center', bgcolor: `rgba(0,166,81,0.1)`, color: ACCENT, border: `1px solid rgba(0,166,81,0.25)`, fontWeight: 600, px: 0.5 }} />
            )}
          </Box>

          {isMedio && selGroup === '' && selLevel !== '' && (
            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                O ciclo médio (11ª/12ª) usa grupos académicos. Seleccione o grupo para ver o currículo.
              </Typography>
            </Box>
          )}
        </Box>

        {/* ── Tabela ── */}
        {canView && (
          <Box sx={{ ...glass, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, background: 'rgba(248,250,252,0.8)', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 0.8, borderRadius: 1.5, background: `rgba(0,166,81,0.1)`, border: `1px solid rgba(0,166,81,0.2)`, display: 'flex' }}>
                <CurriculoIcon sx={{ color: ACCENT, fontSize: 20 }} />
              </Box>
              <Typography variant="h6" color={PRIMARY} sx={{ flex: 1 }}>
                Disciplinas atribuídas
                {contextLabel && <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>— {contextLabel}</Typography>}
              </Typography>
              {!loading && (
                <Chip label={`${entries.length} disciplina${entries.length !== 1 ? 's' : ''}`} size="small"
                  sx={{ bgcolor: `rgba(0,166,81,0.1)`, color: ACCENT, border: `1px solid rgba(0,166,81,0.2)` }} />
              )}
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: ACCENT }} />
              </Box>
            ) : (
              <TableContainer sx={{ background: 'transparent' }}>
                <Table sx={{ minWidth: 500 }}>
                  <TableHead>
                    <TableRow sx={{ background: 'rgba(0,0,0,0.025)' }}>
                      {['Disciplina', 'Código', 'Grupo', 'Acção'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.7, py: 1.5 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ border: 'none' }}>
                          <Box sx={{ textAlign: 'center', py: 8 }}>
                            <CurriculoIcon sx={{ fontSize: 52, color: 'rgba(0,0,0,0.08)', mb: 1.5 }} />
                            <Typography color="text.secondary" fontWeight={500}>Nenhuma disciplina no currículo</Typography>
                            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                              Clique em "Adicionar Disciplina" para começar
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : entries.map(row => (
                      <TableRow key={row.id} sx={{ '&:hover': { background: `rgba(0,166,81,0.025)` } }}>
                        <TableCell sx={{ py: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: `rgba(0,166,81,0.1)`, color: ACCENT, fontSize: '0.7rem', fontWeight: 800 }}>
                              {(row.subjectCode ?? row.subjectName ?? '?').slice(0, 3).toUpperCase()}
                            </Avatar>
                            <Typography fontWeight={600} color={PRIMARY} variant="body2">{row.subjectName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {row.subjectCode
                            ? <Chip label={row.subjectCode} size="small" sx={{ bgcolor: `rgba(0,166,81,0.08)`, color: ACCENT, border: `1px solid rgba(0,166,81,0.2)`, fontWeight: 700, fontSize: '0.7rem' }} />
                            : <Typography variant="body2" color="text.disabled">—</Typography>}
                        </TableCell>
                        <TableCell>
                          {row.academicGroupName
                            ? <Chip label={row.academicGroupName} size="small" sx={{ bgcolor: 'rgba(10,22,40,0.07)', color: PRIMARY, border: '1px solid rgba(10,22,40,0.15)', fontSize: '0.68rem' }} />
                            : <Chip label="Comum" size="small" sx={{ bgcolor: 'rgba(0,0,0,0.04)', color: 'text.secondary', fontSize: '0.68rem' }} />}
                        </TableCell>
                        <TableCell sx={{ py: 1 }}>
                          <Tooltip title="Remover do currículo" placement="top">
                            <IconButton size="small" onClick={() => row.id !== undefined && handleRemove(row.id)}
                              sx={{ color: '#ef5350', '&:hover': { bgcolor: 'rgba(239,83,80,0.08)' } }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* estado inicial — sem escola seleccionada */}
        {!canView && selSchool === '' && (
          <Box sx={{ ...glass, borderRadius: 3, py: 10, textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 64, color: 'rgba(0,0,0,0.07)', mb: 2 }} />
            <Typography color="text.secondary" fontWeight={500} variant="h6">Seleccione uma escola para começar</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              Cada escola tem o seu próprio currículo por nível e grupo académico
            </Typography>
          </Box>
        )}

        {/* escola seleccionada mas sem nível */}
        {!canView && selSchool !== '' && !selLevel && (
          <Box sx={{ ...glass, borderRadius: 3, py: 10, textAlign: 'center' }}>
            <CurriculoIcon sx={{ fontSize: 64, color: 'rgba(0,0,0,0.07)', mb: 2 }} />
            <Typography color="text.secondary" fontWeight={500} variant="h6">Seleccione um nível de ensino</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              Ciclo básico (8ª-10ª): disciplinas comuns · Ciclo médio (11ª-12ª): por grupo académico
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Diálogo — Adicionar disciplina ── */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth
        slotProps={{
          backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } },
          paper: { sx: { ...glass, background: 'rgba(255,255,255,0.97)', borderRadius: 4, overflow: 'hidden' } },
        }}>
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5, background: `linear-gradient(135deg,${PRIMARY} 0%,${ACCENT} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AddIcon sx={{ color: 'white' }} />
              <Typography variant="h6" color="white">Adicionar Disciplina</Typography>
            </Box>
            <IconButton size="small" onClick={() => setAddOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 2 }}>
          {contextLabel && (
            <Box sx={{ mb: 2.5, p: 1.5, borderRadius: 2, bgcolor: `rgba(0,166,81,0.05)`, border: `1px solid rgba(0,166,81,0.15)` }}>
              <Typography variant="caption" color={ACCENT} fontWeight={600}>A adicionar a: {contextLabel}</Typography>
            </Box>
          )}

          {available.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckIcon sx={{ fontSize: 40, color: ACCENT, mb: 1 }} />
              <Typography color="text.secondary">Todas as disciplinas do catálogo já estão no currículo.</Typography>
            </Box>
          ) : (
            <FormControl fullWidth size="small" sx={selectSx}>
              <InputLabel>Disciplina</InputLabel>
              <Select value={addSubjectId} label="Disciplina"
                onChange={e => setAddSubjectId(e.target.value as number | '')}>
                <MenuItem value=""><em>Seleccionar…</em></MenuItem>
                {available.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {s.name}
                      {s.code && <Chip label={s.code} size="small" sx={{ height: 18, fontSize: '0.62rem', bgcolor: `rgba(0,166,81,0.08)`, color: ACCENT }} />}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>

        {available.length > 0 && (
          <Box sx={{ px: 3, pb: 3, pt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <Button onClick={() => setAddOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 500, borderRadius: '10px', px: 2.5, border: '1px solid rgba(0,0,0,0.1)', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', transform: 'none' } }}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleAdd} disabled={!addSubjectId || adding}
              sx={{ background: 'linear-gradient(135deg,#00A651 0%,#00c96a 100%)', '&:hover': { background: 'linear-gradient(135deg,#008f44 0%,#00a855 100%)' }, '&:disabled': { background: '#ccc' }, boxShadow: '0 4px 15px rgba(0,166,81,0.35)', borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3, minWidth: 110 }}>
              {adding ? <CircularProgress size={18} color="inherit" /> : 'Adicionar'}
            </Button>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default CurriculoPage;
