import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Avatar, TextField, Button, Stack, Chip,
  Divider, Alert, CircularProgress, IconButton, InputAdornment,
  Grid, Card, CardContent,
} from '@mui/material';
import {
  Edit as EditIcon, Save as SaveIcon, Close as CancelIcon,
  Visibility, VisibilityOff,
  PersonOutline as PersonIcon, EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon, LockOutlined as LockIcon,
  AdminPanelSettings as AdminIcon, School as SchoolIcon,
  Person as StudentIcon, Public as GuestIcon,
  CheckCircle as CheckIcon, VerifiedUser as VerifiedIcon,
  Download as DownloadIcon, Shield as ShieldIcon,
} from '@mui/icons-material';
import {
  getMyProfile, updateMyProfile, changeMyPassword,
  type MyProfile,
} from '../services/userService';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { validateEmail, validatePhone, carrierForPhone } from '../utils/validators';

// ── Helpers ───────────────────────────────────────────────────

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function roleConfig(role: string | null | undefined) {
  switch (role) {
    case 'ADMIN':
      return { label: 'Administrador', color: '#7C3AED', bg: '#F3E8FF', Icon: AdminIcon };
    case 'SCHOOL_ADMIN':
      return { label: 'Administrador de Escola', color: '#0EA5E9', bg: '#E0F2FE', Icon: AdminIcon };
    case 'PROFESSOR':
      return { label: 'Professor', color: '#00A651', bg: '#F0FDF4', Icon: SchoolIcon };
    case 'STUDENT':
      return { label: 'Estudante', color: '#1E40AF', bg: '#EFF6FF', Icon: StudentIcon };
    default:
      return { label: role || 'Visitante', color: '#6B7280', bg: '#F3F4F6', Icon: GuestIcon };
  }
}

// ── Componente ────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const { user, clearMustChangePassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const forceChange = searchParams.get('forceChange') === 'true' || !!user?.mustChangePassword;
  const pwdSectionRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // edição de identidade
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // edição de password
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (forceChange && pwdSectionRef.current) {
      setTimeout(() => pwdSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
    }
  }, [forceChange]);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await getMyProfile();
      setProfile(data);
      setFullName(data.fullName || '');
      setEmail(data.email || '');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Não foi possível carregar o teu perfil');
    } finally {
      setLoading(false);
    }
  };

  // Validação reactiva
  const emailCheck = validateEmail(email, { required: false });
  const phoneOk = !!profile && validatePhone(profile.username, { required: true }).ok;
  const carrier = profile ? carrierForPhone(profile.username) : null;

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      setError('O nome é obrigatório');
      return;
    }
    if (email.trim() && !emailCheck.ok) {
      setError(emailCheck.message || 'Email inválido');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateMyProfile({ fullName: fullName.trim(), email: email.trim() });
      setProfile(updated);
      setSuccess('Perfil actualizado com sucesso');
      setEditing(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Falha ao actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    setFullName(profile.fullName || '');
    setEmail(profile.email || '');
    setEditing(false);
    setError(null);
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd) {
      setError('Preenche a password actual e a nova');
      return;
    }
    if (newPwd.length < 6) {
      setError('A nova password tem de ter pelo menos 6 caracteres');
      return;
    }
    if (newPwd !== confirmPwd) {
      setError('As novas passwords não coincidem');
      return;
    }
    setChangingPwd(true);
    setError(null);
    setSuccess(null);
    try {
      await changeMyPassword(currentPwd, newPwd);
      setSuccess('Password actualizada com sucesso');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      if (forceChange) {
        clearMustChangePassword();
        const role = user?.role ?? '';
        setTimeout(() => {
          if (role.includes('PROFESSOR') || role === 'Professor') navigate('/professor/dashboard');
          else if (role.includes('STUDENT') || role === 'Estudante') navigate('/student/dashboard');
          else if (role.includes('ADMIN') || role === 'Administrador') navigate('/admin/dashboard');
          else navigate('/');
        }, 1500);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Falha ao mudar password');
    } finally {
      setChangingPwd(false);
    }
  };

  // LGPD
  const [exportingData, setExportingData] = useState(false);

  const handleExportMyData = async () => {
    setExportingData(true);
    setError(null);
    try {
      const { data } = await api.get<Record<string, unknown>>('/auth/users/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'meus_dados_sae.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Não foi possível exportar os dados. Tenta novamente.');
    } finally {
      setExportingData(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#00A651' }} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error || 'Não foi possível carregar o teu perfil'}
        </Alert>
      </Box>
    );
  }

  const { label: roleLabel, color: roleColor, bg: roleBg, Icon: RoleIcon } = roleConfig(profile.role);

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      {forceChange && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }}
        >
          Primeiro acesso — defina uma nova password pessoal para continuar a usar a plataforma.
        </Alert>
      )}
      {/* ── Hero card ─────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative', overflow: 'hidden', borderRadius: 4, mb: 3,
          background: 'linear-gradient(135deg, #0A1628 0%, #1E3A8A 60%, #00A651 100%)',
          color: '#fff', p: { xs: 3, md: 4 },
          boxShadow: '0 10px 40px rgba(10, 22, 40, 0.18)',
        }}
      >
        {/* círculos decorativos */}
        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
        <Box sx={{ position: 'absolute', bottom: -80, left: -40, width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ position: 'relative', zIndex: 1 }}>
          <Avatar
            sx={{
              width: 96, height: 96, fontSize: '2.25rem', fontWeight: 800,
              bgcolor: '#fff', color: '#0A1628',
              boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            }}
          >
            {initials(profile.fullName)}
          </Avatar>

          <Box flex={1} minWidth={0}>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" mb={0.5}>
              <Typography variant="h4" fontWeight={800} sx={{ wordBreak: 'break-word' }}>
                {profile.fullName || 'Sem nome'}
              </Typography>
              <Chip
                size="small"
                icon={<RoleIcon sx={{ fontSize: '16px !important', color: `${roleColor} !important` }} />}
                label={roleLabel}
                sx={{ bgcolor: '#fff', color: roleColor, fontWeight: 700 }}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" sx={{ opacity: 0.85 }}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <PhoneIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2">{profile.username}</Typography>
              </Stack>
              {profile.email && (
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <EmailIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{profile.email}</Typography>
                </Stack>
              )}
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <VerifiedIcon sx={{ fontSize: 16, color: '#86EFAC' }} />
                <Typography variant="body2">Conta verificada</Typography>
              </Stack>
            </Stack>
          </Box>

          {!editing && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setEditing(true)}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: 2.5,
                bgcolor: '#fff', color: '#0A1628',
                '&:hover': { bgcolor: '#F3F4F6' },
              }}
            >
              Editar Perfil
            </Button>
          )}
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}
      {success && (
        <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>
      )}

      <Grid container spacing={3}>
        {/* ── Dados pessoais ─────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 4, border: '1px solid #F1F5F9' }} elevation={0}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Box>
                <Typography variant="overline" sx={{ fontWeight: 700, color: '#6B7280', letterSpacing: 1.5 }}>
                  IDENTIDADE
                </Typography>
                <Typography variant="h6" fontWeight={700} color="#0A1628">
                  Dados pessoais
                </Typography>
              </Box>
              {editing && (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined" size="small" startIcon={<CancelIcon />}
                    onClick={handleCancel} disabled={saving}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained" size="small" startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={saving || !fullName.trim() || (!!email.trim() && !emailCheck.ok)}
                    sx={{
                      textTransform: 'none', borderRadius: 2,
                      bgcolor: '#00A651', '&:hover': { bgcolor: '#008C44' },
                    }}
                  >
                    {saving ? 'A guardar…' : 'Guardar'}
                  </Button>
                </Stack>
              )}
            </Stack>

            <Stack spacing={2.5}>
              <TextField
                label="Nome completo"
                fullWidth
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                disabled={!editing}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><PersonIcon sx={{ color: '#9CA3AF' }} /></InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />
              <TextField
                label="Email"
                fullWidth
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={!editing}
                placeholder="nome@dominio.com"
                error={editing && !!email.trim() && !emailCheck.ok}
                helperText={
                  editing
                    ? (email.trim() && !emailCheck.ok
                        ? emailCheck.message
                        : 'Formato: nome@dominio.com (opcional)')
                    : ' '
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><EmailIcon sx={{ color: '#9CA3AF' }} /></InputAdornment>
                  ),
                  endAdornment: editing && email.trim() && emailCheck.ok ? (
                    <InputAdornment position="end">
                      <CheckIcon sx={{ color: '#00A651', fontSize: 18 }} />
                    </InputAdornment>
                  ) : undefined,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />
              <TextField
                label="Número de telefone (username)"
                fullWidth
                value={profile.username}
                disabled
                helperText={
                  phoneOk
                    ? `Operadora detectada: ${carrier ?? '—'} · Identificador único, não editável.`
                    : 'O telefone é o teu identificador único — não pode ser alterado.'
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><PhoneIcon sx={{ color: '#9CA3AF' }} /></InputAdornment>
                  ),
                  endAdornment: phoneOk ? (
                    <InputAdornment position="end">
                      <Chip
                        size="small"
                        label={carrier ?? 'Moz'}
                        sx={{ bgcolor: '#F0FDF4', color: '#00A651', fontWeight: 700, fontSize: '0.65rem' }}
                      />
                    </InputAdornment>
                  ) : undefined,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />
            </Stack>
          </Paper>
        </Grid>

        {/* ── Segurança ──────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            ref={pwdSectionRef}
            sx={{
              p: { xs: 2.5, md: 3.5 }, borderRadius: 4,
              border: forceChange ? '2px solid #F59E0B' : '1px solid #F1F5F9',
              boxShadow: forceChange ? '0 0 0 4px rgba(245,158,11,0.12)' : 'none',
            }}
            elevation={0}
          >
            {forceChange && (
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', bgcolor: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 2, p: 1.5, mb: 2 }}>
                <WarningAmberIcon sx={{ color: '#D97706', mt: 0.2, flexShrink: 0 }} />
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#92400E">
                    Mude a sua password antes de continuar
                  </Typography>
                  <Typography variant="caption" color="#B45309">
                    A sua conta foi criada com uma password temporária. Por segurança, defina uma nova agora.
                  </Typography>
                </Box>
              </Box>
            )}
            <Typography variant="overline" sx={{ fontWeight: 700, color: '#6B7280', letterSpacing: 1.5 }}>
              SEGURANÇA
            </Typography>
            <Typography variant="h6" fontWeight={700} color="#0A1628" mb={2}>
              Mudar Password
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Password actual"
                type={showCurrent ? 'text' : 'password'}
                fullWidth
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><LockIcon sx={{ color: '#9CA3AF' }} /></InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowCurrent(s => !s)}>
                        {showCurrent ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />
              <TextField
                label="Nova password"
                type={showNew ? 'text' : 'password'}
                fullWidth
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                helperText="mín. 6 caracteres"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><LockIcon sx={{ color: '#9CA3AF' }} /></InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowNew(s => !s)}>
                        {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />
              <TextField
                label="Confirmar nova password"
                type={showNew ? 'text' : 'password'}
                fullWidth
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                error={!!confirmPwd && confirmPwd !== newPwd}
                helperText={!!confirmPwd && confirmPwd !== newPwd ? 'As passwords não coincidem' : ' '}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><LockIcon sx={{ color: '#9CA3AF' }} /></InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />

              <Button
                variant="contained" fullWidth size="large"
                onClick={handleChangePassword}
                disabled={changingPwd || !currentPwd || !newPwd || newPwd !== confirmPwd}
                sx={{
                  textTransform: 'none', fontWeight: 700, borderRadius: 2.5, py: 1.25,
                  bgcolor: '#0A1628', '&:hover': { bgcolor: '#001B33' },
                }}
              >
                {changingPwd ? 'A actualizar…' : 'Actualizar password'}
              </Button>
            </Stack>
          </Paper>

          {/* Card secundário — info da conta */}
          <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid #F1F5F9', mt: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="overline" sx={{ fontWeight: 700, color: '#6B7280', letterSpacing: 1.5 }}>
                CONTA
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={1.25}>
                <InfoRow label="ID do utilizador" value={`#${profile.id}`} />
                <InfoRow label="Tipo de conta" value={
                  <Chip size="small" label={roleLabel}
                    sx={{ bgcolor: roleBg, color: roleColor, fontWeight: 700, fontSize: '0.7rem' }}
                  />
                } />
                <InfoRow label="Username" value={profile.username} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── LGPD ──────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4, border: '1px solid #FEE2E2', mt: 3, bgcolor: '#FFFBFB' }}>
        <Stack direction="row" alignItems="center" spacing={1.25} mb={1.5}>
          <ShieldIcon sx={{ color: '#DC2626', fontSize: 22 }} />
          <Box>
            <Typography variant="overline" sx={{ fontWeight: 700, color: '#DC2626', letterSpacing: 1.5 }}>
              PRIVACIDADE (LGPD)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tens o direito de aceder e exportar os teus dados pessoais armazenados na plataforma.
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="outlined"
          startIcon={exportingData ? <CircularProgress size={16} /> : <DownloadIcon />}
          onClick={handleExportMyData}
          disabled={exportingData}
          sx={{
            textTransform: 'none', fontWeight: 700, borderRadius: 2,
            borderColor: '#DC2626', color: '#DC2626',
            '&:hover': { bgcolor: '#FEF2F2', borderColor: '#B91C1C' },
          }}
        >
          {exportingData ? 'A exportar…' : 'Exportar os meus dados (JSON)'}
        </Button>
      </Paper>
    </Box>
  );
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right' }}>{value}</Typography>
  </Stack>
);

export default ProfilePage;
