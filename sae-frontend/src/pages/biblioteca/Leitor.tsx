import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, Stack, IconButton, CircularProgress,
  Alert, Card, CardContent, Dialog, DialogContent, DialogActions,
  TextField, Divider, MenuItem, Snackbar, LinearProgress, Radio,
  RadioGroup, FormControlLabel, FormControl,
} from '@mui/material';
import {
  ArrowBack as BackIcon, CloudDone as OfflineIcon, Public as PublicIcon,
  MenuBook as PagesIcon, EmojiEvents as GoalIcon, Person as AuthorIcon,
  CalendarToday as CalendarIcon, School as SchoolIcon, Category as CatIcon,
  CloudDownload as SaveOfflineIcon, DeleteOutline as RemoveOfflineIcon,
  CheckCircle as CheckIcon, Cancel as CancelIcon, AutoAwesome as AIIcon,
  Quiz as QuizIcon, EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import PdfReader from '../../components/biblioteca/PdfReader';
import {
  getContentById, getProgress, readUrl, createGoal, absoluteContentUrl,
  listSections, listSectionProgress, completeSectionProgress,
  type Content, type ReadingProgressView, type ContentSection, type SectionProgress,
} from '../../services/contentService';
import { quizService } from '../../services/quizService';
import type { Quiz, AttemptAnswer } from '../../types/quiz';
import { useOfflineContent } from '../../hooks/useOfflineContent';
import SpeechButton from '../../components/biblioteca/SpeechButton';

const FREQ_OPTIONS = [
  { value: 'DAILY',          label: 'Diário' },
  { value: 'EVERY_2_DAYS',   label: 'A cada 2 dias' },
  { value: 'WEEKLY',         label: 'Semanal' },
  { value: 'BEFORE_DEADLINE', label: 'Antes do prazo' },
];

const Leitor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const offline = useOfflineContent();

  /** Página explicitamente pedida via query string (?page=N). Tem prioridade sobre o progresso guardado. */
  const requestedPage = Number(searchParams.get('page'));
  const hasRequestedPage = !!requestedPage && requestedPage > 0;

  const [content, setContent] = useState<Content | null>(null);
  const [initialPage, setInitialPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [introOpen, setIntroOpen] = useState(true);
  const [goalStep, setGoalStep] = useState(false);

  // Section tracking
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [sectionProgressMap, setSectionProgressMap] = useState<Record<string, SectionProgress>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const triggeredSections = useRef<Set<string>>(new Set());

  // Section quiz modal
  const [sectionQuizModal, setSectionQuizModal] = useState<{
    section: ContentSection;
    quiz: Quiz | null;
    loading: boolean;
  } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizAttemptId, setQuizAttemptId] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<{ score: number; correct: number; total: number; details: any[] } | null>(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizCurrentIdx, setQuizCurrentIdx] = useState(0);

  // goal form
  const [goalPages, setGoalPages] = useState<number>(0);
  const [goalDaily, setGoalDaily] = useState<number>(0);
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalFreq, setGoalFreq] = useState('DAILY');
  const [goalEmail, setGoalEmail] = useState('');
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalSaved, setGoalSaved] = useState(false);
  const [offlineSnack, setOfflineSnack] = useState<string | null>(null);

  const isAuthed = !!localStorage.getItem('sae_token');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getContentById(id),
      isAuthed
        ? getProgress(id).catch(() => null as ReadingProgressView | null)
        : Promise.resolve(null),
    ])
      .then(([c, prog]) => {
        setContent(c);
        // Prioridade: ?page=N na URL (sugestão do professor) > progresso guardado > 1
        if (hasRequestedPage) {
          setInitialPage(requestedPage);
          setCurrentPage(requestedPage);
        } else if (prog?.currentPage) {
          setInitialPage(prog.currentPage);
          setCurrentPage(prog.currentPage);
        }
      })
      .catch(e => setError(e?.message || 'Conteúdo não encontrado'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hasRequestedPage, requestedPage]);

  // Load sections and progress when content is ready
  useEffect(() => {
    if (!id || !isAuthed) return;
    listSections(id).then(setSections).catch(() => {});
    listSectionProgress(id).then(list => {
      const map: Record<string, SectionProgress> = {};
      list.forEach(sp => { map[sp.sectionId] = sp; });
      setSectionProgressMap(map);
    }).catch(() => {});
  }, [id, isAuthed]);

  // Detect section completion when page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    if (!isAuthed || !id) return;
    const completed = sections.find(
      s => page >= s.endPage && !triggeredSections.current.has(s.id) && !sectionProgressMap[s.id]?.completed
    );
    if (completed) {
      triggeredSections.current.add(completed.id);
      // Load and show quiz for this section if it has one
      if (completed.quizId) {
        setSectionQuizModal({ section: completed, quiz: null, loading: true });
        setQuizAnswers({});
        setQuizResult(null);
        setQuizCurrentIdx(0);
        setQuizAttemptId(null);
        quizService.getQuiz(completed.quizId)
          .then(quiz => setSectionQuizModal(m => m ? { ...m, quiz, loading: false } : null))
          .catch(() => setSectionQuizModal(m => m ? { ...m, loading: false } : null));
      } else {
        setSectionQuizModal({ section: completed, quiz: null, loading: false });
        setQuizAnswers({});
        setQuizResult(null);
        setQuizCurrentIdx(0);
        setQuizAttemptId(null);
      }
    }
  }, [sections, sectionProgressMap, isAuthed, id]);

  const handleSectionQuizSubmit = async () => {
    if (!sectionQuizModal?.quiz || !id) return;
    const quiz = sectionQuizModal.quiz;
    setQuizSubmitting(true);
    try {
      let attemptId = quizAttemptId;
      if (!attemptId) {
        const started = await quizService.startAttempt(quiz.id);
        attemptId = started.attemptId;
        setQuizAttemptId(attemptId);
      }
      const answers: AttemptAnswer[] = quiz.questions.map(q => ({
        questionId: q.id,
        selectedOptionId: quizAnswers[q.id] ?? null,
      }));
      const result = await quizService.submitAttempt(attemptId, { answers });
      const details = result.questionResults.map(qr => ({
        ...qr,
        explicacao: quiz.questions.find(q => q.id === qr.questionId)?.explicacao,
      }));
      setQuizResult({ score: result.score, correct: result.correctAnswers, total: result.totalQuestions, details });

      await completeSectionProgress(sectionQuizModal.section.id, {
        contentId: id,
        score: result.score,
        totalQuestions: result.totalQuestions,
        correctAnswers: result.correctAnswers,
        quizAttemptId: attemptId,
      });
      setSectionProgressMap(prev => ({
        ...prev,
        [sectionQuizModal.section.id]: {
          sectionId: sectionQuizModal.section.id,
          contentId: id,
          score: result.score,
          totalQuestions: result.totalQuestions,
          correctAnswers: result.correctAnswers,
          completed: true,
        },
      }));
    } catch {
      // silently fail
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!content || goalPages <= 0 || !goalDeadline) {
      setGoalError('Preencha o número de páginas e a data limite');
      return;
    }
    try {
      const payload: Parameters<typeof createGoal>[0] = {
        title: `Ler "${content.title}"`,
        targetPages: goalPages,
        deadline: goalDeadline,
        goalType: 'BOOK',
        contentId: content.id,
        contentTitle: content.title,
        contentThumbnail: absoluteContentUrl(content.thumbnailUrl) ?? undefined,
      };
      if (goalDaily > 0) payload.dailyPagesTarget = goalDaily;
      if (goalEmail) {
        (payload as any).reminderEmail = goalEmail;
        (payload as any).reminderEnabled = true;
        (payload as any).reminderFrequency = goalFreq;
      }
      await createGoal(payload);
      setGoalSaved(true);
      setGoalStep(false);
      setIntroOpen(false);
    } catch {
      setGoalError('Falha ao criar meta. Tenta novamente.');
    }
  };

  if (!id) return null;

  if (loading) return (
    <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
  );

  if (error || !content) {
    return (
      <Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Voltar</Button>
        <Alert severity="error">{error || 'Conteúdo não encontrado'}</Alert>
      </Box>
    );
  }

  const isCached = offline.cachedIds.has(content.id);
  const thumbUrl = absoluteContentUrl(content.thumbnailUrl);

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
        <IconButton onClick={() => navigate(-1)} sx={{
          bgcolor: '#fff', border: '1px solid #E5E7EB', '&:hover': { bgcolor: '#F9FAFB' },
        }}>
          <BackIcon />
        </IconButton>
        <Box flex={1} minWidth={0}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="h6" fontWeight={700} color="#0A1628" noWrap>
              {content.title}
            </Typography>
            {isCached && (
              <Chip size="small" icon={<OfflineIcon sx={{ fontSize: '14px !important' }} />}
                label="Offline" sx={{ bgcolor: '#00A651', color: '#fff', fontWeight: 700 }} />
            )}
            {!offline.isOnline && <Chip size="small" label="Sem internet" color="warning" />}
            {goalSaved && (
              <Chip size="small" icon={<GoalIcon sx={{ fontSize: '14px !important' }} />}
                label="Meta criada" sx={{ bgcolor: '#F59E0B', color: '#fff', fontWeight: 700 }} />
            )}
          </Stack>
          <Stack direction="row" spacing={1.5} mt={0.5} flexWrap="wrap">
            {content.discipline && (
              <Typography variant="caption" color="text.secondary"><strong>{content.discipline}</strong></Typography>
            )}
            {content.level && (
              <Typography variant="caption" color="text.secondary">· {content.level}</Typography>
            )}
            {content.uploadedByName && (
              <Typography variant="caption" color="text.secondary">
                · <AuthorIcon sx={{ fontSize: 12 }} /> {content.uploadedByName}
              </Typography>
            )}
            {content.totalPages && (
              <Typography variant="caption" color="text.secondary">
                · <PagesIcon sx={{ fontSize: 12 }} /> {content.totalPages} pág.
              </Typography>
            )}
          </Stack>
        </Box>
        <SpeechButton text={`${content.title}. ${content.description ?? ''}`} size="medium" />
      </Stack>

      {/* Section progress strip */}
      {sections.length > 0 && (
        <Box sx={{ mb: 1.5, display: 'flex', gap: 0.8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" fontWeight={700} color="#6B7280" sx={{ mr: 0.5 }}>
            Secções:
          </Typography>
          {sections.map(s => {
            const sp = sectionProgressMap[s.id];
            const isActive = currentPage >= s.startPage && currentPage <= s.endPage;
            const isDone = sp?.completed;
            const score = sp?.score ?? 0;
            const scoreColor = score >= 80 ? '#00A651' : score >= 50 ? '#d97706' : '#dc2626';
            return (
              <Box key={s.id} sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                px: 1.2, py: 0.4, borderRadius: 2, fontSize: '0.72rem', fontWeight: 600,
                border: `1.5px solid ${isActive ? '#00A651' : isDone ? scoreColor : '#E5E7EB'}`,
                bgcolor: isActive ? '#E8F5E9' : isDone ? `${scoreColor}15` : '#F9FAFB',
                color: isActive ? '#00A651' : isDone ? scoreColor : '#6B7280',
                transition: 'all 0.15s',
              }}>
                {isDone
                  ? <CheckIcon sx={{ fontSize: 12 }} />
                  : isActive
                    ? <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#00A651' }} />
                    : <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#E5E7EB' }} />}
                {s.sectionName}
                {isDone && <Typography variant="inherit" sx={{ ml: 0.3 }}>({score}%)</Typography>}
              </Box>
            );
          })}
        </Box>
      )}

      <PdfReader url={readUrl(content.id)} contentId={content.id} initialPage={initialPage} onPageChange={handlePageChange} />

      <Card sx={{ mt: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1.5} flex={1}>
              <PublicIcon sx={{ color: '#00A651', fontSize: 20, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary">
                Leitura apenas dentro da plataforma. O progresso é guardado automaticamente.
              </Typography>
            </Stack>
            {isCached ? (
              <Stack direction="row" alignItems="center" spacing={0.75} flexShrink={0}>
                <Chip
                  size="small"
                  icon={<OfflineIcon sx={{ fontSize: '13px !important' }} />}
                  label="Disponível offline"
                  sx={{ bgcolor: '#F0FDF4', color: '#00A651', fontWeight: 700, fontSize: '0.68rem' }}
                />
                <Button
                  size="small"
                  startIcon={offline.busy.has(content.id)
                    ? <CircularProgress size={12} />
                    : <RemoveOfflineIcon sx={{ fontSize: 14 }} />}
                  disabled={offline.busy.has(content.id)}
                  onClick={async () => {
                    await offline.removeOffline(content.id);
                    setOfflineSnack('Removido do dispositivo');
                  }}
                  sx={{ textTransform: 'none', color: '#DC2626', fontSize: '0.72rem',
                    '&:hover': { bgcolor: '#FEF2F2' }, minWidth: 0 }}
                >
                  Remover
                </Button>
              </Stack>
            ) : offline.isOnline ? (
              <Button
                size="small"
                variant="outlined"
                startIcon={offline.busy.has(content.id)
                  ? <CircularProgress size={12} sx={{ color: '#00A651' }} />
                  : <SaveOfflineIcon sx={{ fontSize: 14 }} />}
                disabled={offline.busy.has(content.id)}
                onClick={async () => {
                  await offline.saveOffline(content.id);
                  setOfflineSnack('Guardado para leitura offline!');
                }}
                sx={{
                  textTransform: 'none', borderColor: '#00A651', color: '#00A651',
                  fontSize: '0.72rem', flexShrink: 0,
                  '&:hover': { bgcolor: '#F0FDF4', borderColor: '#00A651' },
                }}
              >
                {offline.busy.has(content.id) ? 'A guardar…' : 'Guardar offline'}
              </Button>
            ) : (
              <Chip size="small" label="Sem internet" color="warning" />
            )}
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={!!offlineSnack}
        autoHideDuration={3000}
        onClose={() => setOfflineSnack(null)}
        message={offlineSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* ─── Section Quiz Modal ───────────────────────────────── */}
      <Dialog open={!!sectionQuizModal} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        {sectionQuizModal && (
          <>
            {/* Header */}
            <Box sx={{ bgcolor: '#0A1628', px: 3, py: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} color="#fff">
                {quizResult ? '📊 Resultado da Secção' : '✅ Secção Concluída!'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                {sectionQuizModal.section.sectionName}
                {sectionQuizModal.section.trimester ? ` · ${sectionQuizModal.section.trimester}º Trimestre` : ''}
              </Typography>
            </Box>

            <DialogContent sx={{ bgcolor: '#F8FAFC', pt: 2.5 }}>
              {sectionQuizModal.loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#00A651' }} />
                </Box>

              ) : quizResult ? (
                /* ── Result screen ── */
                <Box>
                  {/* Score ring */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                    {(() => {
                      const s = quizResult.score;
                      const c = s >= 80 ? '#00A651' : s >= 50 ? '#d97706' : '#dc2626';
                      const bg = s >= 80 ? '#E8F5E9' : s >= 50 ? '#fef3c7' : '#fee2e2';
                      return (
                        <>
                          <Box sx={{ width: 110, height: 110, borderRadius: '50%', bgcolor: bg,
                            border: `6px solid ${c}`, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', mb: 1.5 }}>
                            <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: c }}>
                              {s}%
                            </Typography>
                          </Box>
                          <Typography variant="h6" fontWeight={700} color={c}>
                            {s >= 80 ? (s === 100 ? '🏆 Perfeito!' : '🌟 Superpreparado!') : s >= 50 ? '📈 A melhorar' : '📚 Nível Básico'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: 'center', maxWidth: 340 }}>
                            {s >= 80
                              ? 'Parabéns! Dominaste esta secção. Podes avançar com confiança.'
                              : s >= 50
                                ? 'Boa tentativa! Revê os pontos errados e tenta novamente.'
                                : 'Precisas de pelo menos 80% para ser considerado preparado. Relê a secção e tenta de novo.'}
                          </Typography>
                          {s < 80 && (
                            <Box sx={{ mt: 1.5, px: 2, py: 1, bgcolor: '#FFF8E1', borderRadius: 2,
                              border: '1px solid #FFE082', maxWidth: 380, textAlign: 'center' }}>
                              <Typography variant="caption" color="#b45309" fontWeight={600}>
                                📖 Recomendação: relê as páginas {sectionQuizModal.section.startPage}–{sectionQuizModal.section.endPage} antes de repetir.
                              </Typography>
                            </Box>
                          )}
                        </>
                      );
                    })()}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Question review */}
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Revisão das questões</Typography>
                  {quizResult.details.map((qr: any, i: number) => (
                    <Card key={qr.questionId} elevation={0}
                      sx={{ border: `1px solid ${qr.correct ? '#C8E6C9' : '#FECACA'}`, borderRadius: 2, mb: 1.5 }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          {qr.correct
                            ? <CheckIcon sx={{ color: '#00A651', fontSize: 18, mt: 0.2, flexShrink: 0 }} />
                            : <CancelIcon sx={{ color: '#dc2626', fontSize: 18, mt: 0.2, flexShrink: 0 }} />}
                          <Typography variant="body2" fontWeight={600} color="#0A1628">{i + 1}. {qr.enunciado}</Typography>
                        </Box>
                        {!qr.correct && qr.selectedOptionLetra && (
                          <Typography variant="caption" sx={{ ml: 3.5, display: 'block', color: '#dc2626', mb: 0.3 }}>
                            ✗ {qr.selectedOptionLetra}) {qr.selectedOptionTexto}
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ ml: 3.5, display: 'block', color: '#00A651' }}>
                          ✓ {qr.correctOptionLetra}) {qr.correctOptionTexto}
                        </Typography>
                        {!qr.correct && qr.explicacao && (
                          <Box sx={{ ml: 3.5, mt: 1, p: 1, bgcolor: '#FFF8E1', borderRadius: 1.5, border: '1px solid #FFE082' }}>
                            <Typography variant="caption" color="#92400e">💡 {qr.explicacao}</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>

              ) : sectionQuizModal.quiz ? (
                /* ── Quiz taking screen ── */
                <Box>
                  {(() => {
                    const q = sectionQuizModal.quiz!.questions[quizCurrentIdx];
                    const total = sectionQuizModal.quiz!.questions.length;
                    return (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Questão {quizCurrentIdx + 1} de {total}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {Object.keys(quizAnswers).length} respondida{Object.keys(quizAnswers).length !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={(quizCurrentIdx + 1) / total * 100}
                          sx={{ mb: 2, height: 5, borderRadius: 3,
                            '& .MuiLinearProgress-bar': { bgcolor: '#00A651' } }} />

                        {q.mediaUrl && (
                          <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                            {q.mediaType === 'VIDEO'
                              ? <Box component="video" src={q.mediaUrl} controls sx={{ width: '100%', maxHeight: 220, display: 'block', bgcolor: '#000' }} />
                              : <Box component="img" src={q.mediaUrl} alt="Evidência" sx={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block', bgcolor: '#f5f5f5' }} />
                            }
                          </Box>
                        )}

                        <Typography variant="subtitle1" fontWeight={700} color="#0A1628" sx={{ mb: 2, lineHeight: 1.5 }}>
                          {q.enunciado}
                        </Typography>
                        <FormControl component="fieldset" fullWidth>
                          <RadioGroup value={quizAnswers[q.id]?.toString() ?? ''}>
                            {q.options.map(opt => (
                              <Box key={opt.id} onClick={() => setQuizAnswers(p => ({ ...p, [q.id]: opt.id }))}
                                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, mb: 1,
                                  border: `2px solid ${quizAnswers[q.id] === opt.id ? '#00A651' : '#E5E7EB'}`,
                                  borderRadius: 2, cursor: 'pointer',
                                  bgcolor: quizAnswers[q.id] === opt.id ? '#F1F8E9' : '#fff',
                                  '&:hover': { borderColor: '#4caf50', bgcolor: '#E8F5E9' } }}>
                                <FormControlLabel value={opt.id.toString()}
                                  control={<Radio sx={{ p: 0, color: '#9CA3AF', '&.Mui-checked': { color: '#00A651' } }} />}
                                  label="" sx={{ m: 0 }} />
                                <Box sx={{ minWidth: 26, height: 26, borderRadius: '50%', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                  bgcolor: quizAnswers[q.id] === opt.id ? '#00A651' : '#E5E7EB' }}>
                                  <Typography variant="caption" fontWeight={700}
                                    color={quizAnswers[q.id] === opt.id ? '#fff' : '#6B7280'}>{opt.letra}</Typography>
                                </Box>
                                <Typography variant="body2" color="#0A1628">{opt.texto}</Typography>
                              </Box>
                            ))}
                          </RadioGroup>
                        </FormControl>

                        <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                          <Button variant="outlined" disabled={quizCurrentIdx === 0}
                            onClick={() => setQuizCurrentIdx(i => i - 1)}
                            sx={{ flex: 1, borderColor: '#00A651', color: '#00A651', textTransform: 'none' }}>
                            ← Anterior
                          </Button>
                          {quizCurrentIdx < total - 1 ? (
                            <Button variant="contained" onClick={() => setQuizCurrentIdx(i => i + 1)}
                              sx={{ flex: 1, bgcolor: '#00A651', textTransform: 'none' }}>
                              Próxima →
                            </Button>
                          ) : (
                            <Button variant="contained" disabled={quizSubmitting}
                              onClick={handleSectionQuizSubmit}
                              startIcon={quizSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                              sx={{ flex: 1, bgcolor: '#00A651', textTransform: 'none', fontWeight: 700 }}>
                              {quizSubmitting ? 'A submeter...' : 'Terminar Quiz'}
                            </Button>
                          )}
                        </Box>
                      </>
                    );
                  })()}
                </Box>

              ) : (
                /* ── No quiz, just section complete ── */
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <TrophyIcon sx={{ fontSize: 56, color: '#00A651', mb: 1.5 }} />
                  <Typography variant="h6" fontWeight={700} color="#0A1628" sx={{ mb: 1 }}>
                    Secção concluída!
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Terminaste de ler a secção <strong>{sectionQuizModal.section.sectionName}</strong>.
                    Ainda não há quiz disponível para esta secção.
                  </Typography>
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E5E7EB' }}>
              <Button onClick={() => setSectionQuizModal(null)}
                sx={{ textTransform: 'none', color: '#6B7280' }}>
                {quizResult ? 'Continuar a ler' : 'Ignorar por agora'}
              </Button>
              {!quizResult && sectionQuizModal.quiz && (
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'center' }}>
                  Responde ao quiz para registar o teu progresso nesta secção
                </Typography>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ─── Popup introdução (estilo ficha de livro) ─────────── */}
      <Dialog
        open={introOpen && !goalStep}
        onClose={() => setIntroOpen(false)}
        maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', minHeight: 360 }}>

            {/* Capa */}
            <Box sx={{
              width: 200, minWidth: 200, flexShrink: 0,
              background: 'linear-gradient(160deg, #0A1628 0%, #001B33 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {thumbUrl ? (
                <Box component="img" src={thumbUrl} alt={content.title}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <Box textAlign="center">
                  <PagesIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 1 }} />
                  <Typography variant="caption" color="rgba(255,255,255,0.4)" display="block" px={1}>
                    {content.discipline ?? 'SAE'}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Detalhes */}
            <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="h5" fontWeight={800} color="#0A1628" lineHeight={1.2} mb={0.5}>
                  {content.title}
                </Typography>
                {content.uploadedByName && (
                  <Typography variant="body2" color="#00A651" fontWeight={600}>
                    {content.uploadedByName}
                  </Typography>
                )}
              </Box>

              {/* Chips de metadados */}
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {content.discipline && (
                  <Chip size="small" icon={<SchoolIcon />} label={content.discipline}
                    sx={{ bgcolor: '#EEF2FF', color: '#4338CA' }} />
                )}
                {content.level && (
                  <Chip size="small" label={content.level} sx={{ bgcolor: '#F0FDF4', color: '#166534' }} />
                )}
                {content.totalPages && (
                  <Chip size="small" icon={<PagesIcon />} label={`${content.totalPages} pág.`}
                    sx={{ bgcolor: '#F9FAFB' }} />
                )}
                {content.year && (
                  <Chip size="small" icon={<CalendarIcon />} label={String(content.year)}
                    sx={{ bgcolor: '#F9FAFB' }} />
                )}
                {content.publisher && (
                  <Chip size="small" label={content.publisher} sx={{ bgcolor: '#F9FAFB' }} />
                )}
              </Stack>

              {content.description && (
                <>
                  <Divider />
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
                    {content.description.length > 360
                      ? content.description.slice(0, 360) + '…'
                      : content.description}
                  </Typography>
                </>
              )}

              {initialPage > 1 && (
                <Alert severity="info" sx={{ mt: 'auto' }}>
                  Continuas da página <strong>{initialPage}</strong>.
                </Alert>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1, bgcolor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
          {isAuthed && (
            <Button variant="outlined" startIcon={<GoalIcon />}
              onClick={() => setGoalStep(true)}
              sx={{ textTransform: 'none', borderColor: '#001B33', color: '#001B33' }}>
              Definir Meta de Leitura
            </Button>
          )}
          <Box flex={1} />
          <Button onClick={() => setIntroOpen(false)} sx={{ textTransform: 'none' }}>
            Fechar
          </Button>
          <Button variant="contained" onClick={() => setIntroOpen(false)}
            sx={{ bgcolor: '#001B33', '&:hover': { bgcolor: '#002B50' }, textTransform: 'none', px: 3 }}>
            Começar a Ler
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Popup criação de meta ─────────────────────────────── */}
      <Dialog
        open={goalStep}
        onClose={() => setGoalStep(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #0A1628 0%, #001B33 100%)',
          px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 2,
        }}>
          {thumbUrl && (
            <Box component="img" src={thumbUrl} alt=""
              sx={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 1, display: 'block' }} />
          )}
          <Box>
            <Typography variant="overline" color="rgba(255,255,255,0.6)" lineHeight={1}>
              Meta de Leitura
            </Typography>
            <Typography fontWeight={700} color="#fff" fontSize={15} mt={0.25}>
              {content.title}
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ pt: 2.5 }}>
          {goalError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGoalError(null)}>{goalError}</Alert>}
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Páginas a ler (total)" type="number" fullWidth autoFocus
                value={goalPages || ''}
                onChange={e => setGoalPages(Number(e.target.value) || 0)}
                helperText={content.totalPages ? `${content.totalPages} pág. no total` : undefined}
              />
              <TextField
                label="Páginas por dia" type="number" fullWidth
                value={goalDaily || ''}
                onChange={e => setGoalDaily(Number(e.target.value) || 0)}
                helperText="Opcional"
              />
            </Stack>
            <TextField
              label="Data limite" type="date" InputLabelProps={{ shrink: true }} fullWidth
              value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)}
            />

            <Divider><Typography variant="caption" color="text.secondary">Lembrete por email (opcional)</Typography></Divider>

            <TextField
              label="Email para lembretes" type="email" fullWidth
              value={goalEmail} onChange={e => setGoalEmail(e.target.value)}
              placeholder="o-teu-email@exemplo.com"
            />
            {goalEmail && (
              <TextField select label="Frequência" fullWidth value={goalFreq}
                onChange={e => setGoalFreq(e.target.value)}>
                {FREQ_OPTIONS.map(o => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => { setGoalStep(false); setIntroOpen(true); }} sx={{ textTransform: 'none' }}>
            Voltar
          </Button>
          <Button variant="contained" onClick={handleCreateGoal}
            sx={{ bgcolor: '#001B33', '&:hover': { bgcolor: '#002B50' }, textTransform: 'none', px: 3 }}>
            Criar Meta
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Leitor;
