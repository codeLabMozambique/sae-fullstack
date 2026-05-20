import { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, Chip, Avatar,
  IconButton, Tooltip, TextField, InputAdornment, Select,
  MenuItem, FormControl, InputLabel, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Switch, FormControlLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedIcon from '@mui/icons-material/Verified';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import { forumService } from '../../services/forumService';
import type { ProfessorCertificate } from '../../types/forum';

const DISC_LABELS: Record<string, string> = {
  MATEMATICA: 'Matemática', FISICA: 'Física', QUIMICA: 'Química',
  BIOLOGIA: 'Biologia', PORTUGUES: 'Português', HISTORIA: 'História',
  GEOGRAFIA: 'Geografia', INGLES: 'Inglês', FILOSOFIA: 'Filosofia',
  INFORMATICA: 'Informática', PROGRAMACAO: 'Programação',
  ECONOMIA: 'Economia', GERAL: 'Geral',
};

function initials(name: string) {
  return name.split(/[\s_]/).map(p => p[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminCertificatesPage() {
  const [certs, setCerts] = useState<ProfessorCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [discFilter, setDiscFilter] = useState('');
  const [publicOnly, setPublicOnly] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    forumService.getAllCertificates()
      .then(setCerts)
      .catch(() => setError('Não foi possível carregar os certificados.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (cert: ProfessorCertificate) => {
    setToggling(cert.id);
    try {
      const updated = await forumService.adminPublishCertificate(cert.id, !cert.isPublic);
      setCerts(prev => prev.map(c => c.id === cert.id ? updated : c));
    } catch {
      setError('Erro ao alterar o estado do certificado.');
    } finally {
      setToggling(null);
    }
  };

  const disciplines = useMemo(() =>
    [...new Set(certs.map(c => c.discipline))].sort(), [certs]);

  const filtered = useMemo(() => certs.filter(c => {
    if (publicOnly && !c.isPublic) return false;
    if (discFilter && c.discipline !== discFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.professorUsername.toLowerCase().includes(q)
        || (DISC_LABELS[c.discipline] ?? c.discipline).toLowerCase().includes(q);
    }
    return true;
  }), [certs, search, discFilter, publicOnly]);

  // Group by professor
  const grouped = useMemo(() => {
    const map = new Map<string, ProfessorCertificate[]>();
    for (const c of filtered) {
      const list = map.get(c.professorUsername) ?? [];
      list.push(c);
      map.set(c.professorUsername, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: '#00A651', width: 44, height: 44 }}>
              <VerifiedIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#0F172A">
                Certificados de Professores
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {certs.length} certificado{certs.length !== 1 ? 's' : ''} emitido{certs.length !== 1 ? 's' : ''}
                {' · '}{certs.filter(c => c.isPublic).length} público{certs.filter(c => c.isPublic).length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Tooltip title="Recarregar">
          <IconButton onClick={load} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems="center">
        <TextField
          size="small" placeholder="Pesquisar professor ou disciplina…"
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ flex: 1, minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Disciplina</InputLabel>
          <Select value={discFilter} label="Disciplina" onChange={e => setDiscFilter(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            {disciplines.map(d => (
              <MenuItem key={d} value={d}>{DISC_LABELS[d] ?? d}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Switch checked={publicOnly} onChange={e => setPublicOnly(e.target.checked)} color="success" />}
          label="Apenas públicos"
          sx={{ whiteSpace: 'nowrap' }}
        />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" pt={6}>
          <CircularProgress sx={{ color: '#00A651' }} />
        </Box>
      ) : grouped.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <VerifiedIcon sx={{ fontSize: 56, color: 'rgba(0,166,81,0.2)', mb: 2 }} />
          <Typography color="text.secondary" fontWeight={600}>
            {certs.length === 0 ? 'Nenhum certificado emitido ainda.' : 'Nenhum resultado para os filtros aplicados.'}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {grouped.map(([professor, profCerts]) => (
            <Card key={professor} variant="outlined" sx={{ borderRadius: 3, border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ pb: '16px !important' }}>
                {/* Professor header */}
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                  <Avatar sx={{ bgcolor: '#1E293B', width: 36, height: 36, fontSize: 13, fontWeight: 700 }}>
                    {initials(professor)}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700} fontSize={15} color="#0F172A">{professor}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {profCerts.length} certificado{profCerts.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Stack>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                        <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: 12 }}>Disciplina</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: 12 }} align="right">Assistência</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: 12 }} align="right">Respostas</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: 12 }}>Emitido em</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: 12 }}>Estado</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#64748B', fontSize: 12 }} align="center">Publicar</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {profCerts.map(cert => (
                        <TableRow key={cert.id} hover>
                          <TableCell>
                            <Chip
                              label={DISC_LABELS[cert.discipline] ?? cert.discipline}
                              size="small"
                              sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: 11 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              fontSize={13} fontWeight={700}
                              color={cert.assistancePercentage >= 80 ? '#00A651' : cert.assistancePercentage >= 70 ? '#F59E0B' : '#EF4444'}
                            >
                              {cert.assistancePercentage?.toFixed(1)}%
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontSize={13} fontWeight={600}>{cert.totalAnswered}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography fontSize={12} color="text.secondary">{formatDate(cert.issuedAt)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={cert.isPublic ? <PublicIcon sx={{ fontSize: '14px !important' }} /> : <LockIcon sx={{ fontSize: '14px !important' }} />}
                              label={cert.isPublic ? 'Público' : 'Privado'}
                              size="small"
                              sx={{
                                bgcolor: cert.isPublic ? '#DCFCE7' : '#F1F5F9',
                                color: cert.isPublic ? '#166534' : '#475569',
                                fontWeight: 700, fontSize: 11,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {toggling === cert.id ? (
                              <CircularProgress size={18} sx={{ color: '#00A651' }} />
                            ) : (
                              <Tooltip title={cert.isPublic ? 'Tornar privado' : 'Tornar público'}>
                                <Switch
                                  size="small"
                                  checked={!!cert.isPublic}
                                  onChange={() => handleToggle(cert)}
                                  color="success"
                                />
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
