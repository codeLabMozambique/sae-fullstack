import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import {
  Card, CardContent, Typography, Box, Avatar, Stack,
  Chip, Skeleton, Alert, LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Class as ClassroomIcon,
  Forum as ForumIcon,
  LockOpen as OpenIcon,
  Lock as ClosedIcon,
  AccessTime as TimeIcon,
  Groups as StudentsIcon,
  MenuBook as BookIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { forumService } from '../../services/forumService';
import { getMostAccessed } from '../../services/contentService';
import type { ContentStats } from '../../services/contentService';
import type { ForumStatsOverview } from '../../types/forum';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SystemStats {
  totalUsers: number;
  totalProfessors: number;
  pendingProfessors: number;
  totalStudents: number;
  totalSchools: number;
  totalClassrooms: number;
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
  badge?: number;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title, value, subtitle, icon, iconBg, iconColor, loading, badge, onClick,
}) => (
  <Card
    onClick={onClick}
    sx={{
      height: '100%', borderRadius: 3,
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.15s',
      '&:hover': onClick ? { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' } : {},
    }}
  >
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
          {badge != null && badge > 0 && !loading && (
            <Chip
              label={`${badge} pendente${badge > 1 ? 's' : ''}`}
              size="small"
              sx={{
                mt: 0.75, bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 700,
                fontSize: '0.65rem', height: 18, '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}
        </Box>
        <Avatar sx={{ bgcolor: iconBg, color: iconColor, width: 44, height: 44, flexShrink: 0 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [sys, setSys] = useState<SystemStats>({
    totalUsers: 0, totalProfessors: 0, pendingProfessors: 0,
    totalStudents: 0, totalSchools: 0, totalClassrooms: 0,
  });
  const [forumStats, setForumStats] = useState<ForumStatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [forumLoading, setForumLoading] = useState(true);
  const [topContent, setTopContent] = useState<ContentStats[]>([]);
  const [contentStatsLoading, setContentStatsLoading] = useState(true);
  const [contentPeriod, setContentPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    const loadSystem = async () => {
      try {
        const [usersRes, schoolsRes, classroomsRes, pendingRes] = await Promise.allSettled([
          api.get<any[]>('/auth/users/all'),
          api.get<any[]>('/academic/school/all'),
          api.get<any[]>('/academic/classroom/all'),
          api.get<any[]>('/auth/users/professors/pending'),
        ]);

        const users = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
        const schools = schoolsRes.status === 'fulfilled' ? schoolsRes.value.data : [];
        const classrooms = classroomsRes.status === 'fulfilled' ? classroomsRes.value.data : [];
        const pending = pendingRes.status === 'fulfilled' ? pendingRes.value.data : [];

        setSys({
          totalUsers: users.length,
          totalProfessors: users.filter((u: any) =>
            String(u.role ?? '').toUpperCase().includes('PROFESSOR')).length,
          pendingProfessors: pending.length,
          totalStudents: users.filter((u: any) =>
            String(u.role ?? '').toUpperCase().includes('STUDENT')).length,
          totalSchools: schools.length,
          totalClassrooms: classrooms.length,
        });
      } finally {
        setLoading(false);
      }
    };

    const loadForum = async () => {
      try {
        setForumStats(await forumService.getStatsOverview());
      } catch { /* forum stats optional */ } finally {
        setForumLoading(false);
      }
    };

    loadSystem();
    loadForum();
  }, []);

  useEffect(() => {
    setContentStatsLoading(true);
    getMostAccessed(contentPeriod, 10)
      .then(setTopContent)
      .catch(() => setTopContent([]))
      .finally(() => setContentStatsLoading(false));
  }, [contentPeriod]);

  // ── helpers ─────────────────────────────────────────────────────────────────

  const fmt = (mins: number | null): string => {
    if (mins == null) return '—';
    if (mins < 60) return `${Math.round(mins)} min`;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  const totalByStatus = forumStats?.totalByStatus ?? {};
  const open   = totalByStatus['ABERTA']  ?? 0;
  const closed = totalByStatus['FECHADA'] ?? 0;

  const totalByType   = forumStats?.totalByType ?? {};
  const especializado = totalByType['ESPECIALIZADO'] ?? 0;
  const colaborativo  = totalByType['COLABORATIVO']  ?? 0;
  const totalType     = especializado + colaborativo;

  const topDisciplinas = forumStats
    ? Object.entries(forumStats.totalByDisciplina)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
    : [];

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Typography variant="h5" fontWeight={700} color="#0A1628">
            Painel de Monitorização
          </Typography>
          <Chip
            label="Admin"
            size="small"
            sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 700, fontSize: '0.7rem' }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Visão geral da plataforma — utilizadores, estrutura académica e actividade do fórum
        </Typography>
      </Box>

      <Grid container spacing={3}>

        {/* ════════════════════════════════════════════════════════
            SECÇÃO 1 — Sistema (5 metric cards)
            ════════════════════════════════════════════════════════ */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
            Sistema
          </Typography>
        </Grid>

        {/* 5 cards em CSS grid para evitar frações de coluna MUI */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
            gap: 3,
          }}>
            <MetricCard
              title="Utilizadores"
              value={loading ? '—' : sys.totalUsers}
              subtitle="Total registados"
              icon={<PeopleIcon fontSize="small" />}
              iconBg="#EDE9FE" iconColor="#7C3AED"
              loading={loading}
            />
            <MetricCard
              title="Professores"
              value={loading ? '—' : sys.totalProfessors}
              subtitle="Na plataforma"
              badge={sys.pendingProfessors}
              icon={<PersonIcon fontSize="small" />}
              iconBg="#DBEAFE" iconColor="#2563EB"
              loading={loading}
              onClick={() => navigate('/admin/professors')}
            />
            <MetricCard
              title="Estudantes"
              value={loading ? '—' : sys.totalStudents}
              subtitle="Na plataforma"
              icon={<StudentsIcon fontSize="small" />}
              iconBg="#FEF3C7" iconColor="#D97706"
              loading={loading}
            />
            <MetricCard
              title="Escolas"
              value={loading ? '—' : sys.totalSchools}
              subtitle="Registadas"
              icon={<SchoolIcon fontSize="small" />}
              iconBg="#DCFCE7" iconColor="#16A34A"
              loading={loading}
              onClick={() => navigate('/admin/academic/schools')}
            />
            <MetricCard
              title="Turmas"
              value={loading ? '—' : sys.totalClassrooms}
              subtitle="Activas"
              icon={<ClassroomIcon fontSize="small" />}
              iconBg="#FCE7F3" iconColor="#DB2777"
              loading={loading}
              onClick={() => navigate('/admin/academic/classrooms')}
            />
          </Box>
        </Grid>

        {/* Alerta de professores pendentes */}
        {!loading && sys.pendingProfessors > 0 && (
          <Grid size={{ xs: 12 }}>
            <Alert
              severity="warning"
              action={
                <Chip
                  label="Ver professores"
                  size="small"
                  onClick={() => navigate('/admin/professors')}
                  sx={{ cursor: 'pointer', fontWeight: 700 }}
                />
              }
              sx={{ borderRadius: 2 }}
            >
              <strong>{sys.pendingProfessors}</strong>{' '}
              professor{sys.pendingProfessors > 1 ? 'es' : ''}{' '}
              aguarda{sys.pendingProfessors > 1 ? 'm' : ''} aprovação
            </Alert>
          </Grid>
        )}

        {/* ════════════════════════════════════════════════════════
            SECÇÃO 2 — Fórum (4 metric cards)
            ════════════════════════════════════════════════════════ */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="overline" color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: 1, display: 'block' }}>
            Fórum
          </Typography>
        </Grid>

        <Grid size={{ xs: 6, sm: 3 }}>
          <MetricCard
            title="Total Perguntas"
            value={forumLoading ? '—' : (forumStats?.totalQuestions ?? 0)}
            subtitle="Desde o início"
            icon={<ForumIcon fontSize="small" />}
            iconBg="#F0F9FF" iconColor="#0284C7"
            loading={forumLoading}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <MetricCard
            title="Abertas"
            value={forumLoading ? '—' : open}
            subtitle="A aguardar resposta"
            icon={<OpenIcon fontSize="small" />}
            iconBg="#DCFCE7" iconColor="#16A34A"
            loading={forumLoading}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <MetricCard
            title="Fechadas"
            value={forumLoading ? '—' : closed}
            subtitle="Resolvidas"
            icon={<ClosedIcon fontSize="small" />}
            iconBg="#F3F4F6" iconColor="#6B7280"
            loading={forumLoading}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <MetricCard
            title="Tempo Médio"
            value={forumLoading ? '—' : fmt(forumStats?.avgResponseTimeMinutes ?? null)}
            subtitle="De resposta"
            icon={<TimeIcon fontSize="small" />}
            iconBg="#FEF3C7" iconColor="#D97706"
            loading={forumLoading}
          />
        </Grid>

        {/* ════════════════════════════════════════════════════════
            SECÇÃO 3 — Breakdown do fórum
            ════════════════════════════════════════════════════════ */}

        {/* Tipo de Perguntas */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#111827" sx={{ mb: 2 }}>
                Tipo de Perguntas
              </Typography>
              {forumLoading ? (
                <Stack spacing={1.5}>
                  <Skeleton variant="rounded" height={52} sx={{ borderRadius: 2 }} />
                  <Skeleton variant="rounded" height={52} sx={{ borderRadius: 2 }} />
                </Stack>
              ) : totalType === 0 ? (
                <Typography variant="body2" color="text.secondary">Sem dados de fórum.</Typography>
              ) : (
                <Stack spacing={2.5}>
                  {[
                    { label: 'Especializado', value: especializado, color: '#2563EB', bg: '#DBEAFE' },
                    { label: 'Colaborativo',  value: colaborativo,  color: '#16A34A', bg: '#DCFCE7' },
                  ].map(({ label, value, color, bg }) => {
                    const pct = totalType > 0 ? Math.round((value / totalType) * 100) : 0;
                    return (
                      <Box key={label}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                          <Typography variant="body2" fontWeight={600} color="#374151">{label}</Typography>
                          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight={800} color={color}>{value}</Typography>
                            <Chip
                              label={`${pct}%`} size="small"
                              sx={{ bgcolor: bg, color, fontWeight: 700, fontSize: '0.65rem', height: 18, '& .MuiChip-label': { px: 0.75 } }}
                            />
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate" value={pct}
                          sx={{
                            height: 8, borderRadius: 4, bgcolor: '#F3F4F6',
                            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Disciplinas mais activas */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#111827" sx={{ mb: 2 }}>
                Disciplinas mais Activas
              </Typography>
              {forumLoading ? (
                <Stack spacing={1}>
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={34} sx={{ borderRadius: 2 }} />
                  ))}
                </Stack>
              ) : topDisciplinas.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Sem dados de fórum disponíveis.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {topDisciplinas.map(([disciplina, count], idx) => {
                    const max = topDisciplinas[0][1];
                    const pct = max > 0 ? Math.round((count / max) * 100) : 0;
                    return (
                      <Box key={disciplina} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.25 }}>
                        <Avatar sx={{
                          width: 22, height: 22, bgcolor: '#F3F4F6', color: '#9CA3AF',
                          fontSize: '0.6rem', fontWeight: 800, flexShrink: 0,
                        }}>
                          {idx + 1}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
                            <Typography variant="body2" fontWeight={600} color="#374151" noWrap sx={{ maxWidth: '75%' }}>
                              {disciplina}
                            </Typography>
                            <Typography variant="body2" fontWeight={800} color="#111827" sx={{ flexShrink: 0, ml: 1 }}>
                              {count}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate" value={pct}
                            sx={{
                              height: 5, borderRadius: 4, bgcolor: '#F3F4F6',
                              '& .MuiLinearProgress-bar': { bgcolor: '#2563EB', borderRadius: 4 },
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ════════════════════════════════════════════════════════
            SECÇÃO 4 — Conteúdo mais acedido na Biblioteca
            ════════════════════════════════════════════════════════ */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="overline" color="text.secondary"
            sx={{ fontWeight: 700, letterSpacing: 1, display: 'block' }}>
            Biblioteca
          </Typography>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <CardContent sx={{ p: 3 }}>
              {/* Header + period selector */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', width: 36, height: 36 }}>
                    <BookIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="h6" fontWeight={700} color="#111827">
                    Conteúdo mais acedido
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  {(['week', 'month', 'all'] as const).map((p) => (
                    <Chip
                      key={p}
                      label={p === 'week' ? '7 dias' : p === 'month' ? '30 dias' : 'Tudo'}
                      onClick={() => setContentPeriod(p)}
                      size="small"
                      sx={{
                        fontWeight: 700, cursor: 'pointer',
                        bgcolor: contentPeriod === p ? '#1D4ED8' : '#F3F4F6',
                        color: contentPeriod === p ? '#fff' : '#6B7280',
                        '&:hover': { bgcolor: contentPeriod === p ? '#1E40AF' : '#E5E7EB' },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {contentStatsLoading ? (
                <Stack spacing={1.5}>
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={40} sx={{ borderRadius: 2 }} />
                  ))}
                </Stack>
              ) : topContent.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <BookIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Sem dados de leitura para o período seleccionado.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {topContent.map((item, idx) => {
                    const max = topContent[0].accessCount;
                    const pct = max > 0 ? Math.round((item.accessCount / max) * 100) : 0;
                    const isTop3 = idx < 3;
                    const rankColors = ['#F59E0B', '#9CA3AF', '#CD7C2F'];
                    return (
                      <Box key={item.contentId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{
                          width: 26, height: 26, flexShrink: 0,
                          bgcolor: isTop3 ? `${rankColors[idx]}22` : '#F3F4F6',
                          color: isTop3 ? rankColors[idx] : '#9CA3AF',
                          fontSize: '0.65rem', fontWeight: 800,
                        }}>
                          {idx + 1}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.4 }}>
                            <Typography variant="body2" fontWeight={600} color="#111827" noWrap sx={{ maxWidth: '55%' }}>
                              {item.contentTitle || '—'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0, ml: 1 }}>
                              {item.discipline && (
                                <Chip
                                  label={item.discipline}
                                  size="small"
                                  sx={{ bgcolor: '#EFF6FF', color: '#1D4ED8', fontWeight: 600, fontSize: '0.62rem', height: 18, '& .MuiChip-label': { px: 0.75 } }}
                                />
                              )}
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" fontWeight={800} color="#111827" sx={{ lineHeight: 1 }}>
                                  {item.accessCount}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                                  {item.uniqueUsers} utilizador{item.uniqueUsers !== 1 ? 'es' : ''}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                          <LinearProgress
                            variant="determinate" value={pct}
                            sx={{
                              height: 5, borderRadius: 4, bgcolor: '#F3F4F6',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: isTop3 ? rankColors[idx] : '#1D4ED8',
                                borderRadius: 4,
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

export default AdminDashboardPage;
