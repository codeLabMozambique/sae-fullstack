import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Switch, FormControlLabel, IconButton,
  Chip, CircularProgress, Alert, Divider, Stack, Collapse, Tooltip, Tabs, Tab,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Quiz as QuizIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  MenuBook as BookIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { quizService } from '../../services/quizService';
import { searchContents, listSections, createSection, updateSection, deleteSection } from '../../services/contentService';
import type { Content, ContentSection } from '../../services/contentService';
import { DISCIPLINAS } from '../../types/quiz';
import type { QuizSummary, QuizAdmin, CreateQuizDTO, CreateQuestionDTO, CreateOptionDTO } from '../../types/quiz';

const LETTERS = ['A', 'B', 'C', 'D'];

function emptyOptions(): CreateOptionDTO[] {
  return LETTERS.map(l => ({ letra: l, texto: '', correta: false }));
}

export default function ProfessorQuizPage() {
  const [activeTab, setActiveTab] = useState(0);

  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sections tab state
  const [bookSearch, setBookSearch] = useState('');
  const [books, setBooks] = useState<Content[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Content | null>(null);
  const [bookSections, setBookSections] = useState<ContentSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [sectionDialog, setSectionDialog] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState({ sectionName: '', trimester: '', startPage: '', endPage: '' });
  const [savingSection, setSavingSection] = useState(false);

  // Create/Edit quiz dialog
  const [quizDialog, setQuizDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [quizForm, setQuizForm] = useState<CreateQuizDTO>({ titulo: '', descricao: '', disciplina: '', tempoLimiteMinutos: null });
  const [savingQuiz, setSavingQuiz] = useState(false);

  // Question dialog
  const [questionDialog, setQuestionDialog] = useState(false);
  const [targetQuizId, setTargetQuizId] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState<CreateQuestionDTO>({ enunciado: '', options: emptyOptions() });
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Expanded quiz card
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [quizDetails, setQuizDetails] = useState<Record<number, QuizAdmin>>({});

  useEffect(() => { loadQuizzes(); }, []);

  const loadQuizzes = () => {
    setLoading(true);
    quizService.listQuizzes()
      .then(setQuizzes)
      .catch(() => setError('Erro ao carregar quizzes'))
      .finally(() => setLoading(false));
  };

  const loadDetail = (id: number) => {
    quizService.getQuizForAdmin(id).then(detail => {
      setQuizDetails(prev => ({ ...prev, [id]: detail }));
    }).catch(() => {});
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = !prev[id];
      if (next && !quizDetails[id]) loadDetail(id);
      return { ...prev, [id]: next };
    });
  };

  // ── Create/Edit quiz ──────────────────────────────────────────
  const openCreateQuiz = () => {
    setEditingId(null);
    setQuizForm({ titulo: '', descricao: '', disciplina: '', tempoLimiteMinutos: null });
    setQuizDialog(true);
  };

  const openEditQuiz = async (q: QuizSummary) => {
    setEditingId(q.id);
    setQuizForm({ titulo: q.titulo, descricao: q.descricao ?? '', disciplina: q.disciplina, tempoLimiteMinutos: q.tempoLimiteMinutos });
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
      setSuccess(updated.active ? 'Quiz ativado — já visível para os estudantes.' : 'Quiz desativado.');
    } catch {
      setError('Erro ao alterar estado do quiz.');
    }
  };

  // ── Add question ──────────────────────────────────────────────
  const openAddQuestion = (quizId: number) => {
    setTargetQuizId(quizId);
    setQuestionForm({ enunciado: '', options: emptyOptions() });
    setQuestionDialog(true);
  };

  const setOptionField = (idx: number, field: keyof CreateOptionDTO, value: string | boolean) => {
    setQuestionForm(prev => {
      const opts = [...prev.options];
      opts[idx] = { ...opts[idx], [field]: value };
      if (field === 'correta' && value === true) {
        opts.forEach((o, i) => { if (i !== idx) o.correta = false; });
      }
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

  // ── Book sections ─────────────────────────────────────────────
  const searchBooks = useCallback((q: string) => {
    if (!q.trim()) { setBooks([]); return; }
    setBooksLoading(true);
    searchContents(q, 0, 12)
      .then(r => setBooks(r.content))
      .catch(() => {})
      .finally(() => setBooksLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchBooks(bookSearch), 350);
    return () => clearTimeout(t);
  }, [bookSearch, searchBooks]);

  const loadBookSections = (book: Content) => {
    setSelectedBook(book);
    setSectionsLoading(true);
    listSections(book.id)
      .then(setBookSections)
      .catch(() => setBookSections([]))
      .finally(() => setSectionsLoading(false));
  };

  const openAddSection = () => {
    setEditingSectionId(null);
    setSectionForm({ sectionName: '', trimester: '', startPage: '', endPage: '' });
    setSectionDialog(true);
  };

  const openEditSection = (s: ContentSection) => {
    setEditingSectionId(s.id);
    setSectionForm({
      sectionName: s.sectionName,
      trimester: s.trimester?.toString() ?? '',
      startPage: s.startPage.toString(),
      endPage: s.endPage.toString(),
    });
    setSectionDialog(true);
  };

  const saveSection = async () => {
    if (!selectedBook) return;
    if (!sectionForm.sectionName.trim() || !sectionForm.startPage || !sectionForm.endPage) {
      setError('Nome, página inicial e final são obrigatórios.');
      return;
    }
    setSavingSection(true);
    setError('');
    try {
      const payload = {
        sectionName: sectionForm.sectionName,
        trimester: sectionForm.trimester ? Number(sectionForm.trimester) : undefined,
        startPage: Number(sectionForm.startPage),
        endPage: Number(sectionForm.endPage),
      };
      if (editingSectionId) {
        await updateSection(selectedBook.id, editingSectionId, payload);
      } else {
        await createSection(selectedBook.id, payload);
      }
      setSuccess(editingSectionId ? 'Secção actualizada.' : 'Secção criada.');
      setSectionDialog(false);
      loadBookSections(selectedBook);
    } catch {
      setError('Erro ao guardar secção.');
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!selectedBook || !window.confirm('Eliminar esta secção?')) return;
    try {
      await deleteSection(selectedBook.id, sectionId);
      setSuccess('Secção eliminada.');
      setBookSections(prev => prev.filter(s => s.id !== sectionId));
    } catch {
      setError('Erro ao eliminar secção.');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1.2, bgcolor: '#EDE9FE', borderRadius: 2 }}>
            <QuizIcon sx={{ color: '#7C3AED', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#0A1628">Gestão de Quizzes</Typography>
            <Typography variant="body2" color="text.secondary">Cria quizzes e define secções dos livros por trimestre</Typography>
          </Box>
        </Box>
        {activeTab === 0 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateQuiz}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            Criar Quiz
          </Button>
        )}
        {activeTab === 1 && selectedBook && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddSection}
            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
            Adicionar Secção
          </Button>
        )}
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2, borderBottom: '1px solid #E5E7EB',
        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' },
        '& .Mui-selected': { color: '#7C3AED' },
        '& .MuiTabs-indicator': { bgcolor: '#7C3AED' } }}>
        <Tab label="Quizzes" icon={<QuizIcon fontSize="small" />} iconPosition="start" />
        <Tab label="Secções de Livros" icon={<BookIcon fontSize="small" />} iconPosition="start" />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* ── Tab 0: Quizzes ─────────────────────────────────────── */}
      {activeTab === 0 && loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#7C3AED' }} />
        </Box>
      ) : activeTab === 0 && quizzes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <QuizIcon sx={{ fontSize: 64, color: '#C4B5FD', mb: 2 }} />
          <Typography color="text.secondary">Ainda não criaste nenhum quiz.</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateQuiz} sx={{ mt: 2,
            bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, textTransform: 'none' }}>
            Criar o primeiro quiz
          </Button>
        </Box>
      ) : activeTab === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {quizzes.map(q => (
            <Card key={q.id} elevation={0} sx={{ border: '1px solid #E5E7EB', borderRadius: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={700} color="#0A1628" noWrap>{q.titulo}</Typography>
                      <Chip label={q.disciplinaLabel} size="small"
                        sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 600, fontSize: '0.7rem', flexShrink: 0 }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      📝 {q.questionCount} questões
                      {q.tempoLimiteMinutos ? ` · ⏱ ${q.tempoLimiteMinutos} min` : ' · ⏱ Sem limite'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    <FormControlLabel
                      control={<Switch checked={q.active} onChange={() => toggleActive(q.id)}
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#7C3AED' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7C3AED' } }} />}
                      label={<Typography variant="caption" fontWeight={600}
                        color={q.active ? '#059669' : '#9CA3AF'}>{q.active ? 'Ativo' : 'Inativo'}</Typography>}
                    />
                    <Tooltip title="Editar quiz">
                      <IconButton size="small" onClick={() => openEditQuiz(q)} sx={{ color: '#7C3AED' }}>
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

                {/* Question list */}
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
                          <Box key={question.id} sx={{ mb: 2, p: 2, bgcolor: '#F9F8FF', borderRadius: 2,
                            border: '1px solid #DDD6FE' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="body2" fontWeight={600} color="#1E0A3C" sx={{ flex: 1, mr: 1 }}>
                                {idx + 1}. {question.enunciado}
                              </Typography>
                              <IconButton size="small" onClick={() => deleteQuestion(q.id, question.id)}
                                sx={{ color: '#dc2626', flexShrink: 0 }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {question.options.map(opt => (
                                <Box key={opt.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5,
                                  px: 1.5, py: 0.5, borderRadius: 1.5,
                                  bgcolor: opt.correta ? '#DCFCE7' : '#F3F4F6',
                                  border: `1px solid ${opt.correta ? '#86EFAC' : '#E5E7EB'}` }}>
                                  {opt.correta && <CheckIcon sx={{ fontSize: 14, color: '#059669' }} />}
                                  <Typography variant="caption" fontWeight={opt.correta ? 700 : 400}
                                    color={opt.correta ? '#059669' : '#6B7280'}>
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
                        sx={{ borderColor: '#7C3AED', color: '#7C3AED', textTransform: 'none', borderRadius: 2 }}>
                        Adicionar Questão
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} sx={{ color: '#7C3AED' }} />
                    </Box>
                  )}
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : null}

      {/* ── Tab 1: Book Sections ────────────────────────────────── */}
      {activeTab === 1 && (
        <Box>
          {/* Book search */}
          <TextField fullWidth size="small" placeholder="Pesquisar livro por título..."
            value={bookSearch} onChange={e => setBookSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">
                {booksLoading ? <CircularProgress size={16} /> : <SearchIcon fontSize="small" sx={{ color: '#9CA3AF' }} />}
              </InputAdornment>
            }}
            sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            {/* Book list */}
            <Box sx={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 520, overflowY: 'auto' }}>
              {books.length === 0 && bookSearch.trim() && !booksLoading && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>Nenhum livro encontrado.</Typography>
              )}
              {books.length === 0 && !bookSearch.trim() && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <BookIcon sx={{ fontSize: 48, color: '#C4B5FD', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Pesquisa um livro para definir as suas secções.</Typography>
                </Box>
              )}
              {books.map(b => (
                <Card key={b.id} elevation={0} onClick={() => loadBookSections(b)}
                  sx={{ border: `2px solid ${selectedBook?.id === b.id ? '#4F46E5' : '#E5E7EB'}`,
                    borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
                    bgcolor: selectedBook?.id === b.id ? '#EEF2FF' : '#fff',
                    '&:hover': { borderColor: '#818CF8' } }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      {b.thumbnailUrl ? (
                        <Box component="img" src={b.thumbnailUrl} alt={b.title}
                          sx={{ width: 32, height: 44, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />
                      ) : (
                        <Box sx={{ width: 32, height: 44, bgcolor: '#EDE9FE', borderRadius: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <BookIcon sx={{ color: '#7C3AED', fontSize: 16 }} />
                        </Box>
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} fontSize="0.8rem" noWrap color="#0A1628">{b.title}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {b.discipline ?? 'Geral'} · {b.totalPages ?? '?'} págs
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Sections panel */}
            <Box sx={{ flex: 1 }}>
              {!selectedBook ? (
                <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                  <Typography variant="body2">Seleciona um livro para ver e gerir as suas secções.</Typography>
                </Box>
              ) : sectionsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#4F46E5' }} />
                </Box>
              ) : (
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="#0A1628" sx={{ mb: 1.5 }}>
                    {selectedBook.title}
                  </Typography>
                  {bookSections.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4, border: '2px dashed #E5E7EB', borderRadius: 3 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Ainda não há secções definidas para este livro.
                      </Typography>
                      <Button variant="contained" startIcon={<AddIcon />} onClick={openAddSection}
                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' }, textTransform: 'none', fontWeight: 700 }}>
                        Criar primeira secção
                      </Button>
                    </Box>
                  ) : (
                    <Stack spacing={1.5}>
                      {bookSections.map(s => (
                        <Card key={s.id} elevation={0} sx={{ border: '1px solid #DDD6FE', borderRadius: 2 }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {s.trimester && (
                                <Chip label={`${s.trimester}º Tri`} size="small"
                                  sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }} />
                              )}
                              <Typography fontWeight={700} color="#0A1628" sx={{ flex: 1 }}>{s.sectionName}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                págs {s.startPage}–{s.endPage}
                              </Typography>
                              <Tooltip title="Editar">
                                <IconButton size="small" onClick={() => openEditSection(s)} sx={{ color: '#4F46E5' }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton size="small" onClick={() => handleDeleteSection(s.id)} sx={{ color: '#dc2626' }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Section Dialog ──────────────────────────────────────── */}
      <Dialog open={sectionDialog} onClose={() => setSectionDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{editingSectionId ? 'Editar Secção' : 'Nova Secção'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Nome da secção *" fullWidth value={sectionForm.sectionName}
              onChange={e => setSectionForm(p => ({ ...p, sectionName: e.target.value }))}
              placeholder="Ex: 1º Trimestre, Capítulo 1..." />
            <TextField select label="Trimestre (opcional)" fullWidth value={sectionForm.trimester}
              onChange={e => setSectionForm(p => ({ ...p, trimester: e.target.value }))}>
              <MenuItem value="">Nenhum</MenuItem>
              <MenuItem value="1">1º Trimestre</MenuItem>
              <MenuItem value="2">2º Trimestre</MenuItem>
              <MenuItem value="3">3º Trimestre</MenuItem>
            </TextField>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField type="number" label="Página inicial *" fullWidth size="small"
                value={sectionForm.startPage}
                onChange={e => setSectionForm(p => ({ ...p, startPage: e.target.value }))}
                inputProps={{ min: 1 }} />
              <TextField type="number" label="Página final *" fullWidth size="small"
                value={sectionForm.endPage}
                onChange={e => setSectionForm(p => ({ ...p, endPage: e.target.value }))}
                inputProps={{ min: 1 }} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSectionDialog(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" onClick={saveSection} disabled={savingSection}
            startIcon={savingSection ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' }, textTransform: 'none', fontWeight: 700 }}>
            {savingSection ? 'A guardar...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Create/Edit Quiz Dialog ─────────────────────────────── */}
      <Dialog open={quizDialog} onClose={() => setQuizDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editingId ? 'Editar Quiz' : 'Criar Novo Quiz'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Título *" fullWidth value={quizForm.titulo}
              onChange={e => setQuizForm(p => ({ ...p, titulo: e.target.value }))} />
            <TextField label="Descrição" fullWidth multiline rows={2} value={quizForm.descricao}
              onChange={e => setQuizForm(p => ({ ...p, descricao: e.target.value }))} />
            <TextField select label="Disciplina *" fullWidth value={quizForm.disciplina}
              onChange={e => setQuizForm(p => ({ ...p, disciplina: e.target.value }))}>
              {DISCIPLINAS.map(d => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
            </TextField>
            <TextField type="number" label="Tempo limite (minutos)" fullWidth
              value={quizForm.tempoLimiteMinutos ?? ''}
              onChange={e => setQuizForm(p => ({ ...p, tempoLimiteMinutos: e.target.value ? Number(e.target.value) : null }))}
              helperText="Deixa em branco para sem limite de tempo" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setQuizDialog(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" onClick={saveQuiz} disabled={savingQuiz}
            startIcon={savingQuiz ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, textTransform: 'none', fontWeight: 700 }}>
            {savingQuiz ? 'A guardar...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Question Dialog ─────────────────────────────────── */}
      <Dialog open={questionDialog} onClose={() => setQuestionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>Adicionar Questão</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Enunciado da questão *" fullWidth multiline rows={3}
              value={questionForm.enunciado}
              onChange={e => setQuestionForm(p => ({ ...p, enunciado: e.target.value }))} />
            <Typography variant="subtitle2" fontWeight={700} color="#1E0A3C">
              Opções de resposta (marca a correta)
            </Typography>
            {questionForm.options.map((opt, idx) => (
              <Box key={opt.letra} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ minWidth: 32, height: 32, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  bgcolor: opt.correta ? '#7C3AED' : '#E5E7EB' }}>
                  <Typography variant="caption" fontWeight={700}
                    color={opt.correta ? '#fff' : '#6B7280'}>{opt.letra}</Typography>
                </Box>
                <TextField fullWidth size="small" label={`Opção ${opt.letra}`}
                  value={opt.texto}
                  onChange={e => setOptionField(idx, 'texto', e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': {
                    borderColor: opt.correta ? '#7C3AED' : undefined,
                    '& fieldset': { borderColor: opt.correta ? '#7C3AED' : undefined } } }} />
                <Tooltip title={opt.correta ? 'Resposta correta' : 'Marcar como correta'}>
                  <IconButton onClick={() => setOptionField(idx, 'correta', true)}
                    sx={{ color: opt.correta ? '#7C3AED' : '#D1D5DB', flexShrink: 0 }}>
                    <CheckIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setQuestionDialog(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" onClick={saveQuestion} disabled={savingQuestion}
            startIcon={savingQuestion ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, textTransform: 'none', fontWeight: 700 }}>
            {savingQuestion ? 'A guardar...' : 'Adicionar Questão'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
