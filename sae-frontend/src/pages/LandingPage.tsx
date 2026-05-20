import React, { useEffect, useState, useCallback, useRef } from 'react';
import { keyframes } from '@emotion/react';
import {
  Box, Typography, Button, Container, Card, CardMedia,
  AppBar, Toolbar, Chip, IconButton, Stack, CircularProgress, Avatar, Divider,
} from '@mui/material';
import {
  LibraryBooks as LibraryIcon, AutoAwesome as AiIcon,
  Login as LoginIcon, PersonAdd as RegisterIcon,
  ChevronLeft, ChevronRight, Forum as ForumIcon, Quiz as QuizIcon,
  Dashboard as DashboardIcon, SmartToy as BotIcon, MenuBook as MenuBookIcon,
  School as SchoolIcon, CheckCircleOutline as CheckIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listContents, absoluteContentUrl, type Content } from '../services/contentService';

// ─── Keyframe animations ─────────────────────────────────────────────────────
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const floatY = keyframes`
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
`;
const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;
const pulse = keyframes`
  0%,100% { box-shadow: 0 0 0 0 rgba(0,166,81,0.4); }
  50%     { box-shadow: 0 0 0 10px rgba(0,166,81,0); }
`;

// ─── Hooks ───────────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(target * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, start]);
  return count;
}

// ─── Static data ──────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <LibraryIcon sx={{ fontSize: 34 }} />, title: 'Biblioteca Digital',
    desc: 'Livros e módulos do I e II ciclo do ESG, organizados por disciplina e alinhados ao currículo nacional.',
    color: '#00A651', bg: 'rgba(0,166,81,0.08)', route: '/biblioteca', pub: true, badge: 'Acesso livre',
  },
  {
    icon: <BotIcon sx={{ fontSize: 34 }} />, title: 'Assistente IA',
    desc: 'Tira dúvidas académicas a qualquer hora. Podes perguntar sobre o livro que estás a ler.',
    color: '#2563EB', bg: 'rgba(37,99,235,0.08)', route: '/biblioteca/chat', pub: true, badge: 'Sem registo',
  },
  {
    icon: <ForumIcon sx={{ fontSize: 34 }} />, title: 'Fórum Colaborativo',
    desc: 'Interage directamente com professores especializados na área da tua dúvida.',
    color: '#7C3AED', bg: 'rgba(124,58,237,0.08)', route: '/student/forum', pub: false, badge: 'Com conta',
  },
  {
    icon: <QuizIcon sx={{ fontSize: 34 }} />, title: 'Preparação para Exames',
    desc: 'Quizzes por disciplina para te preparares para os exames nacionais do ensino secundário.',
    color: '#D97706', bg: 'rgba(217,119,6,0.08)', route: '/student/quiz', pub: false, badge: 'Com conta',
  },
];

const PARTNERS = ['MINED', 'União Europeia', 'Terre des Hommes', 'IEDA', 'VaMoz Digital'];
const SLIDE_INTERVAL = 5000;

// ─── Component ────────────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [books, setBooks] = useState<Content[]>([]);
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chatStep, setChatStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [statsRef, statsInView] = useInView(0.3);
  const [featRef,  featInView]  = useInView();
  const [howRef,   howInView]   = useInView();
  const [aiRef,    aiInView]    = useInView();
  const [booksRef, booksInView] = useInView();

  const s0 = useCountUp(8000, 1800, statsInView);
  const s1 = useCountUp(150,  1600, statsInView);
  const s2 = useCountUp(12,   1200, statsInView);

  useEffect(() => {
    listContents({ page: 0, size: 8 })
      .then(r => setBooks(r.content))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  const next = useCallback(() => setSlide(s => (s + 1) % Math.max(books.length, 1)), [books.length]);
  const prev = useCallback(() => setSlide(s => (s - 1 + Math.max(books.length, 1)) % Math.max(books.length, 1)), [books.length]);

  useEffect(() => {
    if (books.length < 2) return;
    timerRef.current = setInterval(next, SLIDE_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [books.length, next]);

  // Animate the AI chat demo when section enters view
  useEffect(() => {
    if (!aiInView) return;
    const t1 = setTimeout(() => setChatStep(1), 500);
    const t2 = setTimeout(() => setChatStep(2), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [aiInView]);

  function getDashboardRoute() {
    const role = user?.role || '';
    if (role === 'Administrador de Escola' || role === 'SCHOOL_ADMIN') return '/school-admin/dashboard';
    if (role.includes('ADMIN') || role.includes('Administrador')) return '/admin/dashboard';
    if (role.includes('PROFESSOR') || role.includes('Professor')) return '/professor/dashboard';
    return '/student/dashboard';
  }

  const current = books[slide];
  const pauseSlider = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const resumeSlider = () => { if (books.length >= 2) timerRef.current = setInterval(next, SLIDE_INTERVAL); };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', overflowX: 'hidden' }}>

      {/* ── Utility bar ── */}
      <Box sx={{ bgcolor: '#001220', py: 0.6, display: { xs: 'none', md: 'block' } }}>
        <Container maxWidth="xl">
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>
              Sistema de Apoio ao Estudante · República de Moçambique · Cidade de Nampula
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
              Projecto Abraço Digital — NDICI África /2023/442-998
            </Typography>
          </Stack>
        </Container>
      </Box>

      {/* ── Sticky nav ── */}
      <AppBar position="sticky" elevation={0}
        sx={{ bgcolor: '#fff', borderBottom: '3px solid #00A651', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
        <Container maxWidth="xl" disableGutters>
          <Toolbar sx={{ minHeight: '64px !important', px: { xs: 2, md: 3 }, gap: 2 }}>
            {/* Logo */}
            <Stack direction="row" alignItems="center" spacing={1.5} onClick={() => navigate('/')}
              sx={{ cursor: 'pointer', mr: { xs: 0, md: 3 }, flexShrink: 0 }}>
              <Box sx={{
                width: 42, height: 42, borderRadius: '10px',
                background: 'linear-gradient(135deg,#00A651 0%,#006B34 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(0,166,81,0.3)',
              }}>
                <MenuBookIcon sx={{ fontSize: 22, color: '#fff' }} />
              </Box>
              <Box>
                <Typography fontWeight={900} sx={{ color: '#001B33', lineHeight: 1, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
                  Smart<Box component="span" sx={{ color: '#00A651' }}>SAE</Box>
                </Typography>
                <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.6rem', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  Educação Digital
                </Typography>
              </Box>
            </Stack>

            {/* Nav links */}
            <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' }, flex: 1 }}>
              {[
                { label: 'Início', path: '/' },
                { label: 'Biblioteca', path: '/biblioteca' },
                { label: 'Chat IA', path: '/biblioteca/chat' },
              ].map(item => (
                <Button key={item.label} onClick={() => navigate(item.path)}
                  sx={{ color: '#374151', textTransform: 'none', fontWeight: 600, px: 2, fontSize: '0.88rem', borderRadius: 2, '&:hover': { color: '#00A651', bgcolor: 'rgba(0,166,81,0.05)' } }}>
                  {item.label}
                </Button>
              ))}
            </Stack>

            <Box sx={{ flex: 1, display: { xs: 'block', md: 'none' } }} />

            {/* Auth buttons */}
            {isAuthenticated ? (
              <Button variant="contained" onClick={() => navigate(getDashboardRoute())} startIcon={<DashboardIcon />}
                sx={{ textTransform: 'none', bgcolor: '#00A651', '&:hover': { bgcolor: '#008C44' }, borderRadius: 2, fontWeight: 700, px: 3 }}>
                Meu Portal
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button onClick={() => navigate('/login')}
                  sx={{ textTransform: 'none', color: '#374151', fontWeight: 600, display: { xs: 'none', sm: 'flex' } }}>
                  Entrar
                </Button>
                <Button variant="contained" onClick={() => navigate('/register')} startIcon={<RegisterIcon />}
                  sx={{ textTransform: 'none', bgcolor: '#00A651', '&:hover': { bgcolor: '#008C44' }, borderRadius: 2, fontWeight: 700 }}>
                  Registar
                </Button>
              </Stack>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* ═══════════════════════════════════ HERO ═══════════════════════════════════ */}
      <Box sx={{
        background: 'linear-gradient(150deg,#001220 0%,#002B14 55%,#001220 100%)',
        position: 'relative', overflow: 'hidden',
        pt: { xs: 8, md: 10 }, pb: { xs: 8, md: 12 },
      }}>
        {/* Decorative floating circles */}
        {[180, 260, 340, 420].map((size, i) => (
          <Box key={i} sx={{
            position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
            width: size, height: size,
            top: `${i * 70 - 80}px`, right: `${i * 30 - 60}px`,
            bgcolor: i % 2 === 0 ? 'rgba(0,166,81,0.05)' : 'rgba(74,222,128,0.03)',
            animation: `${floatY} ${3.5 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }} />
        ))}

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: { xs: 7, lg: 10 }, alignItems: 'center' }}>

            {/* ── Left: text ── */}
            <Box sx={{ flex: 1, maxWidth: { lg: 580 } }}>
              {/* Badge */}
              <Box sx={{ animation: `${fadeInUp} 0.55s ease both`, animationDelay: '0ms', mb: 3 }}>
                <Chip
                  icon={<SchoolIcon sx={{ fontSize: '14px !important', color: '#4ADE80 !important' }} />}
                  label="Sistema Oficial · Nampula · Moçambique"
                  size="small"
                  sx={{ bgcolor: 'rgba(0,166,81,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.2)', fontWeight: 600, fontSize: '0.72rem', px: 0.5 }}
                />
              </Box>

              {/* H1 with shimmer */}
              <Box sx={{ animation: `${fadeInUp} 0.65s ease both`, animationDelay: '100ms', mb: 3 }}>
                <Typography variant="h1" fontWeight={900} sx={{
                  color: '#fff', lineHeight: 1.08,
                  fontSize: { xs: '2.3rem', sm: '3rem', md: '3.6rem', lg: '3.9rem' },
                  letterSpacing: '-1.5px',
                }}>
                  Aprende<br />
                  <Box component="span" sx={{
                    background: 'linear-gradient(90deg,#00A651 0%,#4ADE80 40%,#00A651 100%)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    animation: `${shimmer} 3s linear infinite`,
                    display: 'inline-block',
                  }}>
                    Sem Limites
                  </Box>
                  <br />com o SAE
                </Typography>
              </Box>

              {/* Description */}
              <Box sx={{ animation: `${fadeInUp} 0.65s ease both`, animationDelay: '200ms', mb: 5 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.85, fontSize: { xs: '0.95rem', md: '1.05rem' }, maxWidth: 500 }}>
                  Acede gratuitamente à biblioteca digital do ensino secundário moçambicano.
                  Livros, fórum com professores, quizzes e assistente de IA —{' '}
                  <Box component="span" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>online e offline</Box>.
                </Typography>
              </Box>

              {/* CTA buttons */}
              <Box sx={{ animation: `${fadeInUp} 0.65s ease both`, animationDelay: '300ms', mb: 6 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button variant="contained" size="large" startIcon={<LibraryIcon />}
                    onClick={() => navigate('/biblioteca')}
                    sx={{
                      bgcolor: '#00A651', textTransform: 'none', borderRadius: 2.5, px: 4, py: 1.5, fontWeight: 700, fontSize: '0.95rem',
                      boxShadow: '0 4px 20px rgba(0,166,81,0.4)', transition: 'all 0.22s',
                      '&:hover': { bgcolor: '#008C44', transform: 'translateY(-2px)', boxShadow: '0 8px 28px rgba(0,166,81,0.45)' },
                    }}>
                    Explorar Biblioteca
                  </Button>
                  <Button variant="outlined" size="large" startIcon={<AiIcon />}
                    onClick={() => navigate('/biblioteca/chat')}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.2)', color: '#fff', textTransform: 'none', borderRadius: 2.5, px: 4, py: 1.5, fontWeight: 600,
                      transition: 'all 0.22s',
                      '&:hover': { borderColor: '#4ADE80', bgcolor: 'rgba(0,166,81,0.1)', transform: 'translateY(-2px)' },
                    }}>
                    Perguntar à IA
                  </Button>
                </Stack>
              </Box>

              {/* Trust list */}
              <Box sx={{ animation: `${fadeInUp} 0.65s ease both`, animationDelay: '400ms' }}>
                <Stack spacing={1.25}>
                  {[
                    'Conteúdo alinhado ao currículo nacional (SNE)',
                    'Disponível offline — sem necessidade de internet',
                    'Acesso livre à Biblioteca e Chat IA sem conta',
                  ].map(t => (
                    <Stack key={t} direction="row" spacing={1.5} alignItems="center">
                      <CheckIcon sx={{ fontSize: 15, color: '#4ADE80', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.83rem' }}>{t}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Box>

            {/* ── Right: book showcase ── */}
            <Box
              sx={{ flex: '0 0 auto', width: { xs: '100%', md: 480, lg: 460 }, animation: `${slideInRight} 0.9s ease both`, animationDelay: '150ms' }}
              onMouseEnter={pauseSlider}
              onMouseLeave={resumeSlider}
            >
              <Box sx={{
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden',
                bgcolor: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)',
                boxShadow: '0 24px 72px rgba(0,0,0,0.5)',
              }}>
                {/* Window chrome */}
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Stack direction="row" spacing={0.5}>
                      {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
                        <Box key={c} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c }} />
                      ))}
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                      ÚLTIMOS RECURSOS
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton onClick={prev} size="small" sx={{ color: 'rgba(255,255,255,0.4)', p: 0.5, '&:hover': { color: '#fff' } }}>
                      <ChevronLeft sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton onClick={next} size="small" sx={{ color: 'rgba(255,255,255,0.4)', p: 0.5, '&:hover': { color: '#fff' } }}>
                      <ChevronRight sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Stack>
                </Box>

                {/* Slide content */}
                {loading ? (
                  <Box sx={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress sx={{ color: '#00A651' }} size={32} />
                  </Box>
                ) : books.length === 0 ? (
                  <Box sx={{ height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <LibraryIcon sx={{ fontSize: 52, color: 'rgba(255,255,255,0.1)' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.25)' }}>Sem recursos disponíveis</Typography>
                  </Box>
                ) : (
                  <Box onClick={() => navigate(`/biblioteca/leitor/${current?.id}`)} sx={{ cursor: 'pointer' }}>
                    <Box sx={{ height: 260, overflow: 'hidden', position: 'relative' }}>
                      {current?.thumbnailUrl ? (
                        <CardMedia
                          component="img"
                          height="260"
                          image={absoluteContentUrl(current.thumbnailUrl) || ''}
                          alt={current.title}
                          sx={{ objectFit: 'cover', transition: 'transform 0.6s ease', '&:hover': { transform: 'scale(1.04)' } }}
                        />
                      ) : (
                        <Box sx={{ height: 260, background: 'linear-gradient(135deg,rgba(0,166,81,0.12),rgba(0,50,30,0.25))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <LibraryIcon sx={{ fontSize: 72, color: 'rgba(0,166,81,0.2)' }} />
                        </Box>
                      )}
                      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.6) 0%,transparent 55%)' }} />
                    </Box>

                    <Box sx={{ p: 3 }}>
                      <Stack direction="row" spacing={0.75} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                        {current?.discipline && (
                          <Chip label={current.discipline} size="small"
                            sx={{ bgcolor: 'rgba(0,166,81,0.18)', color: '#4ADE80', fontSize: '0.65rem', height: 20, fontWeight: 700 }} />
                        )}
                        {current?.level && (
                          <Chip label={current.level} size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', height: 20 }} />
                        )}
                      </Stack>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#fff', lineHeight: 1.3, mb: 0.75, fontSize: '1rem' }}>
                        {current?.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.55 }}>
                        {current?.description || 'Conteúdo educativo alinhado ao currículo nacional moçambicano.'}
                      </Typography>
                      <Button size="small" variant="contained" sx={{ mt: 2, bgcolor: '#00A651', '&:hover': { bgcolor: '#008C44' }, textTransform: 'none', borderRadius: 1.5, fontWeight: 700, fontSize: '0.8rem' }}>
                        Ler agora →
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Dots */}
                {books.length > 1 && (
                  <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ pb: 2.5 }}>
                    {books.slice(0, 8).map((_, i) => (
                      <Box key={i} onClick={(e) => { e.stopPropagation(); setSlide(i); }}
                        sx={{
                          width: i === slide ? 22 : 6, height: 6, borderRadius: 3, cursor: 'pointer',
                          bgcolor: i === slide ? '#00A651' : 'rgba(255,255,255,0.15)',
                          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                        }} />
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ═══════════════════════════════════ STATS BAR ═══════════════════════════════════ */}
      <Box ref={statsRef} sx={{ bgcolor: '#00A651', py: 5 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2 }}>
            {[
              { count: s0, suffix: '+', label: 'Estudantes Activos' },
              { count: s1, suffix: '+', label: 'Recursos Digitais'  },
              { count: s2, suffix: '',  label: 'Disciplinas'        },
            ].map((s, i) => (
              <Box key={i} sx={{ textAlign: 'center' }}>
                <Typography variant="h3" fontWeight={900} sx={{ color: '#fff', lineHeight: 1, fontSize: { xs: '1.8rem', md: '2.6rem' } }}>
                  {s.count.toLocaleString()}{s.suffix}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.5, fontWeight: 500 }}>
                  {s.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════════════════════════════ FEATURES ═══════════════════════════════════ */}
      <Box ref={featRef} sx={{ py: { xs: 10, md: 14 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Box sx={{
            textAlign: 'center', mb: 9,
            animation: featInView ? `${fadeInUp} 0.7s ease both` : 'none',
            opacity: featInView ? undefined : 0,
          }}>
            <Chip label="Recursos da Plataforma" size="small"
              sx={{ bgcolor: '#E8F5EE', color: '#00A651', fontWeight: 700, mb: 2.5, fontSize: '0.75rem' }} />
            <Typography variant="h3" fontWeight={900} sx={{ color: '#001B33', mb: 2, fontSize: { xs: '1.9rem', md: '2.6rem' } }}>
              Tudo o que precisas para estudar
            </Typography>
            <Typography color="#6B7280" sx={{ maxWidth: 520, mx: 'auto', lineHeight: 1.8, fontSize: '1rem' }}>
              Uma plataforma completa, gratuita e acessível a todos os estudantes
              do ensino secundário moçambicano.
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }, gap: 3 }}>
            {FEATURES.map((f, i) => (
              <Card key={f.title} elevation={0}
                onClick={() => navigate(f.pub ? f.route : (isAuthenticated ? f.route : '/login'))}
                sx={{
                  border: '1.5px solid #F0F0F0', borderRadius: 4, cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                  '&:hover': { borderColor: f.color, transform: 'translateY(-6px)', boxShadow: `0 14px 36px ${f.color}22` },
                  animation: featInView ? `${fadeInUp} 0.7s ease both` : 'none',
                  opacity: featInView ? undefined : 0,
                  animationDelay: `${i * 80}ms`,
                }}>
                <Box sx={{ p: 3.5 }}>
                  <Box sx={{ position: 'relative', mb: 3, display: 'inline-block' }}>
                    <Avatar sx={{ bgcolor: f.bg, color: f.color, width: 60, height: 60, borderRadius: 3 }}>{f.icon}</Avatar>
                    <Chip label={f.badge} size="small"
                      sx={{ position: 'absolute', top: -8, right: -14, bgcolor: f.color, color: '#fff', fontSize: '0.6rem', height: 18, fontWeight: 700 }} />
                  </Box>
                  <Typography fontWeight={800} sx={{ color: '#001B33', mb: 1.25, fontSize: '1rem' }}>{f.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.72, mb: 3, fontSize: '0.84rem' }}>{f.desc}</Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: f.color }}>
                    <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.82rem' }}>Aceder</Typography>
                    <ArrowIcon sx={{ fontSize: 14 }} />
                  </Stack>
                </Box>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════════════════════════════ HOW IT WORKS ═══════════════════════════════════ */}
      <Box ref={howRef} sx={{ py: { xs: 10, md: 13 }, bgcolor: '#F8FAFC' }}>
        <Container maxWidth="md">
          <Box sx={{
            textAlign: 'center', mb: 9,
            animation: howInView ? `${fadeInUp} 0.7s ease both` : 'none',
            opacity: howInView ? undefined : 0,
          }}>
            <Typography variant="h3" fontWeight={900} sx={{ color: '#001B33', mb: 2, fontSize: { xs: '1.9rem', md: '2.4rem' } }}>
              Como funciona?
            </Typography>
            <Typography color="#6B7280">Começa em menos de 2 minutos — sem instalação necessária</Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, gap: 5, position: 'relative' }}>
            {/* Connecting line desktop */}
            <Box sx={{
              display: { xs: 'none', md: 'block' }, position: 'absolute',
              top: 32, left: '17%', right: '17%', height: 2,
              background: 'linear-gradient(90deg,#00A651 0%,#4ADE80 50%,#00A651 100%)', zIndex: 0,
            }} />

            {[
              { step: '01', title: 'Explora livremente', desc: 'Acede à biblioteca e ao Chat IA sem precisar de criar conta. Pesquisa por disciplina, nível ou tema.' },
              { step: '02', title: 'Regista-te (opcional)', desc: 'Conta gratuita para guardar favoritos, definir metas de estudo e receber sugestões personalizadas pela IA.' },
              { step: '03', title: 'Estuda e evolui', desc: 'Faz quizzes, coloca dúvidas no fórum com professores e usa o assistente de IA a qualquer hora do dia.' },
            ].map((item, i) => (
              <Box key={item.step} sx={{
                textAlign: 'center', position: 'relative', zIndex: 1,
                animation: howInView ? `${fadeInUp} 0.7s ease both` : 'none',
                opacity: howInView ? undefined : 0,
                animationDelay: `${i * 130}ms`,
              }}>
                <Box sx={{
                  width: 64, height: 64, borderRadius: '50%', mx: 'auto', mb: 3.5,
                  background: 'linear-gradient(135deg,#001B33 0%,#003D1A 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 18px rgba(0,27,51,0.28)', border: '3px solid #fff',
                }}>
                  <Typography fontWeight={900} sx={{ color: '#00A651', fontSize: '1.1rem' }}>{item.step}</Typography>
                </Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: '#001B33', mb: 1.5 }}>{item.title}</Typography>
                <Typography variant="body2" color="#6B7280" sx={{ lineHeight: 1.78 }}>{item.desc}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════════════════════════════ AI SECTION ═══════════════════════════════════ */}
      <Box ref={aiRef} sx={{ bgcolor: '#001220', py: { xs: 10, md: 14 }, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', bgcolor: 'rgba(0,166,81,0.04)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -80, left: '20%', width: 300, height: 300, borderRadius: '50%', bgcolor: 'rgba(0,166,81,0.03)', pointerEvents: 'none' }} />

        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: { xs: 8, lg: 12 }, alignItems: 'center' }}>

            {/* Chat mockup */}
            <Box sx={{
              flex: '0 0 auto', width: { xs: '100%', lg: 440 },
              animation: aiInView ? `${slideInRight} 0.8s ease both` : 'none',
              opacity: aiInView ? undefined : 0,
            }}>
              <Box sx={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', bgcolor: '#0D2137', boxShadow: '0 24px 72px rgba(0,0,0,0.55)' }}>
                {/* Header */}
                <Box sx={{ bgcolor: '#001B33', px: 3, py: 2, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#00A651', width: 32, height: 32, animation: aiInView ? `${pulse} 2s infinite` : 'none' }}>
                    <BotIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#fff', lineHeight: 1 }}>Assistente IA · SAE</Typography>
                    <Typography variant="caption" sx={{ color: '#4ADE80', fontSize: '0.65rem' }}>● Online agora</Typography>
                  </Box>
                </Box>

                {/* Messages */}
                <Box sx={{ p: 3, minHeight: 200, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {chatStep === 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 160 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.18)', fontStyle: 'italic', fontSize: '0.82rem' }}>
                        Faz uma pergunta académica…
                      </Typography>
                    </Box>
                  )}
                  {chatStep >= 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', animation: `${fadeInUp} 0.4s ease` }}>
                      <Box sx={{ bgcolor: '#00A651', color: '#fff', px: 2.5, py: 1.5, borderRadius: '16px 4px 16px 16px', maxWidth: '85%' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.83rem', lineHeight: 1.55 }}>
                          Explica a segunda lei de Newton com exemplos
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {chatStep >= 2 && (
                    <Box sx={{ display: 'flex', gap: 1.5, animation: `${fadeInUp} 0.5s ease` }}>
                      <Avatar sx={{ bgcolor: '#001B33', width: 28, height: 28, flexShrink: 0, mt: 0.5 }}>
                        <BotIcon sx={{ fontSize: 14 }} />
                      </Avatar>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', px: 2.5, py: 1.75, borderRadius: '4px 16px 16px 16px', maxWidth: '85%' }}>
                        <Typography variant="body2" sx={{ color: '#E5E7EB', fontSize: '0.83rem', lineHeight: 1.7 }}>
                          A segunda lei de Newton: <Box component="span" sx={{ color: '#4ADE80', fontWeight: 700 }}>F = m × a</Box><br /><br />
                          Bola de 2 kg com aceleração de 3 m/s²<br />
                          → F = 2 × 3 = <Box component="span" sx={{ color: '#4ADE80', fontWeight: 700 }}>6 Newton</Box>
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Input mockup */}
                <Box sx={{ px: 3, pb: 3 }}>
                  <Box sx={{ bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 2.5, px: 2.5, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.82rem', flex: 1 }}>
                      Coloca a tua dúvida académica…
                    </Typography>
                    <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: '#00A651', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ArrowIcon sx={{ fontSize: 14, color: '#fff' }} />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Description */}
            <Box sx={{
              flex: 1,
              animation: aiInView ? `${fadeInUp} 0.8s ease both` : 'none',
              opacity: aiInView ? undefined : 0,
              animationDelay: '150ms',
            }}>
              <Chip label="Inteligência Artificial" size="small"
                sx={{ bgcolor: 'rgba(0,166,81,0.15)', color: '#4ADE80', fontWeight: 700, mb: 3, border: '1px solid rgba(74,222,128,0.2)' }} />
              <Typography variant="h3" fontWeight={900} sx={{ color: '#fff', mb: 3, lineHeight: 1.15, fontSize: { xs: '1.9rem', md: '2.5rem' } }}>
                Suporte imediato<br />
                <Box component="span" sx={{ color: '#4ADE80' }}>24 horas por dia</Box>
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.9, mb: 5, fontSize: '1rem' }}>
                O assistente de IA responde a dúvidas de qualquer disciplina — Matemática, Física, História, Português e muito mais.
                Podes também perguntar sobre um livro específico enquanto o estás a ler.
              </Typography>
              <Stack spacing={2} sx={{ mb: 5 }}>
                {[
                  'Explicações detalhadas com exemplos práticos',
                  'Restrito exclusivamente a temas académicos',
                  'Disponível sem registo — acesso imediato',
                  'Contexto do livro que estás a ler na biblioteca',
                ].map(t => (
                  <Stack key={t} direction="row" spacing={1.5} alignItems="center">
                    <CheckIcon sx={{ fontSize: 16, color: '#4ADE80', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{t}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Button variant="contained" size="large" startIcon={<BotIcon />}
                onClick={() => navigate(isAuthenticated ? '/chat' : '/biblioteca/chat')}
                sx={{
                  bgcolor: '#00A651', textTransform: 'none', borderRadius: 2.5, px: 4, py: 1.5, fontWeight: 700,
                  boxShadow: '0 4px 18px rgba(0,166,81,0.3)', transition: 'all 0.22s',
                  '&:hover': { bgcolor: '#008C44', transform: 'translateY(-2px)', boxShadow: '0 8px 28px rgba(0,166,81,0.4)' },
                }}>
                Experimentar agora
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ═══════════════════════════════════ RECENT BOOKS ═══════════════════════════════════ */}
      {books.length > 0 && (
        <Box ref={booksRef} sx={{ py: { xs: 10, md: 13 }, bgcolor: '#fff' }}>
          <Container maxWidth="lg">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 8 }}>
              <Box sx={{ animation: booksInView ? `${fadeInUp} 0.7s ease both` : 'none', opacity: booksInView ? undefined : 0 }}>
                <Chip label="Biblioteca Digital" size="small" sx={{ bgcolor: '#E8F5EE', color: '#00A651', fontWeight: 700, mb: 2 }} />
                <Typography variant="h4" fontWeight={900} sx={{ color: '#001B33' }}>Recursos Recentes</Typography>
              </Box>
              <Button endIcon={<ArrowIcon />} onClick={() => navigate('/biblioteca')}
                sx={{ textTransform: 'none', color: '#00A651', fontWeight: 700, display: { xs: 'none', sm: 'flex' } }}>
                Ver todos
              </Button>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', md: 'repeat(4,1fr)' }, gap: 3 }}>
              {books.slice(0, 8).map((book, i) => (
                <Card key={book.id} elevation={0}
                  onClick={() => navigate(`/biblioteca/leitor/${book.id}`)}
                  sx={{
                    border: '1px solid #F0F0F0', borderRadius: 3, cursor: 'pointer', overflow: 'hidden',
                    transition: 'all 0.22s',
                    '&:hover': { borderColor: '#00A651', transform: 'translateY(-5px)', boxShadow: '0 10px 28px rgba(0,166,81,0.13)' },
                    animation: booksInView ? `${fadeInUp} 0.6s ease both` : 'none',
                    opacity: booksInView ? undefined : 0,
                    animationDelay: `${i * 60}ms`,
                  }}>
                  {book.thumbnailUrl ? (
                    <CardMedia component="img" height="160" image={absoluteContentUrl(book.thumbnailUrl) || ''} alt={book.title} sx={{ objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ height: 160, bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LibraryIcon sx={{ fontSize: 40, color: '#D1D5DB' }} />
                    </Box>
                  )}
                  <Box sx={{ p: 2 }}>
                    {book.discipline && (
                      <Chip label={book.discipline} size="small"
                        sx={{ bgcolor: '#E8F5EE', color: '#00A651', fontSize: '0.6rem', height: 18, mb: 1, fontWeight: 700 }} />
                    )}
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#001B33', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.83rem' }}>
                      {book.title}
                    </Typography>
                  </Box>
                </Card>
              ))}
            </Box>
          </Container>
        </Box>
      )}

      {/* ═══════════════════════════════════ CTA (guests only) ═══════════════════════════════════ */}
      {!isAuthenticated && (
        <Box sx={{ background: 'linear-gradient(135deg,#001B33 0%,#003D1A 100%)', py: { xs: 10, md: 13 } }}>
          <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 52, color: '#00A651', mb: 3, animation: `${floatY} 3s ease-in-out infinite` }} />
            <Typography variant="h3" fontWeight={900} sx={{ color: '#fff', mb: 2.5, fontSize: { xs: '1.9rem', md: '2.4rem' } }}>
              Pronto para começar?
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 6, lineHeight: 1.9 }}>
              Cria a tua conta gratuitamente e desbloqueia favoritos, metas de estudo,
              historial de leitura e sugestões personalizadas pela IA.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button variant="contained" size="large" onClick={() => navigate('/register')}
                sx={{
                  bgcolor: '#00A651', textTransform: 'none', borderRadius: 2.5, px: 5, py: 1.5, fontWeight: 700,
                  boxShadow: '0 4px 20px rgba(0,166,81,0.4)', transition: 'all 0.22s',
                  '&:hover': { bgcolor: '#008C44', transform: 'translateY(-2px)' },
                }}>
                Criar conta grátis
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/login')}
                sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff', textTransform: 'none', borderRadius: 2.5, px: 5, py: 1.5, fontWeight: 600, '&:hover': { borderColor: 'rgba(255,255,255,0.45)' } }}>
                Já tenho conta
              </Button>
            </Stack>
          </Container>
        </Box>
      )}

      {/* ═══════════════════════════════════ PARTNERS ═══════════════════════════════════ */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#F8FAFC', borderTop: '1px solid #EBEBEB' }}>
        <Container maxWidth="lg">
          <Typography variant="overline" sx={{ display: 'block', textAlign: 'center', color: '#9CA3AF', mb: 5, letterSpacing: 2.5, fontSize: '0.7rem' }}>
            DESENVOLVIDO EM PARCERIA COM
          </Typography>
          <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={3} alignItems="center">
            {PARTNERS.map(p => (
              <Box key={p} sx={{
                px: 4, py: 2.25, border: '1.5px solid #E5E7EB', borderRadius: 2.5, bgcolor: '#fff',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#00A651', boxShadow: '0 4px 14px rgba(0,166,81,0.1)', transform: 'translateY(-2px)' },
              }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#374151' }}>{p}</Typography>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* ═══════════════════════════════════ FOOTER ═══════════════════════════════════ */}
      <Box sx={{ bgcolor: '#001220', pt: 9, pb: 5 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 7, mb: 7 }}>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#00A651', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MenuBookIcon sx={{ fontSize: 21, color: '#fff' }} />
                </Box>
                <Typography fontWeight={900} sx={{ color: '#fff', fontSize: '1.15rem' }}>
                  Smart<Box component="span" sx={{ color: '#00A651' }}>SAE</Box>
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.32)', lineHeight: 1.9, maxWidth: 320 }}>
                Sistema de Apoio ao Estudante do ensino secundário geral. Iniciativa do projecto Abraço Digital, financiado pela União Europeia e implementado pela Terre des Hommes.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#fff', mb: 3 }}>Acesso Rápido</Typography>
              <Stack spacing={1.75}>
                {[
                  { label: 'Biblioteca Digital', path: '/biblioteca' },
                  { label: 'Assistente de IA', path: '/biblioteca/chat' },
                  { label: 'Entrar na plataforma', path: '/login' },
                  { label: 'Criar conta gratuita', path: '/register' },
                ].map(item => (
                  <Typography key={item.label} variant="body2" onClick={() => navigate(item.path)}
                    sx={{ color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.875rem', transition: 'color 0.2s', '&:hover': { color: '#4ADE80' } }}>
                    {item.label}
                  </Typography>
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#fff', mb: 3 }}>Projecto</Typography>
              <Stack spacing={1.75}>
                {['NDICI África /2023/442-998', 'Cidade de Nampula, Moçambique', 'Ministério da Educação', `© ${new Date().getFullYear()} SmartSAE`].map(t => (
                  <Typography key={t} variant="body2" sx={{ color: 'rgba(255,255,255,0.32)', fontSize: '0.875rem' }}>{t}</Typography>
                ))}
              </Stack>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 4 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" gap={1.5}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.72rem' }}>
              © {new Date().getFullYear()} SmartSAE · Todos os direitos reservados
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.72rem' }}>
              Abraço Digital · Terre des Hommes · União Europeia · Agência Italiana
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
