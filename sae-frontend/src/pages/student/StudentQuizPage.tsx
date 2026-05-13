import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Chip, Card, CardContent, Button, Dialog, DialogContent,
  DialogTitle, LinearProgress, Radio, RadioGroup, FormControlLabel, FormControl,
  IconButton, CircularProgress, Alert, Divider, Stack, Tooltip,
  TextField, MenuItem, Select, InputLabel,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Timer as TimerIcon,
  Quiz as QuizIcon,
  Replay as ReplayIcon,
  EmojiEvents as TrophyIcon,
  AutoAwesome as AIIcon,
  MenuBook as BookIcon,
} from '@mui/icons-material';
import { quizService } from '../../services/quizService';
import { listProgress, listSections } from '../../services/contentService';
import type { ReadingProgressView, ContentSection } from '../../services/contentService';
import { DISCIPLINAS } from '../../types/quiz';
import type { QuizSummary, Quiz, QuizResult, AttemptAnswer, GenerateFromContentDTO } from '../../types/quiz';

type View = 'browse' | 'taking' | 'result';

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#00A651' : score >= 50 ? '#d97706' : '#dc2626';
  const bg = score >= 70 ? '#E8F5E9' : score >= 50 ? '#fef3c7' : '#fee2e2';
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
      <Box sx={{ width: 120, height: 120, borderRadius: '50%', bgcolor: bg, border: `6px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <Typography sx={{ fontSize: '2rem', fontWeight: 900, color }}>{score}%</Typography>
      </Box>
      <Typography variant="h6" fontWeight={700} color={color}>
        {score >= 70 ? 'Muito bom!' : score >= 50 ? 'Pode melhorar' : 'Continua a tentar!'}
      </Typography>
    </Box>
  );
}

export default function StudentQuizPage() {
  const [view, setView] = useState<View>('browse');
  const [disciplina, setDisciplina] = useState('');
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Taking state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Result state
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showReview, setShowReview] = useState(false);

  // AI generation state
  const [genDialog, setGenDialog] = useState(false);
  const [myProgress, setMyProgress] = useState<ReadingProgressView[]>([]);
  const [selectedProgress, setSelectedProgress] = useState<ReadingProgressView | null>(null);
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [genStartPage, setGenStartPage] = useState(1);
  const [genEndPage, setGenEndPage] = useState(10);
  const [genNumQ, setGenNumQ] = useState(5);
  const [genSectionName, setGenSectionName] = useState('');
  const [genDisciplina, setGenDisciplina] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, [disciplina]);

  const loadQuizzes = () => {
    setLoading(true);
    setError('');
    quizService.listQuizzes(disciplina || undefined)
      .then(setQuizzes)
      .catch(() => setError('Não foi possível carregar os quizzes'))
      .finally(() => setLoading(false));
  };

  const handleStart = async (quiz: QuizSummary) => {
    setLoading(true);
    setError('');
    try {
      const { attemptId, quiz: fullQuiz } = await quizService.startAttempt(quiz.id);
      setAttemptId(attemptId);
      setActiveQuiz(fullQuiz);
      setCurrentIdx(0);
      setAnswers({});
      if (fullQuiz.tempoLimiteMinutos) {
        setTimeLeft(fullQuiz.tempoLimiteMinutos * 60);
      } else {
        setTimeLeft(null);
      }
      setView('taking');
    } catch {
      setError('Erro ao iniciar o quiz. Verifica se tens sessão iniciada.');
    } finally {
      setLoading(false);
    }
  };

  // Timer
  useEffect(() => {
    if (view !== 'taking' || timeLeft === null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view]);

  const handleSubmit = async () => {
    if (!attemptId || !activeQuiz || submitting) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const submitAnswers: AttemptAnswer[] = activeQuiz.questions.map(q => ({
        questionId: q.id,
        selectedOptionId: answers[q.id] ?? null,
      }));
      const res = await quizService.submitAttempt(attemptId, { answers: submitAnswers });
      setResult(res);
      setShowReview(false);
      setView('result');
      loadQuizzes();
    } catch {
      setError('Erro ao submeter o quiz. Tenta novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = (questionId: number, optionId: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const resetToBrowse = () => {
    setView('browse');
    setActiveQuiz(null);
    setAttemptId(null);
    setAnswers({});
    setTimeLeft(null);
    setResult(null);
  };

  // Load reading progress when dialog opens
  useEffect(() => {
    if (!genDialog) return;
    listProgress().then(setMyProgress).catch(() => {});
  }, [genDialog]);

  // Load sections when a book is selected
  useEffect(() => {
    if (!selectedProgress) { setSections([]); return; }
    listSections(selectedProgress.contentId).then(setSections).catch(() => setSections([]));
  }, [selectedProgress?.contentId]);

  const openGenDialog = () => {
    setSelectedProgress(null);
    setSections([]);
    setGenStartPage(1);
    setGenEndPage(10);
    setGenNumQ(5);
    setGenSectionName('');
    setGenDisciplina(disciplina);
    setGenDialog(true);
  };

  const handleSectionPick = (sec: ContentSection) => {
    setGenStartPage(sec.startPage);
    setGenEndPage(sec.endPage);
    setGenSectionName(sec.sectionName);
  };

  const handleGenerate = async () => {
    if (!selectedProgress) return;
    setGenerating(true);
    setError('');
    try {
      const dto: GenerateFromContentDTO = {
        contentId: selectedProgress.contentId,
        disciplina: genDisciplina || undefined,
        startPage: genStartPage,
        endPage: genEndPage,
        numQuestions: genNumQ,
        tempoLimiteMinutos: undefined,
        sectionName: genSectionName || undefined,
      };
      await quizService.generateFromContent(dto);
      setGenDialog(false);
      loadQuizzes();
    } catch {
      setError('Não foi possível gerar o quiz. Verifica a ligação ao serviço.');
    } finally {
      setGenerating(false);
    }
  };

  const currentQuestion = activeQuiz?.questions[currentIdx];
  const answeredCount = activeQuiz ? Object.keys(answers).length : 0;
  const totalQ = activeQuiz?.questions.length ?? 0;

  // ── Browse View ──────────────────────────────────────────────
  if (view === 'browse') return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{ p: 1.2, bgcolor: '#E8F5E9', borderRadius: 2 }}>
          <QuizIcon sx={{ color: '#00A651', fontSize: 28 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={800} color="#0A1628">Preparação para Exame</Typography>
          <Typography variant="body2" color="text.secondary">Escolhe uma disciplina e inicia o teu quiz</Typography>
        </Box>
        <Button variant="contained" startIcon={<AIIcon />} onClick={openGenDialog}
          sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' }, borderRadius: 2,
            textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
          Gerar Quiz com IA
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* AI Quiz Generation Dialog */}
      <Dialog open={genDialog} onClose={() => setGenDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box sx={{ p: 0.8, bgcolor: '#E8F5E9', borderRadius: 1.5 }}>
            <AIIcon sx={{ color: '#00A651', fontSize: 22 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={800} color="#0A1628">Gerar Quiz com IA</Typography>
            <Typography variant="caption" color="text.secondary">
              A IA cria questões com base nas páginas que leste
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setGenDialog(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

          {/* Book picker */}
          <Typography variant="subtitle2" fontWeight={700} color="#374151" sx={{ mb: 1 }}>
            <BookIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle', color: '#00A651' }} />
            Seleciona um livro
          </Typography>
          {myProgress.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Ainda não tens progresso de leitura registado. Lê um livro na biblioteca para gerar quizzes.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {myProgress.map(p => (
                <Box key={p.contentId} onClick={() => setSelectedProgress(p)}
                  sx={{ p: 1.5, border: `2px solid ${selectedProgress?.contentId === p.contentId ? '#00A651' : '#E5E7EB'}`,
                    borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
                    bgcolor: selectedProgress?.contentId === p.contentId ? '#E8F5E9' : '#fff',
                    '&:hover': { borderColor: '#4caf50', bgcolor: '#F1F8E9' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {p.thumbnailUrl ? (
                      <Box component="img" src={p.thumbnailUrl} alt={p.contentTitle}
                        sx={{ width: 36, height: 50, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />
                    ) : (
                      <Box sx={{ width: 36, height: 50, bgcolor: '#E8F5E9', borderRadius: 1, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookIcon sx={{ color: '#00A651', fontSize: 18 }} />
                      </Box>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap color="#0A1628" fontSize="0.9rem">
                        {p.contentTitle}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Página {p.currentPage ?? 0} / {p.totalPages ?? '?'} · {p.percentageComplete ?? 0}% lido
                      </Typography>
                    </Box>
                    {selectedProgress?.contentId === p.contentId && (
                      <CheckIcon sx={{ color: '#00A651', flexShrink: 0 }} />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Section picker */}
          {selectedProgress && sections.length > 0 && (
            <>
              <Typography variant="subtitle2" fontWeight={700} color="#374151" sx={{ mb: 1 }}>
                Secção / trimestre (opcional)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
                {sections.map(s => (
                  <Chip key={s.id} label={s.sectionName}
                    onClick={() => handleSectionPick(s)}
                    variant={genSectionName === s.sectionName ? 'filled' : 'outlined'}
                    size="small"
                    sx={{ fontWeight: genSectionName === s.sectionName ? 700 : 400,
                      bgcolor: genSectionName === s.sectionName ? '#00A651' : 'transparent',
                      color: genSectionName === s.sectionName ? '#fff' : '#00A651',
                      borderColor: '#00A651' }}
                  />
                ))}
              </Box>
            </>
          )}

          {/* Page range */}
          {selectedProgress && (
            <>
              <Typography variant="subtitle2" fontWeight={700} color="#374151" sx={{ mb: 1 }}>
                Intervalo de páginas
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField label="Página inicial" type="number" size="small" fullWidth
                  value={genStartPage} onChange={e => setGenStartPage(Number(e.target.value))}
                  inputProps={{ min: 1, max: selectedProgress.totalPages ?? 9999 }} />
                <TextField label="Página final" type="number" size="small" fullWidth
                  value={genEndPage} onChange={e => setGenEndPage(Number(e.target.value))}
                  inputProps={{ min: genStartPage, max: selectedProgress.totalPages ?? 9999 }} />
              </Box>
            </>
          )}

          {/* Discipline + num questions */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Disciplina</InputLabel>
              <Select label="Disciplina" value={genDisciplina} onChange={e => setGenDisciplina(e.target.value)}>
                <MenuItem value="">Automática</MenuItem>
                {DISCIPLINAS.map(d => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Nº questões" type="number" size="small" fullWidth
              value={genNumQ} onChange={e => setGenNumQ(Math.max(1, Math.min(20, Number(e.target.value))))}
              inputProps={{ min: 1, max: 20 }} />
          </Box>

          <Button fullWidth variant="contained" disabled={!selectedProgress || generating}
            onClick={handleGenerate}
            startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <AIIcon />}
            sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' }, borderRadius: 2,
              textTransform: 'none', fontWeight: 700, py: 1.2 }}>
            {generating ? 'A gerar quiz...' : 'Gerar Quiz'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Discipline filter */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        <Chip
          label="Todas"
          onClick={() => setDisciplina('')}
          variant={disciplina === '' ? 'filled' : 'outlined'}
          sx={{ fontWeight: disciplina === '' ? 700 : 400,
            bgcolor: disciplina === '' ? '#00A651' : 'transparent',
            color: disciplina === '' ? '#fff' : '#00A651',
            borderColor: '#00A651' }}
        />
        {DISCIPLINAS.map(d => (
          <Chip key={d.value} label={d.label}
            onClick={() => setDisciplina(d.value)}
            variant={disciplina === d.value ? 'filled' : 'outlined'}
            sx={{ fontWeight: disciplina === d.value ? 700 : 400,
              bgcolor: disciplina === d.value ? '#00A651' : 'transparent',
              color: disciplina === d.value ? '#fff' : '#00A651',
              borderColor: '#00A651' }}
          />
        ))}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#00A651' }} />
        </Box>
      ) : quizzes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <QuizIcon sx={{ fontSize: 64, color: '#A5D6A7', mb: 2 }} />
          <Typography color="text.secondary">Nenhum quiz disponível para esta disciplina.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          {quizzes.map(q => (
            <Card key={q.id} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3,
              transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 4px 20px rgba(124,58,237,0.12)' } }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Chip label={q.disciplinaLabel} size="small"
                    sx={{ bgcolor: '#E8F5E9', color: '#00A651', fontWeight: 600, fontSize: '0.7rem' }} />
                  {q.bestScore !== null && q.bestScore !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TrophyIcon sx={{ fontSize: 14, color: q.bestScore >= 70 ? '#00A651' : '#d97706' }} />
                      <Typography variant="caption" fontWeight={700}
                        color={q.bestScore >= 70 ? '#00A651' : '#d97706'}>{q.bestScore}%</Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant="subtitle1" fontWeight={700} color="#0A1628" sx={{ mb: 0.5 }}>
                  {q.titulo}
                </Typography>
                {q.descricao && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5,
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {q.descricao}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    📝 {q.questionCount} questões
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {q.tempoLimiteMinutos ? `⏱ ${q.tempoLimiteMinutos} min` : '⏱ Sem limite'}
                  </Typography>
                  {q.myAttempts > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      🔄 {q.myAttempts} tentativa{q.myAttempts > 1 ? 's' : ''}
                    </Typography>
                  )}
                </Box>

                <Button fullWidth variant="contained"
                  disabled={loading || q.questionCount === 0}
                  onClick={() => handleStart(q)}
                  startIcon={q.myAttempts > 0 ? <ReplayIcon /> : <QuizIcon />}
                  sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' }, borderRadius: 2,
                    textTransform: 'none', fontWeight: 700 }}>
                  {q.myAttempts > 0 ? 'Repetir Quiz' : 'Iniciar Quiz'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );

  // ── Taking View ──────────────────────────────────────────────
  if (view === 'taking' && activeQuiz && currentQuestion) return (
    <Dialog open fullScreen>
      <DialogTitle sx={{ bgcolor: '#0A1628', color: '#fff', p: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, pb: 1.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>{activeQuiz.titulo}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {activeQuiz.disciplinaLabel}
            </Typography>
          </Box>
          {timeLeft !== null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5,
              color: timeLeft <= 60 ? '#f87171' : '#4caf50' }}>
              <TimerIcon fontSize="small" />
              <Typography fontWeight={700}>{formatTime(timeLeft)}</Typography>
            </Box>
          )}
          <Tooltip title="Abandonar quiz">
            <IconButton onClick={resetToBrowse} sx={{ color: 'rgba(255,255,255,0.6)' }}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <LinearProgress variant="determinate" value={(currentIdx + 1) / totalQ * 100}
          sx={{ height: 4, bgcolor: 'rgba(255,255,255,0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' } }} />
      </DialogTitle>

      <DialogContent sx={{ bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column',
        alignItems: 'center', pt: 4, pb: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 720 }} onClose={() => setError('')}>{error}</Alert>}

        <Box sx={{ width: '100%', maxWidth: 720 }}>
          {/* Progress */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Questão {currentIdx + 1} de {totalQ}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {answeredCount} respondida{answeredCount !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {/* Question card */}
          <Card elevation={0} sx={{ border: '1px solid #C8E6C9', borderRadius: 3, mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} color="#0A1628" sx={{ mb: 3, lineHeight: 1.5 }}>
                {currentQuestion.enunciado}
              </Typography>

              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={answers[currentQuestion.id]?.toString() ?? ''}
                  onChange={(_, v) => handleAnswer(currentQuestion.id, Number(v))}>
                  {currentQuestion.options.map(opt => (
                    <Box key={opt.id} onClick={() => handleAnswer(currentQuestion.id, opt.id)}
                      sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, mb: 1,
                        border: `2px solid ${answers[currentQuestion.id] === opt.id ? '#00A651' : '#E5E7EB'}`,
                        borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
                        bgcolor: answers[currentQuestion.id] === opt.id ? '#F1F8E9' : '#fff',
                        '&:hover': { borderColor: '#4caf50', bgcolor: '#E8F5E9' } }}>
                      <FormControlLabel value={opt.id.toString()} control={<Radio sx={{ p: 0,
                        color: '#9CA3AF', '&.Mui-checked': { color: '#00A651' } }} />} label="" sx={{ m: 0 }} />
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
                        <Box sx={{ minWidth: 28, height: 28, borderRadius: '50%', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          bgcolor: answers[currentQuestion.id] === opt.id ? '#00A651' : '#E5E7EB' }}>
                          <Typography variant="caption" fontWeight={700}
                            color={answers[currentQuestion.id] === opt.id ? '#fff' : '#6B7280'}>
                            {opt.letra}
                          </Typography>
                        </Box>
                        <Typography sx={{ mt: 0.2, color: '#0A1628', lineHeight: 1.5 }}>{opt.texto}</Typography>
                      </Box>
                    </Box>
                  ))}
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button variant="outlined" disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(i => i - 1)}
              sx={{ borderColor: '#00A651', color: '#00A651', textTransform: 'none', flex: 1 }}>
              ← Anterior
            </Button>

            {currentIdx < totalQ - 1 ? (
              <Button variant="contained" onClick={() => setCurrentIdx(i => i + 1)}
                sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' }, textTransform: 'none', flex: 1 }}>
                Próxima →
              </Button>
            ) : (
              <Button variant="contained" disabled={submitting}
                onClick={handleSubmit}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' }, textTransform: 'none', flex: 1, fontWeight: 700 }}>
                {submitting ? 'A submeter...' : 'Terminar Quiz'}
              </Button>
            )}
          </Box>

          {/* Question navigation dots */}
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0.8, mt: 3 }}>
            {activeQuiz.questions.map((q, i) => (
              <Box key={q.id} onClick={() => setCurrentIdx(i)}
                sx={{ width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${i === currentIdx ? '#00A651' : answers[q.id] ? '#00A651' : '#D1D5DB'}`,
                  bgcolor: i === currentIdx ? '#00A651' : answers[q.id] ? '#E8F5E9' : '#fff',
                  transition: 'all 0.15s' }}>
                <Typography variant="caption" fontWeight={700}
                  color={i === currentIdx ? '#fff' : answers[q.id] ? '#00A651' : '#9CA3AF'}>
                  {i + 1}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );

  // ── Result View ──────────────────────────────────────────────
  if (view === 'result' && result) return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{ p: 1.2, bgcolor: '#E8F5E9', borderRadius: 2 }}>
          <QuizIcon sx={{ color: '#00A651', fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0A1628">Resultado do Quiz</Typography>
          <Typography variant="body2" color="text.secondary">{result.quizTitulo}</Typography>
        </Box>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, mb: 3, maxWidth: 600 }}>
        <CardContent sx={{ p: 3 }}>
          <ScoreBadge score={result.score} />
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={800} color="#00A651">{result.correctAnswers}</Typography>
              <Typography variant="caption" color="text.secondary">Corretas</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={800} color="#dc2626">{result.totalQuestions - result.correctAnswers}</Typography>
              <Typography variant="caption" color="text.secondary">Erradas</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={800} color="#00A651">{result.totalQuestions}</Typography>
              <Typography variant="caption" color="text.secondary">Total</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={800} color="#6B7280">{formatTime(result.timeSpentSeconds)}</Typography>
              <Typography variant="caption" color="text.secondary">Tempo</Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={1.5} justifyContent="center">
            <Button variant="outlined" onClick={() => setShowReview(!showReview)}
              sx={{ borderColor: '#00A651', color: '#00A651', textTransform: 'none', fontWeight: 600 }}>
              {showReview ? 'Ocultar revisão' : 'Rever respostas'}
            </Button>
            <Button variant="contained" startIcon={<ReplayIcon />}
              onClick={resetToBrowse}
              sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' }, textTransform: 'none', fontWeight: 700 }}>
              Fazer outro quiz
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Question review */}
      {showReview && (
        <Box sx={{ maxWidth: 720 }}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Revisão das Questões</Typography>
          {result.questionResults.map((qr, i) => (
            <Card key={qr.questionId} elevation={0}
              sx={{ border: `1px solid ${qr.correct ? '#C8E6C9' : '#FECACA'}`, borderRadius: 2, mb: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                  {qr.correct
                    ? <CheckIcon sx={{ color: '#00A651', mt: 0.3, flexShrink: 0 }} />
                    : <CancelIcon sx={{ color: '#dc2626', mt: 0.3, flexShrink: 0 }} />}
                  <Typography fontWeight={600} color="#0A1628">
                    {i + 1}. {qr.enunciado}
                  </Typography>
                </Box>
                {!qr.correct && qr.selectedOptionLetra && (
                  <Typography variant="body2" sx={{ ml: 4, mb: 0.5, color: '#dc2626' }}>
                    ✗ A tua resposta: <strong>{qr.selectedOptionLetra}) {qr.selectedOptionTexto}</strong>
                  </Typography>
                )}
                {!qr.correct && !qr.selectedOptionLetra && (
                  <Typography variant="body2" sx={{ ml: 4, mb: 0.5, color: '#6B7280' }}>
                    Sem resposta
                  </Typography>
                )}
                <Typography variant="body2" sx={{ ml: 4, color: '#00A651' }}>
                  ✓ Resposta correta: <strong>{qr.correctOptionLetra}) {qr.correctOptionTexto}</strong>
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );

  return null;
}
