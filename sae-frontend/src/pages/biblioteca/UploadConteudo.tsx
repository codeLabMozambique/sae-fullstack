import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem,
  Alert, Stack, LinearProgress, Chip, IconButton, Divider, InputAdornment,
  Stepper, Step, StepLabel, Paper,
} from '@mui/material';
import {
  CloudUpload as UploadIcon, CheckCircle as CheckIcon,
  PictureAsPdf as PdfIcon, Close as CloseIcon, Info as InfoIcon,
  AutoStories as BookIcon, Tag as TagIcon, Groups as GroupsIcon,
  AdminPanelSettings as AdminIcon, School as SchoolIcon,
  ArrowBack as BackIcon, ArrowForward as NextIcon,
  Description as DocIcon, MenuBook as CurriculumIcon,
  LocalLibrary as EditorialIcon, Visibility as ReviewIcon,
} from '@mui/icons-material';
import {
  uploadAsProfessor, uploadAsAdmin, listDisciplines,
  type ContentMetadata, type Discipline, type Content,
} from '../../services/contentService';
import { useAuth } from '../../context/AuthContext';

// Níveis alinhados ao Sistema Nacional de Educação de Moçambique (SNE)
const SNE_LEVELS = [
  { value: 'Primário 1º Ciclo',   label: 'Primário · 1º Ciclo (1ª-2ª)' },
  { value: 'Primário 2º Ciclo',   label: 'Primário · 2º Ciclo (3ª-5ª)' },
  { value: 'Primário 3º Ciclo',   label: 'Primário · 3º Ciclo (6ª-7ª)' },
  { value: 'Secundário 1º Ciclo', label: 'Secundário · 1º Ciclo (8ª-10ª)' },
  { value: 'Secundário 2º Ciclo', label: 'Secundário · 2º Ciclo (11ª-12ª)' },
  { value: 'Universitário',       label: 'Universitário' },
  { value: 'EAD',                 label: 'Ensino à Distância (EAD)' },
];

const STEPS = [
  { label: 'Ficheiro',     icon: <DocIcon /> },
  { label: 'Identificação', icon: <BookIcon /> },
  { label: 'Currículo',     icon: <CurriculumIcon /> },
  { label: 'Editorial',     icon: <EditorialIcon /> },
  { label: 'Distribuição',  icon: <GroupsIcon /> },
  { label: 'Revisão',       icon: <ReviewIcon /> },
];

const MAX_FILE_MB = 50;

const UploadConteudo: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrador' || user?.role === 'ADMIN';

  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [meta, setMeta] = useState<ContentMetadata>({
    title: '', description: '', discipline: '', level: 'Secundário 2º Ciclo',
    year: new Date().getFullYear(), publisher: '',
    targetClassroomIds: [], targetForumIds: [],
  });
  const [tagsInput, setTagsInput] = useState('');
  const [classroomsInput, setClassroomsInput] = useState('');

  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Content | null>(null);

  useEffect(() => {
    listDisciplines().then(setDisciplines).catch(() => undefined);
  }, []);

  // Gera preview da capa (1ª página) usando pdf.js logo após upload
  useEffect(() => {
    if (!file) { setCoverPreview(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const pdfjs: any = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const buf = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: buf }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.6 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setCoverPreview(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        if (!cancelled) setCoverPreview(null);
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  const fileSize = file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '';
  const fileTooBig = !!file && file.size > MAX_FILE_MB * 1024 * 1024;

  // Validação por step
  const stepValid = useMemo(() => {
    switch (activeStep) {
      case 0: return !!file && !fileTooBig;
      case 1: return !!meta.title.trim();
      case 2: return true;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  }, [activeStep, file, fileTooBig, meta.title]);

  const handleNext = () => setActiveStep(s => Math.min(s + 1, STEPS.length - 1));
  const handleBack = () => setActiveStep(s => Math.max(s - 1, 0));

  const handleFileChange = (f: File | null) => {
    setFile(f);
    if (f && !meta.title) {
      // Sugere título a partir do nome do ficheiro
      const guess = f.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim();
      setMeta(m => ({ ...m, title: guess }));
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!file) { setError('Selecciona um ficheiro PDF'); return; }
    if (fileTooBig) { setError(`Ficheiro excede ${MAX_FILE_MB} MB`); return; }
    if (!meta.title) { setError('Título é obrigatório'); return; }

    const payload: ContentMetadata = {
      ...meta,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      targetClassroomIds: classroomsInput
        .split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0),
    };

    setLoading(true);
    try {
      const result = isAdmin
        ? await uploadAsAdmin(file, payload)
        : await uploadAsProfessor(file, payload);
      setSuccess(result);
      // Reset
      setActiveStep(0);
      setFile(null); setCoverPreview(null);
      setTagsInput(''); setClassroomsInput('');
      setMeta({
        title: '', description: '', discipline: '', level: 'Secundário 2º Ciclo',
        year: new Date().getFullYear(), publisher: '',
        targetClassroomIds: [], targetForumIds: [],
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Falha no upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
          {isAdmin
            ? <AdminIcon sx={{ color: '#0A1628', fontSize: 28 }} />
            : <SchoolIcon sx={{ color: '#0A1628', fontSize: 28 }} />}
          <Typography variant="h5" fontWeight={700} color="#0A1628">
            Carregar Conteúdo
          </Typography>
          <Chip
            size="small"
            label={isAdmin ? 'Admin' : 'Professor'}
            sx={{
              bgcolor: isAdmin ? '#1E40AF' : '#00A651',
              color: '#fff', fontWeight: 700, fontSize: '0.7rem',
            }}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          A 1ª página do PDF é usada automaticamente como capa. O sistema extrai páginas, gera thumbnail e regista no log.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && (
        <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          <strong>"{success.title}"</strong> carregado com sucesso — {success.totalPages} páginas extraídas.
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
        {/* ── Coluna principal — Stepper ── */}
        <Box sx={{ flex: 1, width: '100%' }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>

              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {STEPS.map((s) => (
                  <Step key={s.label}>
                    <StepLabel
                      sx={{
                        '& .MuiStepLabel-label': { fontSize: '0.75rem', fontWeight: 600 },
                        '& .MuiStepIcon-root.Mui-active': { color: '#00A651' },
                        '& .MuiStepIcon-root.Mui-completed': { color: '#00A651' },
                      }}
                    >
                      {s.label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* ── PASSO 0 — Ficheiro ── */}
              {activeStep === 0 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>1. Ficheiro PDF</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Carrega o PDF do livro ou manual. A primeira página torna-se a capa do livro automaticamente.
                  </Typography>

                  {!file ? (
                    <Box sx={{
                      p: 5, border: '2px dashed #CBD5E1', borderRadius: 2,
                      textAlign: 'center', bgcolor: '#F8FAFC',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: '#00A651', bgcolor: '#F0FDF4' },
                    }}>
                      <UploadIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
                      <Box>
                        <Button
                          component="label" variant="contained"
                          startIcon={<UploadIcon />}
                          sx={{
                            textTransform: 'none', borderRadius: 2,
                            bgcolor: '#00A651', '&:hover': { bgcolor: '#008C44' },
                          }}
                        >
                          Escolher ficheiro PDF
                          <input
                            type="file" accept="application/pdf" hidden
                            onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
                          />
                        </Button>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                        PDF até {MAX_FILE_MB} MB · Será processado pelo PDFBox
                      </Typography>
                    </Box>
                  ) : (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                      {/* Preview da capa */}
                      <Paper elevation={0} sx={{
                        width: { xs: '100%', sm: 180 }, height: 240,
                        borderRadius: 2, overflow: 'hidden', flexShrink: 0,
                        border: '1px solid #E5E7EB', bgcolor: '#001B33',
                        backgroundImage: coverPreview ? `url(${coverPreview})` : undefined,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        position: 'relative',
                      }}>
                        {!coverPreview && (
                          <Box sx={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '0.75rem', textAlign: 'center', p: 2,
                          }}>
                            A gerar capa…
                          </Box>
                        )}
                        <Chip
                          size="small" label="Capa (1ª página)"
                          sx={{
                            position: 'absolute', bottom: 8, left: 8,
                            bgcolor: 'rgba(0,166,81,0.95)', color: '#fff',
                            fontWeight: 700, fontSize: '0.65rem',
                          }}
                        />
                      </Paper>

                      <Box flex={1}>
                        <Box sx={{
                          p: 2, border: fileTooBig ? '1px solid #DC2626' : '1px solid #00A651',
                          borderRadius: 2, bgcolor: fileTooBig ? '#FEF2F2' : '#F0FDF4',
                          display: 'flex', alignItems: 'center', gap: 2, mb: 1.5,
                        }}>
                          <PdfIcon sx={{ color: '#DC2626', fontSize: 32 }} />
                          <Box flex={1} minWidth={0}>
                            <Typography fontWeight={600} noWrap>{file.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{fileSize}</Typography>
                          </Box>
                          <IconButton size="small" onClick={() => handleFileChange(null)}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        {fileTooBig && (
                          <Alert severity="error" sx={{ mb: 1 }}>
                            Ficheiro excede o limite de {MAX_FILE_MB} MB. Por favor reduz ou comprime o PDF.
                          </Alert>
                        )}
                        <Button
                          component="label" variant="text" size="small"
                          startIcon={<UploadIcon />} sx={{ textTransform: 'none' }}
                        >
                          Substituir ficheiro
                          <input
                            type="file" accept="application/pdf" hidden
                            onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
                          />
                        </Button>
                      </Box>
                    </Stack>
                  )}
                </Box>
              )}

              {/* ── PASSO 1 — Identificação ── */}
              {activeStep === 1 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>2. Identificação</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Dá um título claro e uma descrição breve para que alunos encontrem facilmente.
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Título *" fullWidth value={meta.title} autoFocus
                      onChange={e => setMeta({ ...meta, title: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BookIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label="Descrição" fullWidth multiline rows={4}
                      placeholder="Resumo do conteúdo, capítulos abordados, público-alvo…"
                      value={meta.description ?? ''}
                      onChange={e => setMeta({ ...meta, description: e.target.value })}
                    />
                  </Stack>
                </Box>
              )}

              {/* ── PASSO 2 — Currículo ── */}
              {activeStep === 2 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>3. Currículo (SNE)</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Sistema Nacional de Educação de Moçambique — define disciplina e nível de ensino.
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      select label="Disciplina" fullWidth value={meta.discipline ?? ''}
                      onChange={e => setMeta({ ...meta, discipline: e.target.value })}
                    >
                      <MenuItem value="">— Nenhuma —</MenuItem>
                      {disciplines.map(d => (
                        <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select label="Nível de Ensino" fullWidth value={meta.level ?? ''}
                      onChange={e => setMeta({ ...meta, level: e.target.value })}
                    >
                      {SNE_LEVELS.map(l => (
                        <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                </Box>
              )}

              {/* ── PASSO 3 — Editorial ── */}
              {activeStep === 3 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>4. Editorial</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Ano de publicação e editora responsável (opcional, mas recomendado).
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Ano" type="number" fullWidth value={meta.year ?? ''}
                      onChange={e => setMeta({ ...meta, year: Number(e.target.value) || undefined })}
                    />
                    <TextField
                      label="Editora" fullWidth value={meta.publisher ?? ''}
                      placeholder="ex: INDE, Plural Editores"
                      onChange={e => setMeta({ ...meta, publisher: e.target.value })}
                    />
                  </Stack>
                </Box>
              )}

              {/* ── PASSO 4 — Distribuição ── */}
              {activeStep === 4 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>5. Tags e Distribuição</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Tags melhoram a pesquisa. Turmas-alvo restringem o acesso (vazio = público).
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Tags (separadas por vírgula)" fullWidth value={tagsInput}
                      onChange={e => setTagsInput(e.target.value)}
                      placeholder="algebra, equações, exercicios"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TagIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Ajudam na pesquisa e nas sugestões da IA"
                    />
                    <TextField
                      label="Turmas-alvo (IDs separados por vírgula)" fullWidth value={classroomsInput}
                      onChange={e => setClassroomsInput(e.target.value)}
                      placeholder="1, 2, 3"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <GroupsIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Vazio = visível a todas as turmas (público)"
                    />
                  </Stack>
                </Box>
              )}

              {/* ── PASSO 5 — Revisão ── */}
              {activeStep === 5 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={0.5}>6. Revisão final</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Confere os dados. Ao publicar, o ficheiro é processado e os alunos das turmas-alvo são notificados.
                  </Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    {/* Capa */}
                    <Paper elevation={0} sx={{
                      width: { xs: '100%', sm: 160 }, height: 220,
                      borderRadius: 2, overflow: 'hidden', flexShrink: 0,
                      border: '1px solid #E5E7EB', bgcolor: '#001B33',
                      backgroundImage: coverPreview ? `url(${coverPreview})` : undefined,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                    }} />

                    <Box flex={1}>
                      <ReviewRow label="Título" value={meta.title || '—'} bold />
                      <ReviewRow label="Descrição" value={meta.description || '—'} />
                      <Divider sx={{ my: 1 }} />
                      <ReviewRow label="Disciplina" value={meta.discipline || '—'} />
                      <ReviewRow label="Nível" value={meta.level || '—'} />
                      <Divider sx={{ my: 1 }} />
                      <ReviewRow label="Ano" value={meta.year ? String(meta.year) : '—'} />
                      <ReviewRow label="Editora" value={meta.publisher || '—'} />
                      <Divider sx={{ my: 1 }} />
                      <ReviewRow label="Tags" value={tagsInput || '—'} />
                      <ReviewRow label="Turmas-alvo" value={classroomsInput || 'Todas (público)'} />
                      <Divider sx={{ my: 1 }} />
                      <ReviewRow label="Ficheiro" value={file ? `${file.name} · ${fileSize}` : '—'} />
                    </Box>
                  </Stack>
                </Box>
              )}

              {/* Navegação */}
              <Stack direction="row" justifyContent="space-between" mt={4} pt={2}
                     borderTop="1px solid #E5E7EB">
                <Button
                  onClick={handleBack} disabled={activeStep === 0 || loading}
                  startIcon={<BackIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Voltar
                </Button>

                {activeStep < STEPS.length - 1 ? (
                  <Button
                    variant="contained" onClick={handleNext} disabled={!stepValid}
                    endIcon={<NextIcon />}
                    sx={{
                      textTransform: 'none', bgcolor: '#0A1628',
                      '&:hover': { bgcolor: '#001B33' },
                    }}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button
                    variant="contained" onClick={handleSubmit}
                    disabled={loading || !file || !meta.title || fileTooBig}
                    startIcon={<UploadIcon />}
                    sx={{
                      textTransform: 'none', bgcolor: '#00A651',
                      '&:hover': { bgcolor: '#008C44' },
                      fontWeight: 700,
                    }}
                  >
                    {loading ? 'A publicar…' : 'Publicar Conteúdo'}
                  </Button>
                )}
              </Stack>

              {loading && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}
            </CardContent>
          </Card>
        </Box>

        {/* ── Coluna lateral — info ── */}
        <Box sx={{ width: { xs: '100%', md: 320 } }}>
          <Card sx={{ borderRadius: 3, bgcolor: '#F8FAFC', border: '1px solid #E5E7EB' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <InfoIcon sx={{ color: '#00A651' }} />
                <Typography fontWeight={700}>O que acontece?</Typography>
              </Stack>
              <Stack spacing={1.5}>
                <InfoLine n={1} text="Upload do PDF para o storage seguro" />
                <InfoLine n={2} text="Extracção automática do número de páginas" />
                <InfoLine n={3} text="Geração de thumbnail (1ª página = capa)" />
                <InfoLine n={4} text="Indexação para pesquisa full-text" />
                <InfoLine n={5} text="Notificação aos alunos das turmas-alvo" />
                <InfoLine n={6} text="Log de auditoria registado" />
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mt: 2, bgcolor: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <CardContent>
              <Typography fontWeight={700} color="#9A3412" mb={1}>
                ⚠️ Importante
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Os livros e manuais devem ser fornecidos pela <strong>Direcção Provincial de Educação</strong>.
                Os alunos só conseguem <strong>ler dentro da plataforma</strong> — o download do PDF não é permitido.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
};

const InfoLine: React.FC<{ n: number; text: string }> = ({ n, text }) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start">
    <Box sx={{
      minWidth: 22, height: 22, borderRadius: '50%',
      bgcolor: '#00A651', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
    }}>
      {n}
    </Box>
    <Typography variant="body2" color="text.secondary">{text}</Typography>
  </Stack>
);

const ReviewRow: React.FC<{ label: string; value: string; bold?: boolean }> =
  ({ label, value, bold }) => (
    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ py: 0.75 }}>
      <Typography variant="caption" sx={{ minWidth: 90, color: '#6B7280', fontWeight: 600, mt: 0.3 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={bold ? 700 : 400} sx={{ flex: 1, wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Stack>
  );

export default UploadConteudo;
