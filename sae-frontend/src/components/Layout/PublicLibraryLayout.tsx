import React from 'react';
import {
  Box, AppBar, Toolbar, Typography, Button, Stack, Chip, Container,
} from '@mui/material';
import {
  LibraryBooks as LibraryIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  AutoAwesome as AiIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import OfflineIndicator from '../OfflineIndicator';

interface Props {
  children: React.ReactNode;
}

/**
 * Layout para acesso público (sem login) à Biblioteca e ao Leitor.
 *
 * Conforme requisitos:
 *   "Permitir acesso livre (sem registo), onde qualquer aluno pode entrar
 *    na plataforma, pesquisar um livro ou fazer uma pergunta à IA sem
 *    precisar de criar conta ou fazer login."
 */
const PublicLibraryLayout: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      <AppBar
        position="sticky" elevation={0}
        sx={{ bgcolor: '#0A1628', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}
            onClick={() => navigate('/biblioteca')}
            sx={{ cursor: 'pointer' }}
          >
            <LibraryIcon sx={{ color: '#00A651' }} />
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1, color: '#fff' }}>
                SmartSAE
              </Typography>
              <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                Biblioteca Digital — acesso livre
              </Typography>
            </Box>
          </Stack>

          <Chip size="small" label="Acesso Livre"
            sx={{
              bgcolor: '#00A651', color: '#fff', fontWeight: 700, fontSize: '0.65rem',
              ml: 1,
            }}
          />

          <Box sx={{ flex: 1 }} />

          <OfflineIndicator />

          <Button
            variant="text"
            startIcon={<AiIcon />}
            onClick={() => navigate('/biblioteca/chat')}
            sx={{ textTransform: 'none', color: '#fff', display: { xs: 'none', sm: 'flex' } }}
          >
            Perguntar à IA
          </Button>

          <Button
            variant="text"
            startIcon={<LoginIcon />}
            onClick={() => navigate('/login')}
            sx={{ textTransform: 'none', color: '#fff' }}
          >
            Entrar
          </Button>

          <Button
            variant="contained"
            startIcon={<RegisterIcon />}
            onClick={() => navigate('/register')}
            sx={{
              textTransform: 'none', bgcolor: '#00A651',
              '&:hover': { bgcolor: '#008C44' },
              display: { xs: 'none', sm: 'flex' },
            }}
          >
            Criar Conta
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Faixa de incentivo a registo */}
        <Box sx={{
          mb: 2.5, p: 1.5, borderRadius: 2,
          bgcolor: '#F0FDF4', border: '1px solid #BBF7D0',
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5,
        }}>
          <Typography variant="body2" sx={{ flex: 1 }}>
            <strong>Estás em modo público.</strong> Cria conta para guardar favoritos, definir metas
            de estudo, ler offline e receber sugestões personalizadas da IA.
          </Typography>
          <Button
            size="small" variant="contained"
            onClick={() => navigate('/register')}
            sx={{ bgcolor: '#00A651', textTransform: 'none', '&:hover': { bgcolor: '#008C44' } }}
          >
            Criar conta grátis
          </Button>
        </Box>

        {children}
      </Container>
    </Box>
  );
};

export default PublicLibraryLayout;
