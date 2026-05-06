import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import {
  Card, CardContent, Typography, Box, LinearProgress,
  Avatar, Stack, Divider, Button, Chip, Skeleton,
} from '@mui/material';
import {
  MenuBook as BookIcon,
  Forum as ForumIcon,
  TrendingUp as TrendingIcon,
  CheckCircle as CheckIcon,
  QuestionAnswer as QuestionIcon,
  AccessTime as PendingIcon,
  Star as StarIcon,
  ArrowForward as ArrowIcon,
  Chat as ChatIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { forumService } from '../services/forumService';
import type { ForumQuestion } from '../types/forum';

// ── Shared components ─────────────────────────────────────────

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendColor?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title, value, subtitle, trend, trendColor, icon, iconBg, iconColor, loading,
}) => (
  <Card
    sx={{
      height: '100%',
      borderRadius: 3,
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      border: '1px solid #F3F4F6',
    }}
  >
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0, mr: 1.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              display: 'block',
              mb: 0.25,
            }}
          >
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={64} height={44} />
          ) : (
            <Typography variant="h4" fontWeight={800} color="#111827" sx={{ lineHeight: 1.15 }}>
              {value}
            </Typography>
          )}
          {subtitle && !loading && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
              {subtitle}
            </Typography>
          )}
          {trend && !loading && (
            <Typography
              variant="caption"
              sx={{ color: trendColor || '#6B7280', fontWeight: 600, mt: 0.5, display: 'block' }}
            >
              {trend}
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
  <Box
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      p: 1.25,
      borderRadius: 2,
      cursor: 'pointer',
      transition: 'background-color 0.15s',
      '&:hover': { bgcolor: '#F9FAFB' },
    }}
  >
    <Avatar sx={{ bgcolor: `${color}15`, color, width: 30, height: 30, flexShrink: 0, '& svg': { fontSize: 15 } }}>
      {icon}
    </Avatar>
    <Typography variant="body2" fontWeight={500} color="#374151" sx={{ flex: 1 }}>
      {label}
    </Typography>
    <ArrowIcon sx={{ fontSize: 15, color: '#D1D5DB' }} />
  </Box>
);

// ── Student Dashboard ─────────────────────────────────────────

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forumTotal, setForumTotal] = useState<number | null>(null);
  const [loadingForum, setLoadingForum] = useState(true);

  useEffect(() => {
    forumService
      .listQuestions({ page: 0, size: 1 })
      .then(r => setForumTotal(r.totalElements))
      .catch(() => setForumTotal(null))
      .finally(() => setLoadingForum(false));
  }, []);

  const progress = [
    { subject: 'Matemática Discreta', value: 75, color: '#2563EB' },
    { subject: 'Algoritmos e Estruturas', value: 45, color: '#D97706' },
    { subject: 'Bases de Dados', value: 60, color: '#00A651' },
    { subject: 'Redes de Computadores', value: 30, color: '#6D28D9' },
  ];

  return (
    <Grid container spacing={3}>
      {/* Metrics */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Livros Acedidos"
          value="12"
          subtitle="Biblioteca digital"
          trend="+2 esta semana"
          trendColor="#2563EB"
          icon={<BookIcon fontSize="small" />}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Questões no Fórum"
          value={forumTotal !== null ? String(forumTotal) : '—'}
          subtitle="Total na plataforma"
          trend="Clica para ver"
          trendColor="#00A651"
          icon={<ForumIcon fontSize="small" />}
          iconBg="#DCFCE7"
          iconColor="#00A651"
          loading={loadingForum}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Horas de Estudo"
          value="28h"
          subtitle="Este mês"
          trend="+6h vs semana passada"
          trendColor="#00A651"
          icon={<TrendingIcon fontSize="small" />}
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Pontos SAE"
          value="1.250"
          subtitle="Pontuação acumulada"
          trend="Nível Avançado"
          trendColor="#EC4899"
          icon={<StarIcon fontSize="small" />}
          iconBg="#FCE7F3"
          iconColor="#EC4899"
        />
      </Grid>

      {/* Progress */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card
          sx={{
            height: '100%',
            borderRadius: 3,
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
            border: '1px solid #F3F4F6',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography variant="h6" fontWeight={700} color="#111827">
                Progresso das Disciplinas
              </Typography>
              <Chip
                label="Este semestre"
                size="small"
                sx={{ bgcolor: '#F3F4F6', color: '#6B7280', fontSize: '0.72rem' }}
              />
            </Box>
            <Stack spacing={2.5}>
              {progress.map((p, i) => (
                <Box key={i}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 0.75,
                    }}
                  >
                    <Typography variant="body2" fontWeight={500} color="#374151">
                      {p.subject}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color={p.color}>
                      {p.value}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={p.value}
                    sx={{
                      height: 7,
                      borderRadius: 4,
                      bgcolor: '#F3F4F6',
                      '& .MuiLinearProgress-bar': { bgcolor: p.color, borderRadius: 4 },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Quick access */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card
          sx={{
            height: '100%',
            borderRadius: 3,
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
            border: '1px solid #F3F4F6',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} color="#111827" sx={{ mb: 0.5 }}>
              Acesso Rápido
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Navega para as tuas ferramentas
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <QuickAction
              icon={<BookIcon />}
              label="Biblioteca Digital"
              onClick={() => navigate('/app/biblioteca')}
              color="#2563EB"
            />
            <QuickAction
              icon={<ForumIcon />}
              label="Fórum de Dúvidas"
              onClick={() => navigate('/app/forum')}
              color="#00A651"
            />
            <QuickAction
              icon={<ChatIcon />}
              label="Chat com IA"
              onClick={() => navigate('/app/chat')}
              color="#D97706"
            />
          </CardContent>
        </Card>
      </Grid>

      {/* AI banner */}
      <Grid size={{ xs: 12 }}>
        <Card
          sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #001B33 0%, #1D4ED8 55%, #3B82F6 100%)',
            boxShadow: '0 4px 20px rgba(37,99,235,0.28)',
            border: 'none',
          }}
        >
          <CardContent
            sx={{
              p: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              '&:last-child': { pb: 3 },
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ color: 'rgba(255,255,255,0.55)', letterSpacing: 1, display: 'block' }}
              >
                Assistente SAE
              </Typography>
              <Typography variant="h6" color="white" fontWeight={700} sx={{ mb: 0.5 }}>
                Pronto para continuar, {user?.fullName?.split(' ')[0] || user?.username}?
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                O teu Assistente de IA está disponível para te ajudar com dúvidas,
                resumos e preparação para exames.
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => navigate('/app/chat')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2.5,
                border: '1px solid rgba(255,255,255,0.25)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                px: 3,
                py: 1,
              }}
            >
              Abrir Chat IA
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ── Professor Dashboard ───────────────────────────────────────

interface ProfStats {
  pendingCount: number;
  openCount: number;
}

const ProfessorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<ProfStats>({ pendingCount: 0, openCount: 0 });
  const [recentQuestions, setRecentQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const results = await Promise.allSettled([
        forumService.listPendingAnswers({ page: 0, size: 1 }),
        forumService.listQuestions({ questionType: 'ESPECIALIZADO', status: 'ABERTA', page: 0, size: 1 }),
        forumService.listQuestions({ questionType: 'ESPECIALIZADO', page: 0, size: 4 }),
      ]);

      const pendingResult = results[0];
      const openResult = results[1];
      const recentResult = results[2];

      setStats({
        pendingCount: pendingResult.status === 'fulfilled' ? pendingResult.value.totalElements : 0,
        openCount:    openResult.status    === 'fulfilled' ? openResult.value.totalElements    : 0,
      });

      if (recentResult.status === 'fulfilled') {
        setRecentQuestions(recentResult.value.content);
      }

      setLoading(false);
    };

    fetchAll();
  }, []);

  return (
    <Grid container spacing={3}>
      {/* Metrics */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Validações Pendentes"
          value={String(stats.pendingCount)}
          subtitle="Respostas a aprovar"
          trend={stats.pendingCount > 0 ? `${Math.min(stats.pendingCount, 3)} urgentes` : 'Tudo em dia'}
          trendColor={stats.pendingCount > 0 ? '#D97706' : '#00A651'}
          icon={<PendingIcon fontSize="small" />}
          iconBg="#FEF3C7"
          iconColor="#D97706"
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Respostas Dadas"
          value="48"
          subtitle="Fórum especializado"
          trend="+8 esta semana"
          trendColor="#00A651"
          icon={<CheckIcon fontSize="small" />}
          iconBg="#DCFCE7"
          iconColor="#00A651"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Dúvidas em Aberto"
          value={String(stats.openCount)}
          subtitle="Aguardam resposta"
          trend={stats.openCount > 0 ? 'Clica para responder' : 'Sem pendências'}
          trendColor={stats.openCount > 0 ? '#2563EB' : '#00A651'}
          icon={<QuestionIcon fontSize="small" />}
          iconBg="#DBEAFE"
          iconColor="#2563EB"
          loading={loading}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <MetricCard
          title="Avaliação"
          value="4.8"
          subtitle="Satisfação dos alunos"
          trend="Top 10% de professores"
          trendColor="#EC4899"
          icon={<StarIcon fontSize="small" />}
          iconBg="#FCE7F3"
          iconColor="#EC4899"
        />
      </Grid>

      {/* Recent questions from DB */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Card
          sx={{
            height: '100%',
            borderRadius: 3,
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
            border: '1px solid #F3F4F6',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2.5,
              }}
            >
              <Typography variant="h6" fontWeight={700} color="#111827">
                Dúvidas Recentes dos Alunos
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowIcon fontSize="small" />}
                onClick={() => navigate('/app/forum')}
                sx={{ textTransform: 'none', color: '#2563EB', fontWeight: 600 }}
              >
                Ver todas
              </Button>
            </Box>

            {loading ? (
              <Stack spacing={1.5}>
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} variant="rounded" height={68} sx={{ borderRadius: 2 }} />
                ))}
              </Stack>
            ) : recentQuestions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckIcon sx={{ fontSize: 36, color: '#DCFCE7', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Sem dúvidas recentes
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {recentQuestions.map(q => {
                  const tags = q.tags
                    ? q.tags.split(',').map(t => t.trim()).filter(Boolean)
                    : [];
                  return (
                    <Box
                      key={q.id}
                      onClick={() => navigate(`/app/forum/questions/${q.id}`)}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: '#F8FAFC',
                        borderLeft: '3px solid #D97706',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        '&:hover': { bgcolor: '#F3F4F6' },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 0.5,
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="#111827"
                          sx={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {q.titulo}
                        </Typography>
                        {q.area && (
                          <Chip
                            label={q.area}
                            size="small"
                            sx={{
                              bgcolor: '#DBEAFE',
                              color: '#2563EB',
                              fontWeight: 600,
                              fontSize: '0.62rem',
                              height: 18,
                              flexShrink: 0,
                              '& .MuiChip-label': { px: 0.75 },
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          {q.createdBy}
                        </Typography>
                        <Typography variant="caption" color="#D1D5DB">·</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(q.createdAt).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                        {tags.slice(0, 2).map(t => (
                          <Typography key={t} variant="caption" color="#9CA3AF">
                            #{t}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Quick actions */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Card
          sx={{
            height: '100%',
            borderRadius: 3,
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
            border: '1px solid #F3F4F6',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} color="#111827" sx={{ mb: 0.5 }}>
              Acções Rápidas
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Ferramentas do professor
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <QuickAction
              icon={<CheckIcon />}
              label="Validar Respostas"
              onClick={() => navigate('/app/forum/validations')}
              color="#00A651"
            />
            <QuickAction
              icon={<QuestionIcon />}
              label="Responder no Fórum"
              onClick={() => navigate('/app/forum')}
              color="#D97706"
            />
            <QuickAction
              icon={<BookIcon />}
              label="Biblioteca Digital"
              onClick={() => navigate('/app/biblioteca')}
              color="#2563EB"
            />
            <QuickAction
              icon={<AdminIcon />}
              label="Painel Administrativo"
              onClick={() => navigate('/app/admin')}
              color="#6D28D9"
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Validation banner */}
      <Grid size={{ xs: 12 }}>
        <Card
          sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #001B33 0%, #064E3B 50%, #00A651 100%)',
            boxShadow: '0 4px 20px rgba(0,166,81,0.25)',
            border: 'none',
          }}
        >
          <CardContent
            sx={{
              p: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              '&:last-child': { pb: 3 },
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ color: 'rgba(255,255,255,0.55)', letterSpacing: 1, display: 'block' }}
              >
                Fórum Colaborativo
              </Typography>
              <Typography variant="h6" color="white" fontWeight={700} sx={{ mb: 0.5 }}>
                {loading
                  ? 'A carregar...'
                  : `${stats.pendingCount} ${stats.pendingCount === 1 ? 'resposta aguarda' : 'respostas aguardam'} a tua validação`}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                Valida as respostas dos alunos no fórum colaborativo para que possam ser publicadas.
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => navigate('/app/forum/validations')}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2.5,
                border: '1px solid rgba(255,255,255,0.25)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                px: 3,
                py: 1,
              }}
            >
              Ir para Validações
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ── Root component ────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isProfessor = user?.role === 'Professor';

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#0A1628">
          Bem-vindo, {user?.fullName?.split(' ')[0] || user?.username}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isProfessor
            ? 'Resumo da actividade dos teus alunos'
            : 'O teu resumo de actividade académica'}
        </Typography>
      </Box>

      {isProfessor ? <ProfessorDashboard /> : <StudentDashboard />}
    </Box>
  );
};

export default Dashboard;
