import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button,
  Select, MenuItem, InputAdornment, IconButton, Link, Alert, CircularProgress
} from '@mui/material';
import {
  Visibility, VisibilityOff, ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePhone, carrierForPhone } from '../../utils/validators';

const SCHOOLS = [
  { id: 1, label: 'Universidade Eduardo Mondlane' },
  { id: 2, label: 'Universidade Politécnica' },
  { id: 3, label: 'Universidade Católica de Moçambique' },
];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signupStudent } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fullname, setFullname] = useState('');
  const [nTelefone, setNTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolId, setSchoolId] = useState<number | ''>('');
  const [grade, setGrade] = useState('');
  const [age, setAge] = useState<number | ''>('');

  const phoneCheck = validatePhone(nTelefone, { required: true });
  const emailCheck = validateEmail(email, { required: true });
  const carrier = carrierForPhone(nTelefone);

  const handleRegister = async () => {
    if (!fullname.trim() || !nTelefone.trim() || !email.trim() || !password.trim() || schoolId === '') {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (!phoneCheck.ok) { setError(phoneCheck.message || 'Telefone inválido'); return; }
    if (!emailCheck.ok) { setError(emailCheck.message || 'Email inválido'); return; }
    setError('');
    setLoading(true);
    try {
      await signupStudent({
        nTelefone,
        email,
        password,
        fullname,
        schoolId: schoolId as number,
        classroomId: null,
        grade: grade || undefined,
        age: age !== '' ? (age as number) : undefined,
      });
      navigate('/login');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data || 'Erro ao criar conta. Tente novamente.';
      setError(typeof msg === 'string' ? msg : 'Erro ao criar conta. Verifique os dados introduzidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Box sx={{
        display: 'flex', maxWidth: 1100, width: '100%',
        borderRadius: 4, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }}>
        {/* Left Panel */}
        <Box sx={{
          width: '45%',
          background: 'linear-gradient(160deg, #001B33 0%, #002B50 50%, #003D2E 100%)',
          p: 5, display: { xs: 'none', md: 'flex' }, flexDirection: 'column',
          justifyContent: 'space-between', color: 'white', py: 4, px: 5,
        }}>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>
              smart<Box component="span" sx={{ color: '#00A651' }}>SAE</Box>
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.7, lineHeight: 1.7 }}>
              A plataforma que conecta o conhecimento moçambicano à excelência académica.
            </Typography>
          </Box>
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h2" sx={{ color: 'rgba(0,166,81,0.3)', fontWeight: 900, fontSize: '4rem', lineHeight: 1 }}>01</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>Biblioteca Digital</Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.6 }}>
                Acesso a livros, resumos e materiais de estudo do currículo nacional.
              </Typography>
            </Box>
            <Box>
              <Typography variant="h2" sx={{ color: 'rgba(0,166,81,0.3)', fontWeight: 900, fontSize: '4rem', lineHeight: 1 }}>02</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>Assistente IA</Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.6 }}>
                IA académica para tirar dúvidas, gerar resumos e preparar exames.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Panel */}
        <Box sx={{ flex: 1, bgcolor: '#f8f9fa', p: { xs: 3, md: 5 }, overflowY: 'auto' }}>
          <Typography variant="h4" fontWeight={800} color="#0A1628" gutterBottom>
            Criar conta de Estudante
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Registe-se para aceder à biblioteca, aos quizzes e ao assistente IA.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FieldLabel label="Nome Completo">
              <TextField
                fullWidth placeholder="Ex: Maria António"
                value={fullname} onChange={(e) => setFullname(e.target.value)}
                disabled={loading} sx={fieldStyle}
              />
            </FieldLabel>

            <FieldLabel label="Número de Telefone">
              <TextField
                fullWidth placeholder="+258 84 123 4567"
                value={nTelefone} onChange={(e) => setNTelefone(e.target.value)}
                disabled={loading}
                error={!!nTelefone && !phoneCheck.ok}
                helperText={
                  !nTelefone ? 'Moçambique · prefixos 82–87'
                    : phoneCheck.ok ? `Válido · ${carrier ?? 'Operadora desconhecida'}`
                    : phoneCheck.message
                }
                sx={fieldStyle}
              />
            </FieldLabel>

            <FieldLabel label="Email">
              <TextField
                fullWidth placeholder="nome@dominio.com" type="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                error={!!email && !emailCheck.ok}
                helperText={!email ? ' ' : (emailCheck.ok ? 'Email válido' : emailCheck.message)}
                sx={fieldStyle}
              />
            </FieldLabel>

            <FieldLabel label="Instituição de Ensino">
              <Select
                fullWidth displayEmpty value={schoolId}
                onChange={(e) => setSchoolId(e.target.value as number)}
                disabled={loading}
                sx={{ bgcolor: '#eaecef', borderRadius: 2.5, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
              >
                <MenuItem value="" disabled>Selecione a instituição</MenuItem>
                {SCHOOLS.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>
                ))}
              </Select>
            </FieldLabel>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel label="Ano/Classe (opcional)">
                  <TextField
                    fullWidth placeholder="Ex: 12ª"
                    value={grade} onChange={(e) => setGrade(e.target.value)}
                    disabled={loading} sx={fieldStyle}
                  />
                </FieldLabel>
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel label="Idade (opcional)">
                  <TextField
                    fullWidth placeholder="Ex: 20" type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                    disabled={loading} sx={fieldStyle}
                  />
                </FieldLabel>
              </Box>
            </Box>

            <FieldLabel label="Senha">
              <TextField
                fullWidth placeholder="Mínimo 6 caracteres"
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRegister(); }}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={loading}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={fieldStyle}
              />
            </FieldLabel>

            <Button
              fullWidth variant="contained"
              endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowIcon />}
              onClick={handleRegister}
              disabled={loading}
              sx={{
                mt: 1, py: 1.8, bgcolor: '#0A1628', color: 'white', borderRadius: 2.5,
                fontWeight: 700, fontSize: '1rem',
                '&:hover': { bgcolor: '#00A651' }, transition: 'background-color 0.3s',
              }}
            >
              {loading ? 'A criar conta...' : 'Criar conta'}
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              Já tem uma conta?{' '}
              <Link onClick={() => navigate('/login')} sx={{ color: '#00A651', cursor: 'pointer', fontWeight: 600 }}>
                Entrar
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const fieldStyle = {
  '& .MuiOutlinedInput-root': { bgcolor: '#eaecef', borderRadius: 2.5, '& fieldset': { border: 'none' } }
};

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" fontWeight={700} letterSpacing={1} color="#5c6870"
        sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

export default Register;
