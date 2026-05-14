import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Switch, FormControlLabel, IconButton,
  Chip, CircularProgress, Alert, Divider, Stack, Collapse, Tooltip, LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Quiz as QuizIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioFileIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  AttachFile as AttachIcon,
} from '@mui/icons-material';
import { quizService } from '../../services/quizService';
import { uploadAttachment, attachmentUrl } from '../../services/contentService';
import { DISCIPLINAS as DISCIPLINAS_FALLBACK } from '../../types/quiz';
import type { QuizSummary, QuizAdmin, CreateQuizDTO, CreateQuestionDTO, CreateOptionDTO } from '../../types/quiz';

const LETTERS = ['A', 'B', 'C', 'D'];

// Accepts all common media and document formats
const ALL_ACCEPT =
  'image/*,video/*,audio/*,' +
  'application/pdf,' +
  'application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
  'application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,' +
  'application/vnd.oasis.opendocument.text,application/vnd.oasis.opendocument.spreadsheet,application/vnd.oasis.opendocument.presentation,' +
  'text/plain';

function detectMediaType(file: File): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' {
  if (file.type.startsWith('image/')) return 'IMAGE';
  if (file.type.startsWith('video/')) return 'VIDEO';
  if (file.type.startsWith('audio/')) return 'AUDIO';
  return 'DOCUMENT';
}

function emptyOptions(): CreateOptionDTO[] {
  return LETTERS.map(l => ({ letra: l, texto: '', correta: false }));
}

// ── Small helpers ────────────────────────────────────────────────────────────
function typeLabel(type?: string | null) {
  if (type === 'VIDEO') return 'Vídeo';
  if (type === 'AUDIO') return 'Áudio';
  if (type === 'DOCUMENT') return 'Documento';
  if (type === 'IMAGE') return 'Imagem';
  return 'Ficheiro';
}

function typeColor(type?: string | null) {
  if (type === 'VIDEO') return '#6366f1';
  if (type === 'AUDIO') return '#0284c7';
  if (type === 'DOCUMENT') return '#f59e0b';
  if (type === 'IMAGE') return '#00A651';
  return '#6B7280';
}

function typeBg(type?: string | null) {
  if (type === 'VIDEO') return '#EEF2FF';
  if (type === 'AUDIO') return '#E0F2FE';
  if (type === 'DOCUMENT') return '#FFFBEB';
  if (type === 'IMAGE') return '#E8F5E9';
  return '#F3F4F6';
}

function TypeIcon({ type, size = 14 }: { type?: string | null; size?: number }) {
  const sx = { fontSize: size };
  if (type === 'VIDEO') return <VideoIcon sx={{ ...sx, color: typeColor(type) }} />;
  if (type === 'AUDIO') return <AudioFileIcon sx={{ ...sx, color: typeColor(type) }} />;
  if (type === 'DOCUMENT') return <PdfIcon sx={{ ...sx, color: typeColor(type) }} />;
  if (type === 'IMAGE') return <ImageIcon sx={{ ...sx, color: typeColor(type) }} />;
  return <FileIcon sx={{ ...sx, color: '#6B7280' }} />;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ProfessorQuizPage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Quiz form ────────────────────────────────────────────────────────────
  const [quizDialog, setQuizDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [quizForm, setQuizForm] = useState<CreateQuizDTO>({
    titulo: '', descricao: '', disciplina: '', tempoLimiteMinutos: null,
    thumbnailUrl: undefined, thumbnailType: undefined,
  });
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [quizFileUploading, setQuizFileUploading] = useState(false);
  const [quizFileName, setQuizFileName] = useState<string>('');
  const quizFileRef = useRef<HTMLInputElement>(null);

  // ── Question form ────────────────────────────────────────────────────────
  const [questionDialog, setQuestionDialog] = useState(false);
  const [targetQuizId, setTargetQuizId] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState<CreateQuestionDTO>({ enunciado: '', options: emptyOptions() });
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [questionFileUploading, setQuestionFileUploading] = useState(false);
  const [questionMediaPreview, setQuestionMediaPreview] = useState<{ url: string; type: string; name: string } | null>(null);
  const questionFileRef = useRef<HTMLInputElement>(null);

  // ── Expand state ─────────────────────────────────────────────────────────
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [quizDetails, setQuizDetails] = useState<Record<number, QuizAdmin>>({});
  const [disciplinas, setDisciplinas] = useState<{ value: string; label: string }[]>(DISCIPLINAS_FALLBACK);

  useEffect(() => { loadQuizzes(); }, []);

  useEffect(() => {
    const labelMap = Object.fromEntries(DISCIPLINAS_FALLBACK.map(d => [d.value, d.label]));
    quizService.getDisciplinesAll()
      .then(list => {
        if (list && list.length > 0)
          setDisciplinas(list.map(d => ({ value: d, label: labelMap[d] ?? d })));
      })
      .catch(() => {});
  }, []);

  const loadQuizzes = () => {
    setLoading(true);
    quizService.listQuizzes()
      .then(setQuizzes)
      .catch(() => setError('Erro ao carregar quizzes'))
      .finally(() => setLoading(false));
  };

  const loadDetail = (id: number) => {
    quizService.getQuizForAdmin(id)
      .then(detail => setQuizDetails(prev => ({ ...prev, [id]: detail })))
      .catch(() => {});
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = !prev[id];
      if (next && !quizDetails[id]) loadDetail(id);
      return { ...prev, [id]: next };
    });
  };

  // ── Quiz file upload ─────────────────────────────────────────────────────
  const handleQuizFileUpload = async (file: File) => {
    setQuizFileUploading(true);
    setError('');
    try {
      const att = await uploadAttachment(file, 'quiz_attachment', 'pending');
      const url = attachmentUrl(att.id!);
      const mType = detectMediaType(file);
      setQuizForm(p => ({ ...p, thumbnailUrl: url, thumbnailType: mType }));
      setQuizFileName(file.name);
    } catch {
      setError('Erro ao enviar ficheiro. Verifica a ligação ao servidor.');
    } finally {
      setQuizFileUploading(false);
    }
  };

  const removeQuizFile = () => {
    setQuizForm(p => ({ ...p, thumbnailUrl: undefined, thumbnailType: undefined }));
    setQuizFileName('');
    if (quizFileRef.current) quizFileRef.current.value = '';
  };

  // ── Create / Edit quiz ───────────────────────────────────────────────────
  const openCreateQuiz = () => {
    setEditingId(null);
    setQuizForm({ titulo: '', descricao: '', disciplina: '', tempoLimiteMinutos: null, thumbnailUrl: undefined, thumbnailType: undefined });
    setQuizFileName('');
    if (quizFileRef.current) quizFileRef.current.value = '';
    setQuizDialog(true);
  };

  const openEditQuiz = (q: QuizSummary) => {
    setEditingId(q.id);
    setQuizForm({
      titulo: q.titulo, descricao: q.descricao ?? '', disciplina: q.disciplina,
      tempoLimiteMinutos: q.tempoLimiteMinutos,
      thumbnailUrl: q.thumbnailUrl, thumbnailType: q.thumbnailType,
    });
    setQuizFileName(q.thumbnailUrl ? '(ficheiro existente)' : '');
    setQuizDialog(true);
  };

  const saveQuiz = async () => {
    if (!quizForm.titulo.trim() || !quizForm.disciplina) {
      setError('Título e disciplina são obrigatórios.');
      return;
    }
    setSavingQuiz(true);
    setError('');
    try {
      if (editingId) {
        await quizService.updateQuiz(editingId, quizForm);
        setSuccess('Quiz atualizado com sucesso!');
        loadDetail(editingId);
      } else {
        await quizService.createQuiz(quizForm);
        setSuccess('Quiz criado com sucesso!');
      }
      setQuizDialog(false);
      loadQuizzes();
    } catch {
      setError('Erro ao guardar quiz.');
    } finally {
      setSavingQuiz(false);
    }
  };

  const deleteQuiz = async (id: number, titulo: string) => {
    if (!window.confirm(`Eliminar o quiz "${titulo}"? Esta acção não pode ser desfeita.`)) return;
    try {
      await quizService.deleteQuiz(id);
      setSuccess('Quiz eliminado.');
      setQuizzes(prev => prev.filter(q => q.id !== id));
    } catch {
      setError('Erro ao eliminar quiz.');
    }
  };

  const toggleActive = async (id: number) => {
    try {
      const updated = await quizService.toggleActive(id);
      setQuizzes(prev => prev.map(q => q.id === id ? { ...q, active: updated.active } : q));
      setSuccess(updated.active ? 'Quiz ativado — visível para os estudantes.' : 'Quiz desativado.');
    } catch {
      setError('Erro ao alterar estado do quiz.');
    }
  };

  // ── Question file upload ─────────────────────────────────────────────────
  const openAddQuestion = (quizId: number) => {
    setTargetQuizId(quizId);
    setQuestionForm({ enunciado: '', options: emptyOptions() });
    setQuestionMediaPreview(null);
    if (questionFileRef.current) questionFileRef.current.value = '';
    setQuestionDialog(true);
  };

  const handleQuestionFileUpload = async (file: File) => {
    setQuestionFileUploading(true);
    setError('');
    try {
      const att = await uploadAttachment(file, 'quiz_question', 'pending');
      const url = attachmentUrl(att.id!);
      const mType = detectMediaType(file);
      setQuestionForm(p => ({ ...p, mediaUrl: url, mediaType: mType }));
      setQuestionMediaPreview({ url, type: mType, name: file.name });
    } catch {
      setError('Erro ao enviar ficheiro. Verifica a ligação ao servidor.');
    } finally {
      setQuestionFileUploading(false);
    }
  };

  const removeQuestionMedia = () => {
    setQuestionForm(p => ({ ...p, mediaUrl: undefined, mediaType: undefined }));
    setQuestionMediaPreview(null);
    if (questionFileRef.current) questionFileRef.current.value = '';
  };

  const setOptionField = (idx: number, field: keyof CreateOptionDTO, value: string | boolean) => {
    setQuestionForm(prev => {
      const opts = [...prev.options];
      opts[idx] = { ...opts[idx], [field]: value };
      if (field === 'correta' && value === true)
        opts.forEach((o, i) => { if (i !== idx) o.correta = false; });
      return { ...prev, options: opts };
    });
  };

  const saveQuestion = async () => {
    if (!questionForm.enunciado.trim()) { setError('Enunciado da questão é obrigatório.'); return; }
    if (!questionForm.options.every(o => o.texto.trim())) { setError('Preenche todas as opções.'); return; }
    if (!questionForm.options.some(o => o.correta)) { setError('Marca a opção correta.'); return; }
    if (!targetQuizId) return;
    setSavingQuestion(true);
    setError('');
    try {
      const updated = await quizService.addQuestion(targetQuizId, questionForm);
      setQuizDetails(prev => ({ ...prev, [targetQuizId]: updated }));
      setQuizzes(prev => prev.map(q => q.id === targetQuizId ? { ...q, questionCount: updated.questions.length } : q));
      setSuccess('Questão adicionada!');
      setQuestionDialog(false);
    } catch {
      setError('Erro ao adicionar questão.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const deleteQuestion = async (quizId: number, questionId: number) => {
    if (!window.confirm('Eliminar esta questão?')) return;
    try {
      await quizService.deleteQuestion(quizId, questionId);
      loadDetail(quizId);
      loadQuizzes();
      setSuccess('Questão eliminada.');
    } catch {
      setError('Erro ao eliminar questão.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1.2, bgcolor: '#E8F5E9', borderRadius: 2 }}>
            <QuizIcon sx={{ color: '#00A651', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#0A1628">Gestão de Quizzes</Typography>
            <Typography variant="body2" color="text.secondary">
              Cria quizzes para testar a capacidade de compreensão da matéria por parte dos teus estudantes
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateQuiz}
          sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
          Criar Quiz
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* ── Quiz list ─────────────────────────────────────────────────────── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#00A651' }} />
        </Box>
      ) : quizzes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <QuizIcon sx={{ fontSize: 64, color: '#A5D6A7', mb: 2 }} />
          <Typography color="text.secondary" sx={{ mb: 2 }}>Ainda não criaste nenhum quiz.</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateQuiz}
            sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' }, textTransform: 'none' }}>
            Criar o primeiro quiz
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {quizzes.map(q => (
            <Card key={q.id} elevation={0}
              sx={{ border: '1px solid #E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
              {/* Banner only for image attachments */}
              {q.thumbnailUrl && q.thumbnailType === 'IMAGE' && (
                <Box component="img" src={q.thumbnailUrl} alt={q.titulo}
                  sx={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
              )}
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle1" fontWeight={700} color="#0A1628" noWrap>{q.titulo}</Typography>
                      <Chip label={q.disciplinaLabel} size="small"
                        sx={{ bgcolor: '#E8F5E9', color: '#00A651', fontWeight: 600, fontSize: '0.7rem', flexShrink: 0 }} />
                      {/* Attachment badge for non-image types */}
                      {q.thumbnailUrl && q.thumbnailType !== 'IMAGE' && (
                        <Chip
                          icon={<TypeIcon type={q.thumbnailType} size={12} />}
                          label={typeLabel(q.thumbnailType)}
                          size="small"
                          sx={{
                            bgcolor: typeBg(q.thumbnailType), color: typeColor(q.thumbnailType),
                            fontWeight: 600, fontSize: '0.7rem', flexShrink: 0,
                            '& .MuiChip-icon': { color: typeColor(q.thumbnailType) },
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      📝 {q.questionCount} questões
                      {q.tempoLimiteMinutos ? ` · ⏱ ${q.tempoLimiteMinutos} min` : ' · ⏱ Sem limite'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    <FormControlLabel
                      control={<Switch checked={q.active} onChange={() => toggleActive(q.id)}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#00A651' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#00A651' } }} />}
                      label={<Typography variant="caption" fontWeight={600}
                        color={q.active ? '#00A651' : '#9CA3AF'}>{q.active ? 'Ativo' : 'Inativo'}</Typography>}
                    />
                    <Tooltip title="Editar quiz">
                      <IconButton size="small" onClick={() => openEditQuiz(q)} sx={{ color: '#00A651' }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar quiz">
                      <IconButton size="small" onClick={() => deleteQuiz(q.id, q.titulo)} sx={{ color: '#dc2626' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={expanded[q.id] ? 'Ocultar questões' : 'Ver questões'}>
                      <IconButton size="small" onClick={() => toggleExpand(q.id)} sx={{ color: '#6B7280' }}>
                        {expanded[q.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Collapse in={expanded[q.id]}>
                  <Divider sx={{ my: 2 }} />
                  {quizDetails[q.id] ? (
                    <Box>
                      {quizDetails[q.id].questions.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Ainda sem questões.
                        </Typography>
                      ) : (
                        quizDetails[q.id].questions.map((question, idx) => (
                          <Box key={question.id} sx={{ mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #C8E6C9' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Box sx={{ flex: 1, mr: 1 }}>
                                <Typography variant="body2" fontWeight={600} color="#0A1628">
                                  {idx + 1}. {question.enunciado}
                                </Typography>
                                {question.mediaUrl && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                    <TypeIcon type={question.mediaType} size={12} />
                                    <Typography variant="caption" color="text.secondary">
                                      {typeLabel(question.mediaType)}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                              <IconButton size="small" onClick={() => deleteQuestion(q.id, question.id)}
                                sx={{ color: '#dc2626', flexShrink: 0 }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {question.options.map(opt => (
                                <Box key={opt.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5,
                                  px: 1.5, py: 0.5, borderRadius: 1.5,
                                  bgcolor: opt.correta ? '#E8F5E9' : '#F3F4F6',
                                  border: `1px solid ${opt.correta ? '#A5D6A7' : '#E5E7EB'}` }}>
                                  {opt.correta && <CheckIcon sx={{ fontSize: 14, color: '#00A651' }} />}
                                  <Typography variant="caption" fontWeight={opt.correta ? 700 : 400}
                                    color={opt.correta ? '#00A651' : '#6B7280'}>
                                    {opt.letra}) {opt.texto}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        ))
                      )}
                      <Button variant="outlined" startIcon={<AddIcon />} size="small"
                        onClick={() => openAddQuestion(q.id)}
                        sx={{ borderColor: '#00A651', color: '#00A651', textTransform: 'none', borderRadius: 2 }}>
                        Adicionar Questão
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} sx={{ color: '#00A651' }} />
                    </Box>
                  )}
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════
          ── Create / Edit Quiz Dialog ────────────────────────────
          ════════════════════════════════════════════════════════════ */}
      <Dialog open={quizDialog} onClose={() => !savingQuiz && setQuizDialog(false)}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editingId ? 'Editar Quiz' : 'Criar Novo Quiz'}
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError('')}>{error}</Alert>}
          <Stack spacing={2.5}>
            {/* ── Core fields ── */}
            <TextField label="Título *" fullWidth value={quizForm.titulo}
              onChange={e => setQuizForm(p => ({ ...p, titulo: e.target.value }))} />

            <TextField label="Descrição" fullWidth multiline rows={2} value={quizForm.descricao}
              onChange={e => setQuizForm(p => ({ ...p, descricao: e.target.value }))}
              placeholder="Descreve brevemente o objectivo deste quiz..." />

            <TextField select label="Disciplina *" fullWidth value={quizForm.disciplina}
              onChange={e => setQuizForm(p => ({ ...p, disciplina: e.target.value }))}>
              {disciplinas.map(d => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
            </TextField>

            <TextField type="number" label="Tempo limite (minutos)" fullWidth
              value={quizForm.tempoLimiteMinutos ?? ''}
              onChange={e => setQuizForm(p => ({ ...p, tempoLimiteMinutos: e.target.value ? Number(e.target.value) : null }))}
              helperText="Deixa em branco para sem limite de tempo"
              inputProps={{ min: 1 }} />

            {/* ── File / Media attachment (below last field, before buttons) ── */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#0A1628" sx={{ mb: 0.5 }}>
                Ficheiro de Apoio{' '}
                <Typography component="span" variant="caption" color="text.secondary" fontWeight={400}>
                  (opcional)
                </Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Imagem, vídeo, áudio, PDF, Word, Excel, PowerPoint ou qualquer outro ficheiro que os estudantes devem consultar ao responder ao quiz.
              </Typography>

              {/* Hidden input — accepts everything */}
              <input
                ref={quizFileRef}
                type="file"
                accept={ALL_ACCEPT}
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) handleQuizFileUpload(e.target.files[0]); }}
              />

              {!quizForm.thumbnailUrl ? (
                /* ── Empty drop zone ── */
                <Box
                  onClick={() => !quizFileUploading && quizFileRef.current?.click()}
                  sx={{
                    border: '2px dashed #D1D5DB', borderRadius: 2, p: 2.5, textAlign: 'center',
                    cursor: quizFileUploading ? 'default' : 'pointer', transition: 'all 0.15s',
                    '&:hover': quizFileUploading ? {} : { borderColor: '#00A651', bgcolor: '#F1F8E9' },
                  }}
                >
                  {quizFileUploading ? (
                    <Box>
                      <CircularProgress size={26} sx={{ color: '#00A651', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>A enviar ficheiro...</Typography>
                      <LinearProgress sx={{ maxWidth: 180, mx: 'auto', '& .MuiLinearProgress-bar': { bgcolor: '#00A651' } }} />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8 }}>
                      <UploadIcon sx={{ fontSize: 36, color: '#9CA3AF' }} />
                      <Typography variant="body2" fontWeight={600} color="#374151">
                        Clica para seleccionar ficheiro
                      </Typography>
                      {/* Format pills */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.6, mt: 0.5 }}>
                        {[
                          { icon: <ImageIcon sx={{ fontSize: 11 }} />, label: 'Imagem', c: '#00A651', bg: '#E8F5E9' },
                          { icon: <VideoIcon sx={{ fontSize: 11 }} />, label: 'Vídeo', c: '#6366f1', bg: '#EEF2FF' },
                          { icon: <AudioFileIcon sx={{ fontSize: 11 }} />, label: 'Áudio', c: '#0284c7', bg: '#E0F2FE' },
                          { icon: <PdfIcon sx={{ fontSize: 11 }} />, label: 'PDF', c: '#f59e0b', bg: '#FFFBEB' },
                          { icon: <FileIcon sx={{ fontSize: 11 }} />, label: 'Word / Excel / PPT', c: '#6B7280', bg: '#F3F4F6' },
                        ].map(item => (
                          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.4,
                            px: 0.9, py: 0.25, bgcolor: item.bg, borderRadius: 1 }}>
                            <Box sx={{ color: item.c }}>{item.icon}</Box>
                            <Typography variant="caption" sx={{ color: item.c, fontWeight: 600, fontSize: '0.68rem' }}>
                              {item.label}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                /* ── File attached — preview row ── */
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  p: 1.5, border: `1.5px solid ${typeColor(quizForm.thumbnailType)}33`,
                  borderRadius: 2, bgcolor: typeBg(quizForm.thumbnailType),
                }}>
                  {quizForm.thumbnailType === 'IMAGE' ? (
                    <Box component="img" src={quizForm.thumbnailUrl} alt="preview"
                      sx={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0, border: '1px solid #E5E7EB' }} />
                  ) : (
                    <Box sx={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: '#fff', borderRadius: 1.5, flexShrink: 0, border: '1px solid #E5E7EB' }}>
                      <TypeIcon type={quizForm.thumbnailType} size={26} />
                    </Box>
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} color="#0A1628" noWrap>
                      {quizFileName || typeLabel(quizForm.thumbnailType)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: typeColor(quizForm.thumbnailType), fontWeight: 600 }}>
                      {typeLabel(quizForm.thumbnailType)} adicionado com sucesso
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    <Tooltip title="Substituir ficheiro">
                      <IconButton size="small" onClick={() => quizFileRef.current?.click()}
                        sx={{ color: '#6B7280', '&:hover': { color: '#374151' } }}>
                        <AttachIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remover ficheiro">
                      <IconButton size="small" onClick={removeQuizFile}
                        sx={{ color: '#dc2626', '&:hover': { bgcolor: '#FEF2F2' } }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setQuizDialog(false)} disabled={savingQuiz}
            sx={{ textTransform: 'none', color: '#6B7280', fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={saveQuiz} disabled={savingQuiz || quizFileUploading}
            startIcon={savingQuiz ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' }, textTransform: 'none', fontWeight: 700, minWidth: 140, borderRadius: 2 }}>
            {savingQuiz ? 'A guardar...' : editingId ? 'Actualizar Quiz' : 'Criar Quiz'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════
          ── Add Question Dialog ──────────────────────────────────
          ════════════════════════════════════════════════════════════ */}
      <Dialog open={questionDialog} onClose={() => !savingQuestion && setQuestionDialog(false)}
        maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Adicionar Questão</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5}>
            {/* ── Question text ── */}
            <TextField label="Enunciado da questão *" fullWidth multiline rows={3}
              value={questionForm.enunciado}
              onChange={e => setQuestionForm(p => ({ ...p, enunciado: e.target.value }))}
              placeholder="Escreve aqui a pergunta..." />

            {/* ── Media / File for the question ── */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#0A1628" sx={{ mb: 0.5 }}>
                Evidência / Ficheiro de contexto{' '}
                <Typography component="span" variant="caption" color="text.secondary" fontWeight={400}>(opcional)</Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Adiciona qualquer ficheiro (imagem, vídeo, áudio, PDF, documento) que os estudantes devem ver antes de responder.
              </Typography>

              <input
                ref={questionFileRef}
                type="file"
                accept={ALL_ACCEPT}
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.[0]) handleQuestionFileUpload(e.target.files[0]); }}
              />

              {!questionMediaPreview ? (
                <Box
                  onClick={() => !questionFileUploading && questionFileRef.current?.click()}
                  sx={{
                    border: '2px dashed #C8E6C9', borderRadius: 2, p: 2.5, textAlign: 'center',
                    cursor: questionFileUploading ? 'default' : 'pointer', transition: 'all 0.15s',
                    '&:hover': questionFileUploading ? {} : { borderColor: '#00A651', bgcolor: '#F1F8E9' },
                  }}
                >
                  {questionFileUploading ? (
                    <Box>
                      <CircularProgress size={26} sx={{ color: '#00A651', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>A enviar ficheiro...</Typography>
                      <LinearProgress sx={{ maxWidth: 180, mx: 'auto', '& .MuiLinearProgress-bar': { bgcolor: '#00A651' } }} />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8 }}>
                      <UploadIcon sx={{ fontSize: 36, color: '#A5D6A7' }} />
                      <Typography variant="body2" fontWeight={600} color="#374151">
                        Clica para seleccionar ficheiro
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.6, mt: 0.5 }}>
                        {[
                          { icon: <ImageIcon sx={{ fontSize: 11 }} />, label: 'Imagem', c: '#00A651', bg: '#E8F5E9' },
                          { icon: <VideoIcon sx={{ fontSize: 11 }} />, label: 'Vídeo', c: '#6366f1', bg: '#EEF2FF' },
                          { icon: <AudioFileIcon sx={{ fontSize: 11 }} />, label: 'Áudio', c: '#0284c7', bg: '#E0F2FE' },
                          { icon: <PdfIcon sx={{ fontSize: 11 }} />, label: 'PDF', c: '#f59e0b', bg: '#FFFBEB' },
                          { icon: <FileIcon sx={{ fontSize: 11 }} />, label: 'Word / Excel / PPT', c: '#6B7280', bg: '#F3F4F6' },
                        ].map(item => (
                          <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.4,
                            px: 0.9, py: 0.25, bgcolor: item.bg, borderRadius: 1 }}>
                            <Box sx={{ color: item.c }}>{item.icon}</Box>
                            <Typography variant="caption" sx={{ color: item.c, fontWeight: 600, fontSize: '0.68rem' }}>
                              {item.label}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{
                  border: `1.5px solid ${typeColor(questionMediaPreview.type)}33`,
                  borderRadius: 2, overflow: 'hidden',
                  bgcolor: typeBg(questionMediaPreview.type),
                }}>
                  {/* Rich preview for image/video/audio */}
                  {questionMediaPreview.type === 'IMAGE' && (
                    <Box component="img" src={questionMediaPreview.url} alt="Média"
                      sx={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block', bgcolor: '#f5f5f5' }} />
                  )}
                  {questionMediaPreview.type === 'VIDEO' && (
                    <Box component="video" src={questionMediaPreview.url} controls
                      sx={{ width: '100%', maxHeight: 200, display: 'block', bgcolor: '#000' }} />
                  )}
                  {questionMediaPreview.type === 'AUDIO' && (
                    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <AudioFileIcon sx={{ color: '#0284c7', fontSize: 28, flexShrink: 0 }} />
                      <Box component="audio" src={questionMediaPreview.url} controls sx={{ flex: 1 }} />
                    </Box>
                  )}
                  {/* File info row */}
                  <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {questionMediaPreview.type !== 'IMAGE' && questionMediaPreview.type !== 'VIDEO' && questionMediaPreview.type !== 'AUDIO' && (
                      <TypeIcon type={questionMediaPreview.type} size={18} />
                    )}
                    <Typography variant="caption" fontWeight={600} sx={{ color: typeColor(questionMediaPreview.type), flex: 1 }} noWrap>
                      {questionMediaPreview.name || typeLabel(questionMediaPreview.type)}
                    </Typography>
                    {questionMediaPreview.type === 'DOCUMENT' && (
                      <Button size="small" href={questionMediaPreview.url} target="_blank" rel="noopener noreferrer"
                        sx={{ textTransform: 'none', color: '#6366f1', fontSize: '0.72rem', flexShrink: 0 }}>
                        Visualizar
                      </Button>
                    )}
                    <Tooltip title="Substituir">
                      <IconButton size="small" onClick={() => questionFileRef.current?.click()}
                        sx={{ color: '#6B7280' }}>
                        <AttachIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remover">
                      <IconButton size="small" onClick={removeQuestionMedia}
                        sx={{ color: '#dc2626', '&:hover': { bgcolor: '#FEF2F2' } }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              )}
            </Box>

            {/* ── Answer options ── */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#0A1628" sx={{ mb: 1.5 }}>
                Opções de resposta{' '}
                <Typography component="span" variant="caption" color="text.secondary" fontWeight={400}>
                  (clica no ✓ para marcar a correta)
                </Typography>
              </Typography>
              <Stack spacing={1.5}>
                {questionForm.options.map((opt, idx) => (
                  <Box key={opt.letra} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      minWidth: 32, height: 32, borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      bgcolor: opt.correta ? '#00A651' : '#E5E7EB', transition: 'background 0.15s',
                    }}>
                      <Typography variant="caption" fontWeight={700}
                        color={opt.correta ? '#fff' : '#6B7280'}>{opt.letra}</Typography>
                    </Box>
                    <TextField fullWidth size="small" label={`Opção ${opt.letra}`}
                      value={opt.texto}
                      onChange={e => setOptionField(idx, 'texto', e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root fieldset': {
                        borderColor: opt.correta ? '#00A651' : undefined,
                        borderWidth: opt.correta ? 2 : undefined,
                      } }} />
                    <Tooltip title={opt.correta ? 'Resposta correta ✓' : 'Marcar como correta'}>
                      <IconButton onClick={() => setOptionField(idx, 'correta', true)}
                        sx={{ color: opt.correta ? '#00A651' : '#D1D5DB', flexShrink: 0, transition: 'color 0.15s' }}>
                        <CheckIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setQuestionDialog(false)} disabled={savingQuestion}
            sx={{ textTransform: 'none', color: '#6B7280', fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={saveQuestion} disabled={savingQuestion || questionFileUploading}
            startIcon={savingQuestion ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ bgcolor: '#00A651', '&:hover': { bgcolor: '#008f44' }, textTransform: 'none', fontWeight: 700, minWidth: 160, borderRadius: 2 }}>
            {savingQuestion ? 'A guardar...' : 'Adicionar Questão'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
