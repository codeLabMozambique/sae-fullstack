import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, InputAdornment, IconButton,
  Link, Alert, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Phone as PhoneIcon, Lock as LockIcon, Visibility, VisibilityOff,
  ArrowForward as ArrowIcon, Email as EmailIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const floatBlob = keyframes`
  0%,100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-18px) scale(1.04); }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password dialog
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!phone.trim() || !password) {
      setError('Por favor preencha o contacto e a palavra-passe.');
      return;
    }
    setSubmitting(true);
    try {
      const authUser = await login({ username: phone, password });
      if (authUser.mustChangePassword) {
        navigate('/perfil?forceChange=true');
        return;
      }
      if (authUser.role === 'Professor') navigate('/professor/dashboard');
      else if (authUser.role === 'Estudante') navigate('/student/dashboard');
      else if (authUser.role === 'Administrador') navigate('/admin/dashboard');
      else if (authUser.role === 'Visitante') navigate('/student/library');
      else navigate('/app');
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

  const handleForgotSubmit = async () => {
    if (!forgotIdentifier.trim()) {
      setForgotError('Introduza o seu email ou número de telefone.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      await api.post('/auth/users/forgot-password', { identifier: forgotIdentifier.trim() });
      setForgotSuccess(true);
    } catch {
      setForgotError('Ocorreu um erro. Tente novamente.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setForgotIdentifier('');
    setForgotSuccess(false);
    setForgotError(null);
  };

  const glassField = {
    '& .MuiOutlinedInput-root': {
      bgcolor: 'rgba(255,255,255,0.07)',
      borderRadius: 2.5,
      color: 'white',
      backdropFilter: 'blur(8px)',
      '& fieldset': { border: '1px solid rgba(255,255,255,0.14)' },
      '&:hover fieldset': { border: '1px solid rgba(255,255,255,0.28)' },
      '&.Mui-focused fieldset': { border: '1px solid #00A651' },
    },
    '& input': { color: 'white' },
    '& input::placeholder': { color: 'rgba(255,255,255,0.35)', opacity: 1 },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.35)' },
    '& .MuiIconButton-root': { color: 'rgba(255,255,255,0.5)' },
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: [
        'linear-gradient(135deg, rgba(5,8,15,0.94) 0%, rgba(8,12,20,0.92) 60%, rgba(5,8,15,0.94) 100%)',
        "url('/hero_image_001.png')",
      ].join(', '),
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      p: 2, position: 'relative', overflow: 'hidden',
    }}>

      {/* Decorative blobs */}
      {[
        { size: 420, top: '-10%', left: '-8%',  color: 'rgba(0,166,81,0.04)',  delay: '0s',    dur: '7s'  },
        { size: 300, top: '60%',  left: '-4%',  color: 'rgba(20,30,50,0.5)',    delay: '1.2s',  dur: '9s'  },
        { size: 380, top: '-5%',  right: '-6%', color: 'rgba(0,166,81,0.03)',  delay: '0.6s',  dur: '8s'  },
        { size: 260, top: '65%',  right: '-2%', color: 'rgba(20,30,50,0.4)',    delay: '2s',    dur: '6.5s'},
      ].map((b, i) => (
        <Box key={i} sx={{
          position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
          width: b.size, height: b.size,
          top: b.top, left: (b as any).left, right: (b as any).right,
          bgcolor: b.color,
          filter: 'blur(60px)',
          animation: `${floatBlob} ${b.dur} ease-in-out infinite`,
          animationDelay: b.delay,
        }} />
      ))}

      {/* Main card */}
      <Box sx={{
        display: 'flex', maxWidth: 1020, width: '100%',
        borderRadius: '24px', overflow: 'hidden',
        backdropFilter: 'blur(28px)',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.82), 0 8px 32px rgba(0,0,0,0.6)',
        position: 'relative', zIndex: 1,
        animation: `${fadeUp} 0.6s ease both`,
      }}>

        {/* ── Left branding panel ── */}
        <Box sx={{
          width: '42%',
          display: { xs: 'none', md: 'flex' }, flexDirection: 'column',
          justifyContent: 'space-between',
          p: 5,
          borderRight: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, bgcolor: '#00A651', borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0,166,81,0.4)',
            }}>
              <SchoolIcon sx={{ color: 'white', fontSize: 22 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: 'white' }}>
              smart<span style={{ color: '#4ADE80' }}>SAE</span>
            </Typography>
          </Box>

          {/* Tagline */}
          <Box>
            <Typography variant="h3" fontWeight={800} sx={{ color: 'white', lineHeight: 1.18, mb: 2.5, fontSize: { md: '1.9rem', lg: '2.2rem' } }}>
              Excelência na Gestão Educacional de Moçambique.
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.8 }}>
              A plataforma que empodera educadores a moldar o futuro através de dados e pedagogia de precisão.
            </Typography>
          </Box>

          {/* Testimonial */}
          <Box sx={{
            bgcolor: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
            borderRadius: 3, p: 3,
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', mb: 2, lineHeight: 1.7 }}>
              "Uma revolução na forma como organizamos o currículo nacional."
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: '50%', bgcolor: '#00A651',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px rgba(0,166,81,0.35)',
              }}>
                <Typography fontSize={13} fontWeight={700} sx={{ color: 'white' }}>RS</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Prof. Ricardo Santos</Typography>
            </Box>
          </Box>
        </Box>

        {/* ── Right form panel ── */}
        <Box sx={{
          flex: 1,
          p: { xs: 3.5, md: 5 },
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          background: 'rgba(255,255,255,0.02)',
        }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box sx={{ width: 34, height: 34, bgcolor: '#00A651', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SchoolIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: 'white' }}>
              smart<span style={{ color: '#4ADE80' }}>SAE</span>
            </Typography>
          </Box>

          <Typography variant="h4" fontWeight={800} sx={{ color: 'white', mb: 0.5 }}>
            Bem-vindo de volta
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 4 }}>
            Introduza as suas credenciais para continuar
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(211,47,47,0.15)', color: '#ff8a80', border: '1px solid rgba(211,47,47,0.3)', '& .MuiAlert-icon': { color: '#ff8a80' } }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
            onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}>

            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                Contacto (Número de Telefone)
              </Typography>
              <TextField
                fullWidth
                placeholder="+(258) 8X XXX XXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                variant="outlined"
                disabled={submitting}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><PhoneIcon /></InputAdornment>,
                }}
                sx={glassField}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600} sx={{ color: 'rgba(255,255,255,0.7)' }}>Palavra-passe</Typography>
                <Link onClick={() => setForgotOpen(true)} sx={{ cursor: 'pointer', color: '#4ADE80', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Esqueceu a senha?
                </Link>
              </Box>
              <TextField
                fullWidth
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                variant="outlined"
                disabled={submitting}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={submitting}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={glassField}
              />
            </Box>

            <Button
              fullWidth variant="contained"
              endIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <ArrowIcon />}
              onClick={handleLogin}
              disabled={submitting}
              sx={{
                mt: 0.5, py: 1.8,
                background: 'linear-gradient(135deg, #00A651 0%, #00C060 100%)',
                color: 'white', borderRadius: 2.5,
                fontWeight: 700, fontSize: '1rem',
                boxShadow: '0 8px 24px rgba(0,166,81,0.35)',
                '&:hover': { background: 'linear-gradient(135deg, #008C44 0%, #00A651 100%)', boxShadow: '0 12px 32px rgba(0,166,81,0.45)' },
                '&:disabled': { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
                transition: 'all 0.3s ease',
              }}
            >
              {submitting ? 'A autenticar...' : 'Entrar no Portal'}
            </Button>

            <Box sx={{ pt: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mb: 1.5 }}>
                Não tem conta?{' '}
                <Link onClick={() => navigate('/register')} sx={{ cursor: 'pointer', color: '#4ADE80', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Criar conta de estudante
                </Link>
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.18)', letterSpacing: 2 }}>
                MINISTÉRIO DA EDUCAÇÃO · REPÚBLICA DE MOÇAMBIQUE
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onClose={closeForgot} maxWidth="xs" fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backdropFilter: 'blur(28px)',
            background: 'rgba(10,20,35,0.92)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          }
        }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1, color: 'white' }}>Recuperar Palavra-passe</DialogTitle>
        <DialogContent>
          {forgotSuccess ? (
            <Alert severity="success" sx={{ mt: 1, borderRadius: 2, bgcolor: 'rgba(0,166,81,0.15)', color: '#4ADE80', border: '1px solid rgba(0,166,81,0.3)', '& .MuiAlert-icon': { color: '#4ADE80' } }}>
              Se existir uma conta com esse contacto, receberá um email com o link de recuperação em breve.
            </Alert>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
                Introduza o email ou número de telefone associado à sua conta.
              </Typography>
              {forgotError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2, bgcolor: 'rgba(211,47,47,0.15)', color: '#ff8a80', border: '1px solid rgba(211,47,47,0.3)', '& .MuiAlert-icon': { color: '#ff8a80' } }}>{forgotError}</Alert>
              )}
              <TextField
                fullWidth
                placeholder="email@exemplo.com ou 8X XXX XXXX"
                value={forgotIdentifier}
                onChange={e => setForgotIdentifier(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleForgotSubmit(); }}
                autoFocus
                variant="outlined"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'rgba(255,255,255,0.35)' }} /></InputAdornment>,
                }}
                sx={glassField}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={closeForgot} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', '&:hover': { borderColor: 'rgba(255,255,255,0.4)', bgcolor: 'rgba(255,255,255,0.05)' } }}>
            {forgotSuccess ? 'Fechar' : 'Cancelar'}
          </Button>
          {!forgotSuccess && (
            <Button
              onClick={handleForgotSubmit}
              variant="contained"
              disabled={forgotLoading}
              endIcon={forgotLoading ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ background: 'linear-gradient(135deg,#00A651,#00C060)', borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 16px rgba(0,166,81,0.3)', '&:hover': { background: 'linear-gradient(135deg,#008C44,#00A651)' } }}
            >
              {forgotLoading ? 'A enviar...' : 'Enviar link'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login;
