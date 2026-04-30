import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Card, CardActionArea, Select, MenuItem, InputAdornment, IconButton, Link, Alert, CircularProgress } from '@mui/material';
import { School as SchoolIcon, Edit as EditIcon, Visibility, VisibilityOff, Check as CheckIcon, ArrowForward as ArrowIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signupStudent, signupProfessor } from '../../services/auth';

const INSTITUTIONS: { value: string; label: string; schoolId: number }[] = [
  { value: 'ue', label: 'Universidade Eduardo Mondlane', schoolId: 1 },
  { value: 'uem', label: 'Universidade Politécnica', schoolId: 2 },
  { value: 'ucm', label: 'Universidade Católica de Moçambique', schoolId: 3 },
];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'student' | 'professor'>('student');
  const [showPassword, setShowPassword] = useState(false);

  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!fullname.trim() || !phone.trim() || !email.trim() || !institution || !password) {
      setError('Por favor preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    const inst = INSTITUTIONS.find((i) => i.value === institution);
    if (!inst) {
      setError('Selecione uma instituição válida.');
      return;
    }

    setSubmitting(true);
    try {
      if (role === 'student') {
        await signupStudent({
          nTelefone: phone,
          email,
          password,
          fullname,
          schoolId: inst.schoolId,
          classroomId: 1,
        });
      } else {
        await signupProfessor({
          nTelefone: phone,
          email,
          password,
          fullname,
          schoolId: inst.schoolId,
        });
      }
      navigate('/login');
    } catch (err: any) {
      const backendMsg = err?.response?.data?.message || err?.response?.data || err?.message;
      setError(typeof backendMsg === 'string' ? backendMsg : 'Falha ao criar conta. Tente novamente.');
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
          background: 'linear-gradient(160deg, #001B33 0%, #002B50 50%, #003D2E 100%)',
          p: 5,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: 'white',
          py: 4, px: 5
        }}>
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>
              smart<span style={{ color: '#00A651' }}>SAE</span>
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.7, lineHeight: 1.7 }}>
              A plataforma editorial que conecta o conhecimento moçambicano à excelência acadêmica mundial.
            </Typography>
          </Box>
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h2" sx={{ color: 'rgba(0,166,81,0.3)', fontWeight: 900, fontSize: '4rem', lineHeight: 1 }}>01</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>Ambiente Imersivo</Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.6 }}>
                Uma interface limpa que prioriza a leitura e o foco, eliminando o ruído das ferramentas tradicionais.
              </Typography>
            </Box>
            <Box>
              <Typography variant="h2" sx={{ color: 'rgba(0,166,81,0.3)', fontWeight: 900, fontSize: '4rem', lineHeight: 1 }}>02</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>Acesso Regional</Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.6 }}>
                Conteúdo curado especificamente para as necessidades das instituições de ensino em Moçambique.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Panel */}
        <Box sx={{ flex: 1, bgcolor: '#f8f9fa', p: { xs: 2.5, md: 3.5 } }}>
          <Typography variant="h4" fontWeight={800} color="#0A1628" gutterBottom>
            Criar conta
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Junte-se à nova era da educação.
          </Typography>

          {/* Role Selection */}
          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            {/* Student Card */}
            <Card
              onClick={() => setRole('student')}
              sx={{
                flex: 1, cursor: 'pointer', border: role === 'student' ? '2px solid #00A651' : '2px solid #e0e0e0',
                bgcolor: 'white', borderRadius: 3, boxShadow: role === 'student' ? '0 4px 20px rgba(0,166,81,0.15)' : 'none', transition: 'all 0.2s',
              }}
            >
              <CardActionArea sx={{ p: 2.5 }}>
                {role === 'student' && (
                  <Check sx={{ position: 'absolute', top: 12, right: 12, color: '#00A651', fontSize: 20 }} />
                )}
                <Box sx={{ width: 48, height: 48, bgcolor: '#e8f5e9', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                  <SchoolIcon sx={{ color: '#00A651', fontSize: 28 }} />
                </Box>
                <Typography fontWeight={700} color="#0A1628">Sou Estudante</Typography>
                <Typography variant="caption" color="text.secondary">Acesso a cursos e notas</Typography>
              </CardActionArea>
            </Card>

            {/* Professor Card */}
            <Card
              onClick={() => setRole('professor')}
              sx={{
                flex: 1, cursor: 'pointer', border: role === 'professor' ? '2px solid #00A651' : '2px solid #e0e0e0',
                bgcolor: 'white', borderRadius: 3, boxShadow: role === 'professor' ? '0 4px 20px rgba(0,166,81,0.15)' : 'none', transition: 'all 0.2s',
              }}
            >
              <CardActionArea sx={{ p: 2.5 }}>
                {role === 'professor' && (
                  <CheckIcon sx={{ position: 'absolute', top: 12, right: 12, color: '#00A651', fontSize: 20 }} />
                )}
                <Box sx={{ width: 48, height: 48, bgcolor: '#f5f5f5', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                  <EditIcon sx={{ color: '#9e9e9e', fontSize: 24 }} />
                </Box>
                <Typography fontWeight={700} color="#0A1628">Painel do Professor</Typography>
                <Typography variant="caption" color="text.secondary">Gestão de turmas e notas</Typography>
              </CardActionArea>
            </Card>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          {/* Form Fields */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="caption" fontWeight={700} letterSpacing={1} color="#5c6870" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>
                Nome Completo
              </Typography>
              <TextField
                fullWidth
                placeholder="Ex: Alex Alfai"
                variant="outlined"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#eaecef', borderRadius: 2.5, '& fieldset': { border: 'none' } } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" fontWeight={700} letterSpacing={1} color="#5c6870" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>
                Número do Telefone
              </Typography>
              <TextField
                fullWidth
                placeholder="+(258) 8X XXX XXXX"
                variant="outlined"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#eaecef', borderRadius: 2.5, '& fieldset': { border: 'none' } } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" fontWeight={700} letterSpacing={1} color="#5c6870" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>
                Email
              </Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="seu.email@exemplo.com"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#eaecef', borderRadius: 2.5, '& fieldset': { border: 'none' } } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" fontWeight={700} letterSpacing={1} color="#5c6870" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>
                Instituição de Ensino
              </Typography>
              <Select
                fullWidth
                displayEmpty
                value={institution}
                onChange={(e) => setInstitution(e.target.value as string)}
                sx={{ bgcolor: '#eaecef', borderRadius: 2.5, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
              >
                <MenuItem value="" disabled>Selecione sua instituição</MenuItem>
                {INSTITUTIONS.map((i) => (
                  <MenuItem key={i.value} value={i.value}>{i.label}</MenuItem>
                ))}
              </Select>
            </Box>

            <Box>
              <Typography variant="caption" fontWeight={700} letterSpacing={1} color="#5c6870" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>
                Senha
              </Typography>
              <TextField
                fullWidth
                placeholder="Mínimo 6 caracteres"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
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
              onClick={handleSubmit}
              disabled={submitting}
              sx={{
                mt: 1, py: 1.8, bgcolor: '#0A1628', color: 'white', borderRadius: 2.5, fontWeight: 700, fontSize: '1rem',
                '&:hover': { bgcolor: '#00A651' }, transition: 'background-color 0.3s',
              }}
            >
              {submitting ? 'A criar conta...' : 'Criar conta'}
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

const Check = ({ sx }: any) => <CheckIcon sx={sx} />;

export default Register;
