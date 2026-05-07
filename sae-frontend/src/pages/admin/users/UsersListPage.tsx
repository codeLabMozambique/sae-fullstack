import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress,
  Alert, Avatar, InputAdornment, TextField,
} from '@mui/material';
import { Group as GroupIcon, Search as SearchIcon } from '@mui/icons-material';
import api from '../../../services/api';

interface UserDTO {
  id: number;
  username: string;
  fullName?: string;
  email?: string;
  nTelefone?: string;
  role: string;
  status: number;
}

const roleLabel: Record<string, { label: string; color: 'primary' | 'secondary' | 'warning' | 'default' }> = {
  ADMIN:     { label: 'Admin',     color: 'secondary' },
  PROFESSOR: { label: 'Professor', color: 'primary' },
  STUDENT:   { label: 'Estudante', color: 'default' },
  GUEST:     { label: 'Visitante', color: 'warning' },
};

function initials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const UsersListPage: React.FC = () => {
  const [users, setUsers]     = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get<UserDTO[]>('/auth/users/all');
        setUsers(data);
      } catch {
        setError('Erro ao carregar utilizadores. Verifique a ligação ao servidor.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0A1628">Utilizadores</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
            Lista de todos os utilizadores registados no sistema
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table card */}
      <Card
        className="animate-fade-in"
        sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}
      >
        <CardContent sx={{ p: 0 }}>
          {/* Card header */}
          <Box sx={{
            px: 2.5, py: 2, borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap',
          }}>
            <GroupIcon sx={{ color: '#00A651' }} />
            <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
              Lista de Utilizadores
            </Typography>
            {!loading && (
              <Chip
                label={`${filtered.length} registo${filtered.length !== 1 ? 's' : ''}`}
                size="small"
                sx={{ bgcolor: '#e8f5e9', color: '#00A651', fontWeight: 700 }}
              />
            )}
            <TextField
              size="small"
              placeholder="Pesquisar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 220, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#00A651' }} />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    {['Utilizador', 'Username', 'Email', 'Telefone', 'Role', 'Estado'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                        {search ? 'Nenhum utilizador encontrado para a pesquisa.' : 'Nenhum utilizador registado.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(u => {
                      const role = roleLabel[u.role] ?? { label: u.role, color: 'default' as const };
                      return (
                        <TableRow key={u.id} hover sx={{ '&:hover': { bgcolor: '#fafbfc' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: '#00A651', fontSize: '0.75rem', fontWeight: 700 }}>
                                {initials(u.fullName)}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500} color="#0A1628">
                                {u.fullName || '—'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: '#475569', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                            {u.username}
                          </TableCell>
                          <TableCell sx={{ color: '#475569' }}>{u.email || '—'}</TableCell>
                          <TableCell sx={{ color: '#475569' }}>{u.nTelefone || '—'}</TableCell>
                          <TableCell>
                            <Chip label={role.label} size="small" color={role.color} variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={u.status === 1 ? 'Ativo' : 'Inativo'}
                              size="small"
                              color={u.status === 1 ? 'success' : 'error'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UsersListPage;
