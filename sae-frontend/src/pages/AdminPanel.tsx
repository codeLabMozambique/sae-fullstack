import React from 'react';
import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button } from '@mui/material';
import { Group as GroupIcon, Settings as SettingsIcon, Assessment as ReportIcon } from '@mui/icons-material';

const users = [
  { id: 1, name: 'Alice Smith', email: 'alice@example.com', role: 'Estudante', status: 'Ativo' },
  { id: 2, name: 'Bob Johnson', email: 'bob@example.com', role: 'Professor', status: 'Inativo' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com', role: 'Estudante', status: 'Ativo' },
  { id: 4, name: 'Diana Prince', email: 'diana@example.com', role: 'Admin', status: 'Ativo' },
];

const AdminPanel: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700, color: 'primary.main' }}>
        Painel Administrativo 🛠️
      </Typography>

      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <Button variant="contained" startIcon={<GroupIcon />}>Gerir Utilizadores</Button>
        <Button variant="outlined" startIcon={<ReportIcon />}>Relatórios de Sistema</Button>
        <Button variant="outlined" startIcon={<SettingsIcon />}>Configurações</Button>
      </Box>

      <Card className="animate-fade-in" sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
            <Typography variant="h6">Utilizadores Recentes</Typography>
          </Box>
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 0 }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip label={user.role} size="small" variant="outlined" color={user.role === 'Admin' ? 'secondary' : 'default'} />
                    </TableCell>
                    <TableCell>
                      <Chip label={user.status} size="small" color={user.status === 'Ativo' ? 'success' : 'error'} />
                    </TableCell>
                    <TableCell>
                      <Button size="small">Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      <Box sx={{ mt: 4, bgcolor: '#fff3e0', p: 2, borderRadius: 2, border: '1px solid #ffe0b2', display: 'flex', alignItems: 'center', gap: 2 }}>
        <ReportIcon color="warning" />
        <Typography variant="body2" color="textSecondary">
          <strong>Aviso do Sistema:</strong> Sincronização automática com `sae-content-service` agendada para daqui a 15 minutos.
        </Typography>
      </Box>
    </Box>
  );
};

export default AdminPanel;
