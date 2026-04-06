import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Card, CardActionArea, Select, MenuItem, InputAdornment, IconButton, Link } from '@mui/material';
import { School as SchoolIcon, Edit as EditIcon, Visibility, VisibilityOff, Check as CheckIcon, ArrowForward as ArrowIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'student' | 'professor'>('student');
  const [showPassword, setShowPassword] = useState(false);

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
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#eaecef', borderRadius: 2.5, '& fieldset': { border: 'none' } } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" fontWeight={700} letterSpacing={1} color="#5c6870" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>
                Número do Telefone
              </Typography>
              <TextField
                fullWidth
                placeholder="+(256) 8X XXX XXXX"
                variant="outlined"
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
                defaultValue=""
                sx={{ bgcolor: '#eaecef', borderRadius: 2.5, '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
              >
                <MenuItem value="" disabled>Selecione sua instituição</MenuItem>
                <MenuItem value="ue">Universidade Eduardo Mondlane</MenuItem>
                <MenuItem value="uem">Universidade Politécnica</MenuItem>
                <MenuItem value="ucm">Universidade Católica de Moçambique</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography variant="caption" fontWeight={700} letterSpacing={1} color="#5c6870" sx={{ textTransform: 'uppercase', display: 'block', mb: 1 }}>
                Senha
              </Typography>
              <TextField
                fullWidth
                placeholder="Mínimo 8 caracteres"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
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
              endIcon={<ArrowIcon />}
              onClick={() => navigate('/app')}
              sx={{
                mt: 1, py: 1.8, bgcolor: '#0A1628', color: 'white', borderRadius: 2.5, fontWeight: 700, fontSize: '1rem',
                '&:hover': { bgcolor: '#00A651' }, transition: 'background-color 0.3s',
              }}
            >
              Criar conta
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

// Temporary helper
const Check = ({ sx }: any) => <CheckIcon sx={sx} />;

export default Register;
