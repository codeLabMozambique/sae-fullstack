import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Select, MenuItem,
  InputAdornment, IconButton, Link, Alert, CircularProgress, FormControl,
} from '@mui/material';
import {
  Visibility, VisibilityOff, ArrowForward as ArrowIcon,
  School as SchoolIcon, MenuBook as MenuBookIcon, AutoAwesome as AIIcon,
} from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateEmail, validatePhone, carrierForPhone } from '../../utils/validators';
import { schoolService, classLevelService } from '../../services/academicService';
import type { SchoolDTO, ClassLevelDTO } from '../../services/academicService';

const floatBlob = keyframes`
  0%,100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-18px) scale(1.04); }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

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
  '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.4)', mx: 0 },
  '& .MuiFormHelperText-root.Mui-error': { color: '#ff8a80' },
};

const glassSelect = {
  bgcolor: 'rgba(255,255,255,0.07)',
  borderRadius: 2.5,
  color: 'white',
  backdropFilter: 'blur(8px)',
  '& .MuiOutlinedInput-notchedOutline': { border: '1px solid rgba(255,255,255,0.14)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { border: '1px solid rgba(255,255,255,0.28)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: '1px solid #00A651' },
  '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.4)' },
  '& .MuiSelect-select': { color: 'white' },
};

const dropdownPaper = {
  PaperProps: {
    sx: {
      bgcolor: 'rgba(10,18,32,0.97)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 2,
      mt: 0.5,
      '& .MuiMenuItem-root': {
        color: 'rgba(255,255,255,0.75)',
        fontSize: '0.9rem',
        '&:hover': { bgcolor: 'rgba(0,166,81,0.12)', color: 'white' },
        '&.Mui-selected': { bgcolor: 'rgba(0,166,81,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(0,166,81,0.28)' } },
        '&.Mui-disabled': { color: 'rgba(255,255,255,0.25)', opacity: 1 },
      },
    },
  },
};

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

  const [schools, setSchools] = useState<SchoolDTO[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevelDTO[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingLevels, setLoadingLevels] = useState(true);

  const phoneCheck = validatePhone(nTelefone, { required: true });
  const emailCheck = validateEmail(email, { required: true });
  const carrier = carrierForPhone(nTelefone);

  useEffect(() => {
    schoolService.findAll()
      .then(setSchools)
      .catch(() => setSchools([]))
      .finally(() => setLoadingSchools(false));
    classLevelService.findAll()
      .then(setClassLevels)
      .catch(() => setClassLevels([]))
      .finally(() => setLoadingLevels(false));
  }, []);

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
        { size: 420, top: '-10%', left: '-8%',  color: 'rgba(0,166,81,0.04)',  delay: '0s',   dur: '7s'  },
        { size: 300, top: '60%',  left: '-4%',  color: 'rgba(20,30,50,0.5)',   delay: '1.2s', dur: '9s'  },
        { size: 380, top: '-5%',  right: '-6%', color: 'rgba(0,166,81,0.03)', delay: '0.6s', dur: '8s'  },
        { size: 260, top: '65%',  right: '-2%', color: 'rgba(20,30,50,0.4)',   delay: '2s',   dur: '6.5s'},
      ].map((b, i) => (
        <Box key={i} sx={{
          position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
          width: b.size, height: b.size,
          top: b.top, left: (b as any).left, right: (b as any).right,
          bgcolor: b.color, filter: 'blur(60px)',
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
          width: '40%',
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

          {/* Features */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { icon: <MenuBookIcon sx={{ color: '#4ADE80', fontSize: 28 }} />, num: '01', title: 'Biblioteca Digital', desc: 'Acesso a livros, resumos e materiais de estudo do currículo nacional.' },
              { icon: <AIIcon sx={{ color: '#4ADE80', fontSize: 28 }} />, num: '02', title: 'Assistente IA', desc: 'IA académica para tirar dúvidas, gerar resumos e preparar exames.' },
            ].map(f => (
              <Box key={f.num}>
                <Typography sx={{ color: 'rgba(0,166,81,0.25)', fontWeight: 900, fontSize: '3.5rem', lineHeight: 1 }}>{f.num}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, mb: 0.75 }}>
                  {f.icon}
                  <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>{f.title}</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{f.desc}</Typography>
              </Box>
            ))}
          </Box>

          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.18)', letterSpacing: 2 }}>
            MINISTÉRIO DA EDUCAÇÃO · MOÇAMBIQUE
          </Typography>
        </Box>

        {/* ── Right form panel ── */}
        <Box sx={{
          flex: 1,
          p: { xs: 3.5, md: 4.5 },
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          background: 'rgba(255,255,255,0.02)',
          overflowY: 'auto',
          maxHeight: '100vh',
        }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Box sx={{ width: 34, height: 34, bgcolor: '#00A651', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SchoolIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: 'white' }}>
              smart<span style={{ color: '#4ADE80' }}>SAE</span>
            </Typography>
          </Box>

          <Typography variant="h4" fontWeight={800} sx={{ color: 'white', mb: 0.5 }}>
            Criar conta
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 3 }}>
            Registe-se para aceder à biblioteca, quizzes e assistente IA.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, bgcolor: 'rgba(211,47,47,0.15)', color: '#ff8a80', border: '1px solid rgba(211,47,47,0.3)', '& .MuiAlert-icon': { color: '#ff8a80' } }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            <GlassLabel label="Nome Completo">
              <TextField
                fullWidth placeholder="Ex: Maria António"
                value={fullname} onChange={e => setFullname(e.target.value)}
                disabled={loading} sx={glassField}
              />
            </GlassLabel>

            <GlassLabel label="Número de Telefone">
              <TextField
                fullWidth placeholder="+258 84 123 4567"
                value={nTelefone} onChange={e => setNTelefone(e.target.value)}
                disabled={loading}
                error={!!nTelefone && !phoneCheck.ok}
                helperText={
                  !nTelefone ? 'Moçambique · prefixos 82–87'
                  : phoneCheck.ok ? `Válido · ${carrier ?? 'Operadora desconhecida'}`
                  : phoneCheck.message
                }
                sx={glassField}
              />
            </GlassLabel>

            <GlassLabel label="Email">
              <TextField
                fullWidth placeholder="nome@dominio.com" type="email"
                value={email} onChange={e => setEmail(e.target.value)}
                disabled={loading}
                error={!!email && !emailCheck.ok}
                helperText={!email ? ' ' : emailCheck.ok ? 'Email válido' : emailCheck.message}
                sx={glassField}
              />
            </GlassLabel>

            {/* School */}
            <GlassLabel label="Instituição de Ensino *">
              <FormControl fullWidth>
                <Select
                  displayEmpty value={schoolId}
                  onChange={e => setSchoolId(e.target.value as number)}
                  disabled={loading || loadingSchools}
                  sx={glassSelect}
                  MenuProps={dropdownPaper}
                  renderValue={v => v === '' ? (
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {loadingSchools ? 'A carregar...' : 'Selecione a instituição'}
                    </span>
                  ) : schools.find(s => s.id === v)?.name ?? ''}
                >
                  <MenuItem value="" disabled>Selecione a instituição</MenuItem>
                  {schools.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </GlassLabel>

            <GlassLabel label="Nível / Classe (opcional)">
              <FormControl fullWidth>
                <Select
                  displayEmpty value={grade}
                  onChange={e => setGrade(e.target.value)}
                  disabled={loading || loadingLevels}
                  sx={glassSelect}
                  MenuProps={dropdownPaper}
                  renderValue={v => v === '' ? (
                    <span style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {loadingLevels ? 'A carregar...' : 'Selecione o nível'}
                    </span>
                  ) : v as string}
                >
                  <MenuItem value="">Nenhum (continuar sem nível)</MenuItem>
                  {classLevels.map(l => (
                    <MenuItem key={l.id} value={l.name}>{l.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </GlassLabel>

            <GlassLabel label="Idade (opcional)">
              <TextField
                fullWidth placeholder="Ex: 18" type="number"
                value={age} onChange={e => setAge(e.target.value ? Number(e.target.value) : '')}
                disabled={loading} sx={glassField}
              />
            </GlassLabel>

            <GlassLabel label="Senha">
              <TextField
                fullWidth placeholder="Mínimo 6 caracteres"
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRegister(); }}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" disabled={loading} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={glassField}
              />
            </GlassLabel>

            <Button
              fullWidth variant="contained"
              endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowIcon />}
              onClick={handleRegister}
              disabled={loading}
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
              {loading ? 'A criar conta...' : 'Criar conta'}
            </Button>

            <Box sx={{ pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                Já tem uma conta?{' '}
                <Link onClick={() => navigate('/login')} sx={{ color: '#4ADE80', cursor: 'pointer', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  Entrar
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

function GlassLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" fontWeight={700} letterSpacing={0.8}
        sx={{ color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', display: 'block', mb: 0.75, fontSize: '0.7rem' }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}

export default Register;
