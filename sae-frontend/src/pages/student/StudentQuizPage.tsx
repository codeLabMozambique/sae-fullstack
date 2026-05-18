import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Chip, Card, CardContent, Button, Dialog, DialogContent,
  DialogTitle, DialogActions, LinearProgress, Radio, RadioGroup, FormControlLabel, FormControl,
  IconButton, CircularProgress, Alert, Divider, Stack, Tooltip, Paper,
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
  School as SchoolIcon,
  Science as ScienceIcon,
  Mic as MicIcon,
  RecordVoiceOver as OralIcon,
  ContactSupport as ContactIcon,
  Download as DownloadIcon,
  VolumeUp as AudioIcon,
  InsertDriveFile as DocIcon,
  Verified as CertIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { quizService } from '../../services/quizService';
import { listProgress, listSections } from '../../services/contentService';
import type { ReadingProgressView, ContentSection } from '../../services/contentService';
import { useAuth } from '../../context/AuthContext';
import { DISCIPLINAS } from '../../types/quiz';
import type {
  QuizSummary, Quiz, QuizResult, AttemptAnswer, GenerateFromContentDTO,
  StudyPrepRequestDTO, OralTestRequestDTO, OralTestEvaluateDTO, OralTestResult, Certificate,
} from '../../types/quiz';
import VoiceRecorderButton from '../../components/VoiceRecorderButton';

type View = 'browse' | 'taking' | 'result' | 'oral-taking' | 'oral-result';

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ScoreBadge({ score }: { score: number }) {
  const isSuper  = score >= 80;
  const isGood   = score >= 50 && score < 80;
  const isBasic  = score < 50;
  const color = isSuper ? '#00A651' : isGood ? '#d97706' : '#dc2626';
  const bg    = isSuper ? '#E8F5E9' : isGood ? '#fef3c7' : '#fee2e2';
  const label = isSuper
    ? score === 100 ? '🏆 Perfeito!' : '🌟 Superpreparado!'
    : isGood ? '📈 A melhorar' : '📚 Nível Básico';
  const sub = isSuper
    ? 'Parabéns! Estás muito bem preparado. Boa sorte no teste!'
    : isGood ? 'Continua a estudar — já estás no caminho certo.'
    : 'Revê os conteúdos e tenta novamente. Precisas de 80% para estar preparado.';
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
      <Box sx={{ width: 120, height: 120, borderRadius: '50%', bgcolor: bg, border: `6px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <Typography sx={{ fontSize: '2rem', fontWeight: 900, color }}>{score}%</Typography>
      </Box>
      <Typography variant="h6" fontWeight={700} color={color}>{label}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: 'center', maxWidth: 360 }}>
        {sub}
      </Typography>
    </Box>
  );
}

export default function StudentQuizPage() {
  const { user } = useAuth();
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

  // Study prep state
  const [prepDialog, setPrepDialog] = useState(false);
  const [prepMode, setPrepMode] = useState<'TEST' | 'EXAM'>('TEST');
  const [prepSelectedProgress, setPrepSelectedProgress] = useState<ReadingProgressView | null>(null);
  const [prepDisciplina, setPrepDisciplina] = useState('');
  const [prepNumQ, setPrepNumQ] = useState(10);
  const [preparingQuiz, setPreparingQuiz] = useState(false);

  // Certificate state
  const [certOpen, setCertOpen] = useState(false);
  const [certData, setCertData] = useState<Certificate | null>(null);

  // Oral test state
  const [oralDialog, setOralDialog] = useState(false);
  const [generatingOral, setGeneratingOral] = useState(false);
  const [oralQuiz, setOralQuiz] = useState<Quiz | null>(null);
  const [oralCurrentIdx, setOralCurrentIdx] = useState(0);
  const [oralResponses, setOralResponses] = useState<Record<number, string>>({});
  const [oralResult, setOralResult] = useState<OralTestResult | null>(null);
  const [oralSubmitting, setOralSubmitting] = useState(false);
  const [oralNumQ, setOralNumQ] = useState(5);

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

  // Load reading progress when either dialog opens
  useEffect(() => {
    if (!genDialog && !prepDialog) return;
    listProgress().then(setMyProgress).catch(() => {});
  }, [genDialog, prepDialog]);

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

  const openPrepDialog = () => {
    setPrepSelectedProgress(null);
    setPrepMode('TEST');
    setPrepDisciplina(disciplina);
    setPrepNumQ(10);
    setPrepDialog(true);
  };

  const handleStudyPrep = async () => {
    setPreparingQuiz(true);
    setError('');
    try {
      const dto: StudyPrepRequestDTO = {
        disciplina: prepDisciplina || undefined,
        mode: prepMode,
        contentId: prepSelectedProgress?.contentId || undefined,
        numQuestions: prepNumQ,
      };
      const quiz = await quizService.generateStudyPrep(dto);
      setPrepDialog(false);
      // Auto-start the generated quiz
      const { attemptId, quiz: fullQuiz } = await quizService.startAttempt(quiz.id);
      setAttemptId(attemptId);
      setActiveQuiz(fullQuiz);
      setCurrentIdx(0);
      setAnswers({});
      setTimeLeft(fullQuiz.tempoLimiteMinutos ? fullQuiz.tempoLimiteMinutos * 60 : null);
      setView('taking');
      loadQuizzes();
    } catch {
      setError('Não foi possível gerar o quiz de preparação. Tenta novamente.');
    } finally {
      setPreparingQuiz(false);
    }
  };

  const handleStartOralTest = async () => {
    setGeneratingOral(true);
    setError('');
    try {
      const dto: OralTestRequestDTO = { disciplina: 'INGLES', numQuestions: oralNumQ, level: 'intermediate' };
      const quiz = await quizService.generateOralTest(dto);
      setOralQuiz({ id: quiz.id, titulo: quiz.titulo, descricao: quiz.descricao,
        disciplina: quiz.disciplina, disciplinaLabel: quiz.disciplinaLabel,
        tempoLimiteMinutos: quiz.tempoLimiteMinutos,
        questions: quiz.questions.map(q => ({ id: q.id, enunciado: q.enunciado,
          ordemNumero: q.ordemNumero, options: [], explicacao: q.explicacao })) });
      setOralCurrentIdx(0);
      setOralResponses({});
      setOralResult(null);
      setOralDialog(false);
      setView('oral-taking');
    } catch {
      setError('Não foi possível gerar o teste oral. Tenta novamente.');
    } finally {
      setGeneratingOral(false);
    }
  };

  const handleOralSubmit = async () => {
    if (!oralQuiz) return;
    setOralSubmitting(true);
    setError('');
    try {
      const dto: OralTestEvaluateDTO = {
        quizId: oralQuiz.id,
        responses: oralQuiz.questions.map(q => ({
          questionId: q.id,
          transcription: oralResponses[q.id] || '',
        })),
      };
      const res = await quizService.evaluateOralTest(dto);
      setOralResult(res);
      setView('oral-result');
    } catch {
      setError('Não foi possível avaliar o teste oral. Tenta novamente.');
    } finally {
      setOralSubmitting(false);
    }
  };

  const currentQuestion = activeQuiz?.questions[currentIdx];
  const answeredCount = activeQuiz ? Object.keys(answers).length : 0;
  const totalQ = activeQuiz?.questions.length ?? 0;

  const openCertificate = async (certId: number) => {
    try {
      const cert = await quizService.getCertificate(certId);
      setCertData(cert);
      setCertOpen(true);
    } catch {
      // silently ignore
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  // ── Certificate Dialog ────────────────────────────────────────
  const certificateDialog = certData && (
    <Dialog open={certOpen} onClose={() => setCertOpen(false)} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0 }}>
        <Typography fontWeight={800} color="#0A1628">Certificado de Desempenho</Typography>
        <IconButton size="small" onClick={() => setCertOpen(false)}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {/* Certificate card — printable */}
        <Box className="certificate-print" sx={{
          border: '4px solid #00A651', borderRadius: 3, p: 4, textAlign: 'center',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #fff 60%, #f0f9ff 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative corner */}
          <Box sx={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80,
            background: 'linear-gradient(135deg, transparent 50%, rgba(0,166,81,0.12) 50%)' }} />
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: 80, height: 80,
            background: 'linear-gradient(315deg, transparent 50%, rgba(0,166,81,0.12) 50%)' }} />

          <CertIcon sx={{ fontSize: 56, color: '#00A651', mb: 1 }} />
          <Typography variant="caption" sx={{ display: 'block', letterSpacing: 3,
            color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', mb: 1 }}>
            Sistema de Apoio ao Estudo — SAE
          </Typography>
          <Typography variant="h5" fontWeight={900} color="#0A1628" sx={{ mb: 0.5 }}>
            Certificado de Desempenho
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Este certificado atesta que
          </Typography>
          <Typography variant="h6" fontWeight={800} color="#00A651"
            sx={{ mb: 2.5, fontSize: '1.4rem', fontStyle: 'italic' }}>
            {user?.fullName || 'Estudante'}
          </Typography>
          <Typography variant="body1" color="#374151" sx={{ mb: 0.5 }}>
            concluiu com êxito o quiz
          </Typography>
          <Typography variant="h6" fontWeight={700} color="#0A1628" sx={{ mb: 0.5 }}>
            {certData.quizTitulo}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {certData.disciplinaLabel}
          </Typography>

          {/* Score badge */}
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1,
            px: 3, py: 1, bgcolor: '#00A651', borderRadius: 4, mb: 2.5 }}>
            <TrophyIcon sx={{ color: '#fff', fontSize: 20 }} />
            <Typography fontWeight={800} color="#fff" fontSize="1.1rem">
              {certData.score}% de acerto
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ display: 'block', color: '#9CA3AF' }}>
            Emitido em {new Date(certData.issuedAt).toLocaleDateString('pt-PT', {
              day: '2-digit', month: 'long', year: 'numeric'
            })}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: '#D1D5DB', mt: 0.5 }}>
            Certificado #{certData.id}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setCertOpen(false)} sx={{ textTransform: 'none', color: '#6B7280' }}>
          Fechar
        </Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrintCertificate}
          sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' },
            textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
          Imprimir / Guardar PDF
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ── Oral Test Setup Dialog ────────────────────────────────────
  const oralSetupDialog = (
    <Dialog open={oralDialog} onClose={() => setOralDialog(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>🎤 Preparação para Teste Oral — Inglês</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          A IA vai gerar tópicos de conversação em Inglês. Irás responder por voz e receberás avaliação em 5 dimensões.
        </Typography>
        <Select fullWidth value={oralNumQ} onChange={e => setOralNumQ(Number(e.target.value))} size="small" sx={{ mb: 2 }}>
          {[3,4,5,6,7,8].map(n => <MenuItem key={n} value={n}>{n} tópicos</MenuItem>)}
        </Select>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button fullWidth variant="outlined" onClick={() => setOralDialog(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button fullWidth variant="contained" onClick={handleStartOralTest} disabled={generatingOral}
            startIcon={generatingOral ? <CircularProgress size={16} color="inherit" /> : <OralIcon />}
            sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, textTransform: 'none', fontWeight: 700 }}>
            {generatingOral ? 'A gerar...' : 'Iniciar Teste Oral'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );

  // ── Browse View ──────────────────────────────────────────────
  if (view === 'browse') return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ p: 1.2, bgcolor: '#E8F5E9', borderRadius: 2 }}>
          <QuizIcon sx={{ color: '#00A651', fontSize: 28 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" fontWeight={800} color="#0A1628">Quizzes</Typography>
          <Typography variant="body2" color="text.secondary">Pratica, prepara-te e avalia o teu nível</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {(disciplina === 'INGLES' || disciplina === '') && (
            <Button variant="outlined" startIcon={<OralIcon />} onClick={() => setOralDialog(true)}
              sx={{ borderColor: '#0284c7', color: '#0284c7', '&:hover': { bgcolor: '#F0F9FF' }, borderRadius: 2,
                textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
              Teste Oral — Inglês
            </Button>
          )}
          <Button variant="outlined" startIcon={<SchoolIcon />} onClick={openPrepDialog}
            sx={{ borderColor: '#7C3AED', color: '#7C3AED', '&:hover': { bgcolor: '#F5F3FF' }, borderRadius: 2,
              textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
            Preparar para Teste/Exame
          </Button>
          <Button variant="contained" startIcon={<AIIcon />} onClick={openGenDialog}
            sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' }, borderRadius: 2,
              textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
            Gerar Quiz com IA
          </Button>
        </Box>
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

      {/* ── Study Prep Dialog ─────────────────────────────── */}
      <Dialog open={prepDialog} onClose={() => setPrepDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box sx={{ p: 0.8, bgcolor: '#F5F3FF', borderRadius: 1.5 }}>
            <SchoolIcon sx={{ color: '#7C3AED', fontSize: 22 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={800} color="#0A1628">Preparação para Avaliação</Typography>
            <Typography variant="caption" color="text.secondary">
              A IA gera questões personalizadas com base no teu percurso de estudo
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setPrepDialog(false)}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

          {/* Mode selection */}
          <Typography variant="subtitle2" fontWeight={700} color="#374151" sx={{ mb: 1 }}>
            Tipo de avaliação
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
            {([
              { mode: 'TEST' as const, label: '📝 Teste Normal', sub: 'Com base no conteúdo mais recente do professor e debates do fórum', color: '#00A651', bg: '#E8F5E9' },
              { mode: 'EXAM' as const, label: '🎓 Exame Final', sub: 'Abrange toda a matéria, com questões mais abrangentes e de análise', color: '#7C3AED', bg: '#F5F3FF' },
            ] as const).map(opt => (
              <Box key={opt.mode} onClick={() => setPrepMode(opt.mode)}
                sx={{ flex: 1, p: 2, borderRadius: 2, cursor: 'pointer',
                  border: `2px solid ${prepMode === opt.mode ? opt.color : '#E5E7EB'}`,
                  bgcolor: prepMode === opt.mode ? opt.bg : '#fff',
                  transition: 'all 0.15s', '&:hover': { borderColor: opt.color } }}>
                <Typography fontWeight={700} color={prepMode === opt.mode ? opt.color : '#0A1628'} sx={{ mb: 0.5 }}>
                  {opt.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">{opt.sub}</Typography>
              </Box>
            ))}
          </Box>

          {/* Book selection */}
          <Typography variant="subtitle2" fontWeight={700} color="#374151" sx={{ mb: 1 }}>
            <BookIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle', color: '#00A651' }} />
            Livro / conteúdo (opcional)
          </Typography>
          {myProgress.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              Lê algum livro na biblioteca para obter questões mais específicas.
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mb: 2 }}>
              <Box onClick={() => setPrepSelectedProgress(null)}
                sx={{ p: 1.2, border: `2px solid ${!prepSelectedProgress ? '#00A651' : '#E5E7EB'}`,
                  borderRadius: 2, cursor: 'pointer',
                  bgcolor: !prepSelectedProgress ? '#E8F5E9' : '#fff', transition: 'all 0.15s' }}>
                <Typography variant="body2" fontWeight={600} color={!prepSelectedProgress ? '#00A651' : '#6B7280'}>
                  Toda a disciplina (sem livro específico)
                </Typography>
              </Box>
              {myProgress.slice(0, 5).map(p => (
                <Box key={p.contentId} onClick={() => setPrepSelectedProgress(p)}
                  sx={{ p: 1.2, border: `2px solid ${prepSelectedProgress?.contentId === p.contentId ? '#00A651' : '#E5E7EB'}`,
                    borderRadius: 2, cursor: 'pointer',
                    bgcolor: prepSelectedProgress?.contentId === p.contentId ? '#E8F5E9' : '#fff',
                    transition: 'all 0.15s', '&:hover': { borderColor: '#4caf50' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {p.thumbnailUrl ? (
                      <Box component="img" src={p.thumbnailUrl} alt={p.contentTitle}
                        sx={{ width: 30, height: 42, objectFit: 'cover', borderRadius: 0.5, flexShrink: 0 }} />
                    ) : (
                      <Box sx={{ width: 30, height: 42, bgcolor: '#E8F5E9', borderRadius: 0.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookIcon sx={{ color: '#00A651', fontSize: 14 }} />
                      </Box>
                    )}
                    <Box>
                      <Typography variant="body2" fontWeight={700} noWrap color="#0A1628">{p.contentTitle}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.percentageComplete ?? 0}% lido · pág. {p.currentPage ?? 0}/{p.totalPages ?? '?'}
                      </Typography>
                    </Box>
                    {prepSelectedProgress?.contentId === p.contentId && (
                      <CheckIcon sx={{ color: '#00A651', ml: 'auto', flexShrink: 0 }} />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* Discipline + num questions */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField select label="Disciplina" size="small" fullWidth
              value={prepDisciplina} onChange={e => setPrepDisciplina(e.target.value)}>
              <MenuItem value="">Automática</MenuItem>
              {DISCIPLINAS.map(d => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
            </TextField>
            <TextField label="Nº questões" type="number" size="small" sx={{ width: 120 }}
              value={prepNumQ} onChange={e => setPrepNumQ(Math.max(5, Math.min(20, Number(e.target.value))))}
              inputProps={{ min: 5, max: 20 }} />
          </Box>

          {/* Info box about what the AI will use */}
          <Box sx={{ p: 1.5, bgcolor: prepMode === 'EXAM' ? '#F5F3FF' : '#E8F5E9', borderRadius: 2,
            border: `1px solid ${prepMode === 'EXAM' ? '#DDD6FE' : '#A5D6A7'}` }}>
            <Typography variant="caption" fontWeight={600} color={prepMode === 'EXAM' ? '#7C3AED' : '#00A651'}>
              {prepMode === 'EXAM' ? '🎓 Modo Exame' : '📝 Modo Teste'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
              {prepMode === 'EXAM'
                ? 'A IA analisará todo o conteúdo disponível da disciplina, incluindo páginas que ainda não leste, para te preparar para o exame final.'
                : 'A IA focará nos conteúdos mais recentes e nos temas abordados pelo professor para te preparar para o próximo teste.'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              💡 Após o quiz, receberás explicações para cada resposta errada e recomendações de páginas a reler.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setPrepDialog(false)} sx={{ textTransform: 'none', color: '#6B7280' }}>Cancelar</Button>
          <Button variant="contained" disabled={preparingQuiz} onClick={handleStudyPrep}
            startIcon={preparingQuiz ? <CircularProgress size={16} color="inherit" /> : <SchoolIcon />}
            sx={{ bgcolor: prepMode === 'EXAM' ? '#7C3AED' : '#00A651',
              '&:hover': { bgcolor: prepMode === 'EXAM' ? '#6D28D9' : '#008f44' },
              borderRadius: 2, textTransform: 'none', fontWeight: 700, minWidth: 160 }}>
            {preparingQuiz ? 'A preparar quiz...' : `Gerar Quiz de ${prepMode === 'EXAM' ? 'Exame' : 'Teste'}`}
          </Button>
        </DialogActions>
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
      {oralSetupDialog}
      {certificateDialog}
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
              {/* Media evidence */}
              {currentQuestion.mediaUrl && (
                <Box sx={{ mb: 2.5, borderRadius: 2, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                  {currentQuestion.mediaType === 'VIDEO' ? (
                    <Box component="video" src={currentQuestion.mediaUrl} controls
                      sx={{ width: '100%', maxHeight: 320, display: 'block', bgcolor: '#000' }} />
                  ) : currentQuestion.mediaType === 'AUDIO' ? (
                    <Box sx={{ p: 2, bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <AudioIcon sx={{ color: '#6366f1' }} />
                      <Box component="audio" src={currentQuestion.mediaUrl} controls sx={{ flex: 1 }} />
                    </Box>
                  ) : currentQuestion.mediaType === 'DOCUMENT' ? (
                    <Box sx={{ p: 2, bgcolor: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <DocIcon sx={{ color: '#f59e0b' }} />
                      <Typography variant="body2" sx={{ flex: 1 }}>Documento de apoio</Typography>
                      <Button size="small" startIcon={<DownloadIcon />} href={currentQuestion.mediaUrl}
                        target="_blank" rel="noopener noreferrer"
                        sx={{ textTransform: 'none', color: '#6366f1' }}>
                        Abrir
                      </Button>
                    </Box>
                  ) : (
                    <Box component="img" src={currentQuestion.mediaUrl} alt="Evidência"
                      sx={{ width: '100%', maxHeight: 320, objectFit: 'contain', display: 'block', bgcolor: '#f5f5f5' }} />
                  )}
                  <Box sx={{ px: 2, py: 0.8, bgcolor: '#F8FAFC', borderTop: '1px solid #E5E7EB' }}>
                    <Typography variant="caption" color="text.secondary">
                      📎 Analisa este conteúdo antes de responder
                    </Typography>
                  </Box>
                </Box>
              )}
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

          {/* Voice MCQ shortcut */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, justifyContent: 'flex-end' }}>
            <Typography variant="caption" color="text.secondary">Responder por voz (diz A, B, C ou D):</Typography>
            <VoiceRecorderButton
              language="pt-PT"
              accentColor="#00A651"
              buttonSize={34}
              tooltip="Diz a letra da opção (A, B, C ou D)"
              onTranscript={text => {
                const letter = text.trim().toUpperCase().replace(/^(OPÇÃO\s*|OPCAO\s*)/, '').charAt(0);
                if (currentQuestion && ['A','B','C','D','E'].includes(letter)) {
                  const opt = currentQuestion.options.find(o => o.letra === letter);
                  if (opt) handleAnswer(currentQuestion.id, opt.id);
                }
              }}
            />
          </Box>

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
          {/* Teaching Mode Alert */}
          {result.teachingMode && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} color="#c2410c" sx={{ mb: 0.5 }}>
                📖 Modo Ensino Activo
              </Typography>
              <Typography variant="body2" color="#ea580c">
                Tens falhado repetidamente neste quiz. Revê as explicações abaixo com atenção — estuda cada conceito antes de tentar novamente.
              </Typography>
            </Box>
          )}
          {result.suggestProfessor && (
            <Box sx={{ mt: 1.5, p: 2, bgcolor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 2, display: 'flex', gap: 1 }}>
              <ContactIcon sx={{ color: '#dc2626', flexShrink: 0, mt: 0.2 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="#dc2626" sx={{ mb: 0.3 }}>
                  Contacta o teu professor
                </Typography>
                <Typography variant="body2" color="#b91c1c">
                  Após várias tentativas, recomendamos que peças ajuda ao professor para clarificar este conteúdo.
                </Typography>
              </Box>
            </Box>
          )}
          {/* Certificate banner — shown when score >= 80 */}
          {result.certificateId && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#F0FDF4', border: '2px solid #86EFAC',
              borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CertIcon sx={{ color: '#00A651', fontSize: 28, flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color="#15803d">
                  Certificado desbloqueado!
                </Typography>
                <Typography variant="caption" color="#16a34a">
                  Obtiveste {result.score}% — podes descarregar o teu certificado de desempenho.
                </Typography>
              </Box>
              <Button variant="contained" size="small" startIcon={<CertIcon />}
                onClick={() => openCertificate(result.certificateId!)}
                sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' },
                  textTransform: 'none', fontWeight: 700, borderRadius: 2, whiteSpace: 'nowrap' }}>
                Ver Certificado
              </Button>
            </Box>
          )}
          <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 1 }}>
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

      {certificateDialog}

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

                {/* Media (thumbnail in review) */}
                {qr.mediaUrl && (
                  <Box sx={{ ml: 4, mb: 1.5, borderRadius: 1.5, overflow: 'hidden',
                    border: '1px solid #E5E7EB', maxWidth: 320 }}>
                    {qr.mediaType === 'VIDEO'
                      ? <Box component="video" src={qr.mediaUrl} controls
                          sx={{ width: '100%', maxHeight: 160, display: 'block', bgcolor: '#000' }} />
                      : qr.mediaType === 'AUDIO'
                      ? <Box sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                          <AudioIcon sx={{ color: '#6366f1', fontSize: 18 }} />
                          <Box component="audio" src={qr.mediaUrl} controls sx={{ flex: 1, height: 32 }} />
                        </Box>
                      : qr.mediaType === 'DOCUMENT'
                      ? <Box sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                          <DocIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                          <Button size="small" href={qr.mediaUrl} target="_blank" rel="noopener noreferrer"
                            sx={{ textTransform: 'none', color: '#6366f1', fontSize: '0.75rem' }}>
                            Abrir documento
                          </Button>
                        </Box>
                      : <Box component="img" src={qr.mediaUrl} alt="Evidência"
                          sx={{ width: '100%', maxHeight: 160, objectFit: 'contain', display: 'block', bgcolor: '#f5f5f5' }} />
                    }
                  </Box>
                )}

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

                {/* AI explanation */}
                {!qr.correct && qr.explicacao && (
                  <Box sx={{ ml: 4, mt: 1.5, p: 1.5, bgcolor: '#FFF8E1', borderRadius: 2,
                    border: '1px solid #FFE082' }}>
                    <Typography variant="caption" fontWeight={700} color="#b45309" sx={{ display: 'block', mb: 0.3 }}>
                      💡 Porque é que a resposta é essa?
                    </Typography>
                    <Typography variant="body2" color="#92400e">{qr.explicacao}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );

  // ── Oral Taking View ──────────────────────────────────────────
  if (view === 'oral-taking' && oralQuiz) {
    const oralQ = oralQuiz.questions[oralCurrentIdx];
    const oralTotal = oralQuiz.questions.length;
    const answeredOral = Object.keys(oralResponses).length;
    return (
      <Dialog open fullScreen>
        <DialogTitle sx={{ bgcolor: '#0A1628', color: '#fff', p: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, pb: 1.5 }}>
            <OralIcon sx={{ color: '#38bdf8' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>Teste Oral — Inglês</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Responde por voz a cada tópico em Inglês
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {answeredOral}/{oralTotal} respondidas
            </Typography>
            <Tooltip title="Abandonar">
              <IconButton onClick={() => setView('browse')} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <LinearProgress variant="determinate" value={(oralCurrentIdx + 1) / oralTotal * 100}
            sx={{ height: 4, bgcolor: 'rgba(255,255,255,0.15)', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, pb: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 720 }} onClose={() => setError('')}>{error}</Alert>}
          <Box sx={{ width: '100%', maxWidth: 720 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Tópico {oralCurrentIdx + 1} de {oralTotal}</Typography>
            </Box>
            <Card elevation={0} sx={{ border: '1px solid #BAE6FD', borderRadius: 3, mb: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#F0F9FF', borderRadius: 2, border: '1px solid #BAE6FD' }}>
                  <Typography variant="caption" color="#0284c7" fontWeight={600}>
                    🎤 Fala em Inglês durante 1-2 minutos sobre o seguinte tópico:
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight={700} color="#0A1628" sx={{ mb: 3, lineHeight: 1.6 }}>
                  {oralQ.enunciado}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2,
                    bgcolor: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 2 }}>
                    <MicIcon sx={{ color: '#0284c7' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                      Clica no microfone para gravar a tua resposta em Inglês
                    </Typography>
                    <VoiceRecorderButton
                      language="en-US"
                      accentColor="#0284c7"
                      buttonSize={40}
                      tooltip="Gravar resposta em Inglês"
                      onTranscript={text => setOralResponses(prev => ({ ...prev, [oralQ.id]: text }))}
                    />
                  </Box>
                  {oralResponses[oralQ.id] && (
                    <Box sx={{ p: 2, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 2 }}>
                      <Typography variant="caption" fontWeight={600} color="#16a34a" sx={{ display: 'block', mb: 0.5 }}>
                        ✓ Resposta transcrita:
                      </Typography>
                      <Typography variant="body2" color="#15803d" fontStyle="italic">
                        "{oralResponses[oralQ.id]}"
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Button variant="outlined" disabled={oralCurrentIdx === 0}
                onClick={() => setOralCurrentIdx(i => i - 1)}
                sx={{ borderColor: '#0284c7', color: '#0284c7', textTransform: 'none', flex: 1 }}>
                ← Anterior
              </Button>
              {oralCurrentIdx < oralTotal - 1 ? (
                <Button variant="contained" onClick={() => setOralCurrentIdx(i => i + 1)}
                  sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, textTransform: 'none', flex: 1 }}>
                  Próximo →
                </Button>
              ) : (
                <Button variant="contained" disabled={oralSubmitting} onClick={handleOralSubmit}
                  startIcon={oralSubmitting ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
                  sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, textTransform: 'none', flex: 1, fontWeight: 700 }}>
                  {oralSubmitting ? 'A avaliar...' : 'Submeter e Avaliar'}
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0.8, mt: 3 }}>
              {oralQuiz.questions.map((q, i) => (
                <Box key={q.id} onClick={() => setOralCurrentIdx(i)}
                  sx={{ width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${i === oralCurrentIdx ? '#0284c7' : oralResponses[q.id] ? '#0284c7' : '#D1D5DB'}`,
                    bgcolor: i === oralCurrentIdx ? '#0284c7' : oralResponses[q.id] ? '#E0F2FE' : '#fff' }}>
                  <Typography variant="caption" fontWeight={700}
                    color={i === oralCurrentIdx ? '#fff' : oralResponses[q.id] ? '#0284c7' : '#9CA3AF'}>
                    {i + 1}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Oral Result View ──────────────────────────────────────────
  if (view === 'oral-result' && oralResult) {
    const levelColor = oralResult.level === 'SUPERPREPARADO' ? '#16a34a' : oralResult.level === 'ACEITAVEL' ? '#d97706' : '#dc2626';
    const levelBg = oralResult.level === 'SUPERPREPARADO' ? '#F0FDF4' : oralResult.level === 'ACEITAVEL' ? '#FFFBEB' : '#FEF2F2';
    const levelLabel = oralResult.level === 'SUPERPREPARADO' ? '🌟 Superpreparado!' : oralResult.level === 'ACEITAVEL' ? '📈 A melhorar' : '📚 Nível Básico';
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box sx={{ p: 1.2, bgcolor: '#E0F2FE', borderRadius: 2 }}><OralIcon sx={{ color: '#0284c7', fontSize: 28 }} /></Box>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#0A1628">Resultado — Teste Oral</Typography>
            <Typography variant="body2" color="text.secondary">Inglês · Avaliação por IA</Typography>
          </Box>
        </Box>
        <Card elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3, mb: 3, maxWidth: 680 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
              <Box sx={{ width: 100, height: 100, borderRadius: '50%', bgcolor: levelBg, border: `5px solid ${levelColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5 }}>
                <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: levelColor }}>{oralResult.overallScore}%</Typography>
              </Box>
              <Typography variant="h6" fontWeight={700} color={levelColor}>{levelLabel}</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Avaliação por Dimensão</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {oralResult.dimensions.map(d => (
                <Box key={d.name}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{d.name}</Typography>
                    <Typography variant="body2" fontWeight={700}
                      color={d.score >= 80 ? '#16a34a' : d.score >= 50 ? '#d97706' : '#dc2626'}>
                      {d.score}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={d.score}
                    sx={{ height: 6, borderRadius: 3, bgcolor: '#E5E7EB',
                      '& .MuiLinearProgress-bar': { bgcolor: d.score >= 80 ? '#16a34a' : d.score >= 50 ? '#d97706' : '#dc2626' } }} />
                  {d.feedback && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {d.feedback}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
            {oralResult.generalSuggestions && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ p: 1.5, bgcolor: '#F0F9FF', borderRadius: 2, border: '1px solid #BAE6FD' }}>
                  <Typography variant="caption" fontWeight={700} color="#0284c7" sx={{ display: 'block', mb: 0.5 }}>
                    💡 Sugestões gerais:
                  </Typography>
                  <Typography variant="body2" color="#0369a1">{oralResult.generalSuggestions}</Typography>
                </Box>
              </>
            )}
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={1.5} justifyContent="center">
              <Button variant="outlined" onClick={() => { setOralQuiz(null); setOralResult(null); setView('browse'); }}
                sx={{ borderColor: '#0284c7', color: '#0284c7', textTransform: 'none' }}>
                Voltar aos Quizzes
              </Button>
              <Button variant="contained" startIcon={<ReplayIcon />}
                onClick={() => { setOralResult(null); setOralResponses({}); setOralCurrentIdx(0); setView('oral-taking'); }}
                sx={{ bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' }, textTransform: 'none', fontWeight: 700 }}>
                Repetir Teste Oral
              </Button>
            </Stack>
          </CardContent>
        </Card>
        {oralResult.questionFeedback.length > 0 && (
          <Box sx={{ maxWidth: 720 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Feedback por Tópico</Typography>
            {oralResult.questionFeedback.map((qf, i) => (
              <Card key={qf.questionId} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 2, mb: 2 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography fontWeight={700} color="#0A1628" sx={{ mb: 1 }}>{i + 1}. {qf.topic}</Typography>
                  {qf.transcription && (
                    <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, mb: 1.5, border: '1px solid #E5E7EB' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>A tua resposta:</Typography>
                      <Typography variant="body2" fontStyle="italic">"{qf.transcription}"</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <LinearProgress variant="determinate" value={qf.score} sx={{ flex: 1, height: 5, borderRadius: 2,
                      bgcolor: '#E5E7EB', '& .MuiLinearProgress-bar': { bgcolor: qf.score >= 80 ? '#16a34a' : qf.score >= 50 ? '#d97706' : '#dc2626' } }} />
                    <Typography variant="caption" fontWeight={700}
                      color={qf.score >= 80 ? '#16a34a' : qf.score >= 50 ? '#d97706' : '#dc2626'}>{qf.score}%</Typography>
                  </Box>
                  {qf.feedback && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{qf.feedback}</Typography>}
                  {qf.improvedVersion && (
                    <Box sx={{ p: 1.5, bgcolor: '#F0FDF4', borderRadius: 1.5, border: '1px solid #BBF7D0' }}>
                      <Typography variant="caption" fontWeight={700} color="#16a34a" sx={{ display: 'block', mb: 0.3 }}>
                        ✨ Como poderia ser dito melhor:
                      </Typography>
                      <Typography variant="body2" color="#15803d" fontStyle="italic">"{qf.improvedVersion}"</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    );
  }

}
