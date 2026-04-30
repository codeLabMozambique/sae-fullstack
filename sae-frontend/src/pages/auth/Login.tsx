import React, { useState } from 'react';
import { Box, Typography, TextField, Button, InputAdornment, IconButton, Link, Alert, CircularProgress } from '@mui/material';
import { Phone as PhoneIcon, Lock as LockIcon, Visibility, VisibilityOff, ArrowForward as ArrowIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!phone.trim() || !password) {
      setError('Por favor preencha o contacto e a palavra-passe.');
      return;
    }
    setSubmitting(true);
    try {
      await login({ username: phone, password });
      navigate('/app');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setError('Credenciais inválidas. Verifique o contacto e a palavra-passe.');
      } else {
        const backendMsg = err?.response?.data?.message || err?.response?.data || err?.message;
        setError(typeof backendMsg === 'string' ? backendMsg : 'Falha ao iniciar sessão. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box sx={{
        display: 'flex',
        maxWidth: 1100,
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Left Panel */}
        <Box sx={{
          width: '45%',
          background: 'linear-gradient(160deg, #001B33 0%, #002B50 60%, #003D2E 100%)',
          p: 5,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: 'white',
          py: 4, px: 5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, bgcolor: '#00A651', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography fontSize={20}>🎓</Typography>
            </Box>
            <Typography variant="h5" fontWeight={800}>
              smart<span style={{ color: '#00A651' }}>SAE</span>
            </Typography>
          </Box>

          <Box>
            <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.2, mb: 2 }}>
              Excelência na Gestão Educacional de Moçambique.
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.6, lineHeight: 1.7 }}>
              A plataforma que empodera educadores a moldar o futuro através de dados e pedagogia de precisão.
            </Typography>
          </Box>

          {/* Testimonial Card */}
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 3, p: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
            <Typography variant="body2" sx={{ opacity: 0.85, fontStyle: 'italic', mb: 2 }}>
              "Uma revolução na forma como organizamos o currículo nacional."
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#00A651', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography fontSize={14} fontWeight={700}>RS</Typography>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>Prof. Ricardo Santos</Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Panel */}
        <Box sx={{ flex: 1, bgcolor: '#f8f9fa', p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="h4" fontWeight={800} color="#0A1628" gutterBottom>
            Acesso ao Portal
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
            Bem-vindo, Professor. Por favor, introduza as suas credenciais institucionais.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="body2" fontWeight={600} color="#0A1628" sx={{ mb: 1 }}>
                Contacto
              </Typography>
              <TextField
                fullWidth
                placeholder="+(258) 8X XXX XXXX"
                variant="outlined"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: '#bdbdbd' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#eaecef', borderRadius: 2.5, '& fieldset': { border: 'none' } } }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600} color="#0A1628">Palavra-passe</Typography>
                <Link sx={{ cursor: 'pointer', color: '#00A651', fontWeight: 600, fontSize: '0.85rem' }}>Esqueceu a senha?</Link>
              </Box>
              <TextField
                fullWidth
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#bdbdbd' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#eaecef', borderRadius: 2.5, '& fieldset': { border: 'none' } } }}
              />
            </Box>

            <Button
              fullWidth
              variant="contained"
              endIcon={submitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <ArrowIcon />}
              onClick={handleLogin}
              disabled={submitting}
              sx={{
                mt: 1, py: 1.8, bgcolor: '#0A1628', color: 'white', borderRadius: 2.5, fontWeight: 700, fontSize: '1rem',
                '&:hover': { bgcolor: '#00A651' }, transition: 'background-color 0.3s',
              }}
            >
              {submitting ? 'A entrar...' : 'Entrar no Painel'}
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              Não tem conta?{' '}
              <Link onClick={() => navigate('/register')} sx={{ color: '#00A651', cursor: 'pointer', fontWeight: 600 }}>
                Criar conta
              </Link>
            </Typography>

            <Box sx={{ pt: 2, borderTop: '1px solid #e0e0e0', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" letterSpacing={2}>
                MINISTÉRIO DA EDUCAÇÃO | REPÚBLICA DE MOÇAMBIQUE
              </Typography>
            </Box>
          </Box>

          {/* PT/EN Switcher */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
            <Box sx={{ bgcolor: '#0A1628', color: 'white', px: 2, py: 0.5, borderRadius: 3, fontSize: '0.8rem', fontWeight: 700 }}>PT</Box>
            <Box sx={{ bgcolor: '#e0e0e0', color: '#9e9e9e', px: 2, py: 0.5, borderRadius: 3, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>EN</Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
