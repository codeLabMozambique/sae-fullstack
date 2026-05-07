import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, TextField, Alert, CircularProgress, Tooltip,
  Avatar, InputAdornment, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Block as BlockIcon,
  School as SchoolIcon, Search as SearchIcon, Close as CloseIcon,
  FilterList as FilterIcon, LocationCity as CityIcon,
} from '@mui/icons-material';
import { schoolService, type SchoolDTO } from '../../../services/academicService';

/* ─── Design tokens ─────────────────────────────────────────── */
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
  background: 'linear-gradient(135deg, #00A651 0%, #00c96a 100%)',
  '&:hover': { background: 'linear-gradient(135deg, #008f44 0%, #00a855 100%)', boxShadow: '0 6px 20px rgba(0,166,81,0.45)' },
  '&:disabled': { background: '#ccc', boxShadow: 'none', transform: 'none' },
  boxShadow: '0 4px 15px rgba(0,166,81,0.35)',
  borderRadius: '10px', textTransform: 'none' as const, fontWeight: 700,
} as const;

const emptyForm: SchoolDTO = { name: '', city: '', address: '', phone: '', email: '' };

/* ─── Component ─────────────────────────────────────────────── */
const SchoolsPage: React.FC = () => {
  const [schools, setSchools]       = useState<SchoolDTO[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<SchoolDTO | null>(null);
  const [form, setForm]             = useState<SchoolDTO>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch]         = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const load = async () => {
    try { setLoading(true); setError(null); setSchools(await schoolService.findAll()); }
    catch { setError('Erro ao carregar escolas. Verifique a ligação ao servidor.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const cities = useMemo(() =>
    [...new Set(schools.map(s => s.city).filter(Boolean))].sort(), [schools]);

  const filtered = useMemo(() => schools.filter(s => {
    const q = search.toLowerCase();
    const hit = !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)
      || (s.email ?? '').toLowerCase().includes(q) || (s.phone ?? '').includes(q);
    return hit && (!cityFilter || s.city === cityFilter);
  }), [schools, search, cityFilter]);

  const openCreate  = () => { setEditing(null);  setForm(emptyForm);  setDialogOpen(true); };
  const openEdit    = (r: SchoolDTO) => { setEditing(r); setForm({ ...r }); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(emptyForm); };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.city.trim()) { setError('Nome e cidade são obrigatórios.'); return; }
    try {
      setSubmitting(true); setError(null);
      editing?.id ? await schoolService.update({ ...form, id: editing.id }) : await schoolService.save(form);
      closeDialog(); await load();
    } catch { setError('Erro ao salvar escola.'); }
    finally { setSubmitting(false); }
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Desativar esta escola?')) return;
    try { setError(null); await schoolService.deactivate(id); await load(); }
    catch { setError('Erro ao desativar escola.'); }
  };

  const F = (key: keyof SchoolDTO, label: string, placeholder = '', required = false) => (
    <TextField label={required ? `${label} *` : label}
      value={(form[key] as string) ?? ''}
      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
      placeholder={placeholder} fullWidth size="small" sx={inputSx} />
  );

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <Box sx={{ minHeight: '100%', background: 'linear-gradient(160deg,#eef2ff 0%,#f8fafc 50%,#f0fdf4 100%)', p: 3, position: 'relative', overflow: 'hidden' }}>
      {/* Blobs */}
      <Box sx={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,166,81,.07) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: -80, left: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(21,101,192,.06) 0%,transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>

        {/* ── Page header banner ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,#0A1628 0%,#1565c0 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, p: 2.5, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.2, borderRadius: 2, background: 'rgba(0,166,81,0.15)', border: '1px solid rgba(0,166,81,0.25)', display: 'flex' }}>
              <SchoolIcon sx={{ color: '#4caf50', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" color="white" sx={{ lineHeight: 1.2 }}>Escolas</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.3 }}>Gestão de instituições de ensino</Typography>
            </Box>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ ...gradBtn, px: 3 }}>
            Nova Escola
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, ...glass }} onClose={() => setError(null)}>{error}</Alert>}

        {/* ── Search & Filters ── */}
        <Box sx={{ ...glass, borderRadius: 3, p: 2, mb: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <TextField
            size="small" placeholder="Pesquisar por nome, cidade, email, telefone…"
            value={search} onChange={e => setSearch(e.target.value)}
            slotProps={{ input: {
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}><CloseIcon sx={{ fontSize: 15 }} /></IconButton>
                </InputAdornment>
              ) : null,
            } }}
            sx={{ flex: 1, minWidth: 220, ...inputSx }}
          />
          <FormControl size="small" sx={{ minWidth: 150, ...inputSx }}>
            <InputLabel>Cidade</InputLabel>
            <Select value={cityFilter} label="Cidade" onChange={e => setCityFilter(e.target.value as string)}>
              <MenuItem value="">Todas as cidades</MenuItem>
              {cities.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          {(search || cityFilter) && (
            <Button size="small" onClick={() => { setSearch(''); setCityFilter(''); }}
              sx={{ color: 'text.secondary', textTransform: 'none', fontSize: '0.8rem' }}>
              Limpar filtros
            </Button>
          )}
          <Chip
            label={`${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
            size="small"
            sx={{ bgcolor: 'rgba(0,166,81,0.1)', color: ACCENT, ml: 'auto', border: '1px solid rgba(0,166,81,0.2)' }}
          />
        </Box>

        {/* ── Table card ── */}
        <Box sx={{ ...glass, borderRadius: 3, overflow: 'hidden' }} className="animate-fade-in">
          {/* card header */}
          <Box sx={{ px: 3, py: 2, background: 'linear-gradient(135deg,#0A1628 0%,#1e3a5f 100%)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 0.8, borderRadius: 1.5, background: 'rgba(0,166,81,0.15)', border: '1px solid rgba(0,166,81,0.2)', display: 'flex' }}>
              <SchoolIcon sx={{ color: '#4caf50', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" color="white" sx={{ flex: 1 }}>Lista de Escolas</Typography>
            {!loading && (
              <Chip label={`${schools.length} registo${schools.length !== 1 ? 's' : ''}`} size="small"
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
                    {['Nome', 'Cidade', 'Endereço', 'Telefone', 'Email', 'Ações'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.7, py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ border: 'none', py: 0 }}>
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                          <SchoolIcon sx={{ fontSize: 52, color: 'rgba(0,0,0,0.08)', mb: 1.5 }} />
                          <Typography color="text.secondary" fontWeight={500}>Nenhuma escola encontrada</Typography>
                          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                            {search || cityFilter ? 'Tente ajustar os filtros de pesquisa' : 'Crie a primeira escola clicando em "Nova Escola"'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(row => (
                    <TableRow key={row.id} sx={{ transition: 'background .15s', '&:hover': { background: 'rgba(0,166,81,0.035)' } }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(21,101,192,0.1)', color: '#1565c0', fontSize: '0.72rem', fontWeight: 800 }}>
                            {row.name.slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Typography fontWeight={600} color={PRIMARY} variant="body2">{row.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip icon={<CityIcon sx={{ fontSize: '14px !important', color: '#1565c0 !important' }} />}
                          label={row.city} size="small"
                          sx={{ bgcolor: 'rgba(21,101,192,0.08)', color: '#1565c0', border: '1px solid rgba(21,101,192,0.15)' }} />
                      </TableCell>
                      <TableCell sx={{ color: '#475569', maxWidth: 200 }}>
                        <Typography variant="body2" noWrap title={row.address}>{row.address || '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontFamily: 'monospace', fontSize: '0.82rem' }}>{row.phone || '—'}</TableCell>
                      <TableCell sx={{ color: '#475569' }}><Typography variant="body2">{row.email || '—'}</Typography></TableCell>
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
              <SchoolIcon sx={{ color: '#4caf50' }} />
              <Typography variant="h6" color="white">{editing ? 'Editar Escola' : 'Nova Escola'}</Typography>
            </Box>
            <IconButton onClick={closeDialog} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {F('name', 'Nome da Escola', 'Ex: Escola Secundária da Matola', true)}
          {F('city', 'Cidade', 'Ex: Maputo', true)}
          {F('address', 'Endereço', 'Ex: Av. Eduardo Mondlane, 123')}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {F('phone', 'Telefone', 'Ex: +258 21 000 000')}
            {F('email', 'Email', 'Ex: geral@escola.co.mz')}
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

export default SchoolsPage;
