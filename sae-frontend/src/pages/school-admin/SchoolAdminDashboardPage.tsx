import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import {
  Card, CardContent, Typography, Box, Avatar, Stack,
  Divider, Button, Chip, Skeleton,
} from '@mui/material';
import {
  People as PeopleIcon,
  MenuBook as BookIcon,
  Class as ClassIcon,
  Person as PersonIcon,
  ArrowForward as ArrowIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface SchoolAdminProfile {
  userId: number;
  schoolId: number;
  fullName: string;
  username: string;
}

interface SchoolInfo {
  id: number;
  name: string;
  city: string;
}

interface Stats {
  classrooms: number;
  professors: number;
  students: number;
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title, value, subtitle, icon, iconBg, iconColor, loading,
}) => (
  <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0, mr: 1.5 }}>
          <Typography variant="caption" color="text.secondary"
            sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.25 }}>
            {title}
          </Typography>
          {loading
            ? <Skeleton variant="text" width={64} height={44} />
            : <Typography variant="h4" fontWeight={800} color="#111827" sx={{ lineHeight: 1.15 }}>{value}</Typography>
          }
          {subtitle && !loading && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: iconBg, color: iconColor, width: 44, height: 44, flexShrink: 0 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, label, onClick, color }) => (
  <Box onClick={onClick} sx={{
    display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, borderRadius: 2,
    cursor: 'pointer', transition: 'background-color 0.15s', '&:hover': { bgcolor: '#F9FAFB' },
  }}>
    <Avatar sx={{ bgcolor: `${color}15`, color, width: 30, height: 30, flexShrink: 0, '& svg': { fontSize: 15 } }}>
      {icon}
    </Avatar>
    <Typography variant="body2" fontWeight={500} color="#374151" sx={{ flex: 1 }}>{label}</Typography>
    <ArrowIcon sx={{ fontSize: 15, color: '#D1D5DB' }} />
  </Box>
);

const SchoolAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [stats, setStats] = useState<Stats>({ classrooms: 0, professors: 0, students: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await api.get<SchoolAdminProfile>('/auth/users/school-admin-profile');
        const sid = profileRes.data.schoolId;

        const [classroomsRes, membersRes] = await Promise.allSettled([
          api.get<any[]>(`/academic/classroom/by-school/${sid}`),
          api.get<any[]>('/auth/users/my-school/members'),
        ]);

        // buscar escola por id
        try {
          const schoolRes = await api.post<SchoolInfo>('/academic/school/details', { id: sid });
          if (schoolRes.data) setSchool(schoolRes.data);
        } catch {
          try {
            const all = await api.get<SchoolInfo[]>('/academic/school/all');
            const found = all.data.find((s: SchoolInfo) => s.id === sid);
            if (found) setSchool(found);
          } catch { /* ignore */ }
        }

        const classroomCount = classroomsRes.status === 'fulfilled'
          ? classroomsRes.value.data.length
          : 0;

        const professorCount = membersRes.status === 'fulfilled'
          ? membersRes.value.data.filter((u: any) => u.role === 'PROFESSOR').length
          : 0;

        const studentCount = membersRes.status === 'fulfilled'
          ? membersRes.value.data.filter((u: any) => u.role === 'STUDENT').length
          : 0;

        setStats({ classrooms: classroomCount, professors: professorCount, students: studentCount });
      } catch {
        // silently fail — metrics show 0
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Typography variant="h5" fontWeight={700} color="#0A1628">
            Bem-vindo, {user?.fullName?.split(' ')[0] || user?.username}
          </Typography>
          <Chip
            label="Administrador de Escola"
            size="small"
            sx={{ bgcolor: '#DCFCE7', color: '#007d3c', fontWeight: 700, fontSize: '0.7rem' }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {school ? `${school.name} — ${school.city}` : 'A carregar escola...'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Metric Cards */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            title="Turmas"
            value={loading ? '—' : String(stats.classrooms)}
            subtitle="Nesta escola"
            icon={<ClassIcon fontSize="small" />}
            iconBg="#DCFCE7"
            iconColor="#00a651"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            title="Professores"
            value={loading ? '—' : String(stats.professors)}
            subtitle="Na plataforma"
            icon={<PersonIcon fontSize="small" />}
            iconBg="#DBEAFE"
            iconColor="#2563EB"
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <MetricCard
            title="Estudantes"
            value={loading ? '—' : String(stats.students)}
            subtitle="Na plataforma"
            icon={<PeopleIcon fontSize="small" />}
            iconBg="#FEF3C7"
            iconColor="#D97706"
            loading={loading}
          />
        </Grid>

        {/* Quick Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#111827" sx={{ mb: 0.5 }}>
                Acções Rápidas
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Gestão da sua escola
              </Typography>
              <Divider sx={{ mb: 1.5 }} />
              <QuickAction icon={<PeopleIcon />} label="Gerir Utilizadores"
                onClick={() => navigate('/admin/users/list')} color="#00a651" />
              <QuickAction icon={<ClassIcon />} label="Turmas"
                onClick={() => navigate('/admin/academic/classrooms')} color="#2563EB" />
              <QuickAction icon={<BookIcon />} label="Biblioteca"
                onClick={() => navigate('/admin/library')} color="#D97706" />
              <QuickAction icon={<AdminIcon />} label="Atribuições de Professores"
                onClick={() => navigate('/admin/academic/professor-assignments')} color="#6D28D9" />
            </CardContent>
          </Card>
        </Grid>

        {/* School Info Card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#111827" sx={{ mb: 2.5 }}>
                Informações da Escola
              </Typography>
              {loading ? (
                <Stack spacing={1.5}>
                  <Skeleton variant="rounded" height={48} sx={{ borderRadius: 2 }} />
                  <Skeleton variant="rounded" height={48} sx={{ borderRadius: 2 }} />
                </Stack>
              ) : school ? (
                <Stack spacing={2}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', borderLeft: '3px solid #00a651' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                      Nome
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="#111827" sx={{ mt: 0.25 }}>
                      {school.name}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', borderLeft: '3px solid #2563EB' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                      Cidade
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="#111827" sx={{ mt: 0.25 }}>
                      {school.city}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', borderLeft: '3px solid #D97706' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                      ID da Escola
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="#111827" sx={{ mt: 0.25 }}>
                      #{school.id}
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Informações da escola não disponíveis.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Banner */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #001B33 0%, #007d3c 50%, #00a651 100%)',
            boxShadow: '0 4px 20px rgba(0,166,81,0.25)',
            border: 'none',
          }}>
            <CardContent sx={{
              p: 3, display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: 2, '&:last-child': { pb: 3 },
            }}>
              <Box>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.55)', letterSpacing: 1, display: 'block' }}>
                  Gestão Académica
                </Typography>
                <Typography variant="h6" color="white" fontWeight={700} sx={{ mb: 0.5 }}>
                  Gestão completa da {school?.name || 'sua escola'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                  Gere utilizadores, turmas, disciplinas, biblioteca e quizzes da sua escola.
                </Typography>
              </Box>
              <Button variant="contained" onClick={() => navigate('/admin/users/list')}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)', color: 'white', textTransform: 'none',
                  fontWeight: 700, borderRadius: 2.5, border: '1px solid rgba(255,255,255,0.25)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, px: 3, py: 1,
                }}>
                Gerir Utilizadores
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SchoolAdminDashboardPage;
