import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, InputAdornment, IconButton,
  Alert, CircularProgress, Paper,
} from '@mui/material';
import {
  Lock as LockIcon, Visibility, VisibilityOff, CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!newPassword || newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!token) {
      setError('Link de recuperação inválido. Solicite um novo.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/users/reset-password', { token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data || 'Erro ao redefinir a senha.';
      setError(typeof msg === 'string' ? msg : 'Link inválido ou expirado. Solicite um novo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: '#f0f2f5',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
    }}>
      <Paper elevation={0} sx={{
        maxWidth: 440, width: '100%', borderRadius: 4,
        p: { xs: 3, sm: 5 }, boxShadow: '0 20px 60px rgba(0,0,0,0.10)',
      }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
          <Box sx={{
            width: 36, height: 36, bgcolor: '#00A651', borderRadius: 1.5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography fontSize={20}>🎓</Typography>
          </Box>
          <Typography variant="h5" fontWeight={800} color="#0A1628">
            smart<Box component="span" sx={{ color: '#00A651' }}>SAE</Box>
          </Typography>
        </Box>

        {success ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckIcon sx={{ fontSize: 56, color: '#00A651', mb: 2 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Senha redefinida com sucesso!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Já pode iniciar sessão com a sua nova palavra-passe.
            </Typography>
            <Button
              fullWidth variant="contained"
              onClick={() => navigate('/login')}
              sx={{
                bgcolor: '#0A1628', borderRadius: 2.5, py: 1.5, fontWeight: 700,
                '&:hover': { bgcolor: '#00A651' },
              }}
            >
              Ir para o Login
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant="h5" fontWeight={800} color="#0A1628" gutterBottom>
              Nova Palavra-passe
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Introduza e confirme a sua nova palavra-passe.
            </Typography>

            {!token && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                Link de recuperação inválido. Por favor solicite um novo em "Esqueceu a senha?".
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="body2" fontWeight={600} color="#0A1628" sx={{ mb: 1 }}>
                  Nova Palavra-passe
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Mínimo 6 caracteres"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={loading || !token}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#bdbdbd' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNew(!showNew)} edge="end" disabled={loading}>
                          {showNew ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#eaecef', borderRadius: 2.5, '& fieldset': { border: 'none' } } }}
                />
              </Box>

              <Box>
                <Typography variant="body2" fontWeight={600} color="#0A1628" sx={{ mb: 1 }}>
                  Confirmar Palavra-passe
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Repita a nova palavra-passe"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                  disabled={loading || !token}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#bdbdbd' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" disabled={loading}>
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#eaecef', borderRadius: 2.5, '& fieldset': { border: 'none' } } }}
                />
              </Box>

              <Button
                fullWidth variant="contained"
                onClick={handleSubmit}
                disabled={loading || !token}
                endIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
                sx={{
                  mt: 1, py: 1.8, bgcolor: '#0A1628', borderRadius: 2.5,
                  fontWeight: 700, fontSize: '1rem',
                  '&:hover': { bgcolor: '#00A651' }, transition: 'background-color 0.3s',
                }}
              >
                {loading ? 'A redefinir...' : 'Redefinir Senha'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="body2" sx={{ color: '#00A651', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => navigate('/login')}
                >
                  Voltar ao Login
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ResetPassword;
