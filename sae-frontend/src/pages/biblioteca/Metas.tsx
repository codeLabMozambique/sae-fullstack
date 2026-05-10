import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, IconButton,
  CircularProgress, Alert, LinearProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Stack, Chip, Tooltip,
  Tab, Tabs, MenuItem, Divider, Autocomplete, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  EmojiEvents as GoalIcon, Add as AddIcon, Delete as DeleteIcon,
  TrendingUp as ProgressIcon, NotificationsActive as BellOnIcon,
  NotificationsOff as BellOffIcon, MenuBook as BookIcon,
  PauseCircle as PauseIcon, PlayCircle as ResumeIcon,
  RestartAlt as ResetIcon, Edit as EditIcon, Warning as WarnIcon,
  CheckCircle as DoneIcon, AccessTime as TimeIcon, Article as PagesIcon,
} from '@mui/icons-material';
import {
  listGoals, createGoal, updateGoal, addGoalProgress, deleteGoal,
  pauseGoal, resumeGoal, resetGoal,
  setGoalReminder, removeGoalReminder,
  listDisciplines, searchContents, absoluteContentUrl,
  type StudyGoal, type Discipline, type Content,
} from '../../services/contentService';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function computeStats(g: StudyGoal) {
  const isTime = g.goalUnit === 'TIME';
  const target = isTime ? (g.targetMinutes || 0) : (g.targetPages || 0);
  const current = isTime ? (g.currentMinutes || 0) : (g.currentPages || 0);
  const dailyTarget = isTime ? (g.dailyMinutesTarget || 0) : (g.dailyPagesTarget || 0);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const deadline = new Date(g.deadline); deadline.setHours(0, 0, 0, 0);
  const started = g.startedAt ? new Date(g.startedAt) : (() => {
    const d = new Date(g.deadline); d.setMonth(d.getMonth() - 1); return d;
  })();
  started.setHours(0, 0, 0, 0);

  const totalDays = Math.max(1, Math.ceil((deadline.getTime() - started.getTime()) / 86400000));
  const elapsed   = Math.max(1, Math.ceil((today.getTime()    - started.getTime()) / 86400000));
  const remaining = Math.max(0, Math.ceil((deadline.getTime() - today.getTime())   / 86400000));

  const pct      = Math.min(100, target > 0 ? (current / target) * 100 : 0);
  const expected = dailyTarget > 0
    ? dailyTarget * elapsed
    : Math.ceil((target / totalDays) * elapsed);
  const behind   = Math.max(0, Math.min(expected, target) - current);
  const avgDay   = elapsed > 0 ? +(current / elapsed).toFixed(1) : 0;
  const left     = target - current;

  let forecast: Date | null = null;
  if (avgDay > 0 && left > 0) {
    forecast = new Date(today.getTime() + Math.ceil(left / avgDay) * 86400000);
  }

  const onTrack = behind === 0 || current >= target;
  return { pct, behind, avgDay, forecast, remaining, onTrack, left, isTime, target, current };
}

function fmtDate(d: Date | null) {
  if (!d) return '—';
  return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' });
}

const FREQ_OPTS = [
  { value: 'DAILY',           label: 'Diário' },
  { value: 'EVERY_2_DAYS',    label: 'A cada 2 dias' },
  { value: 'WEEKLY',          label: 'Semanal' },
  { value: 'BEFORE_DEADLINE', label: 'Antes do prazo' },
];
const TYPE_OPTS = [
  { value: 'BOOK',       label: 'Livro específico' },
  { value: 'DISCIPLINE', label: 'Por disciplina' },
  { value: 'CATEGORY',   label: 'Por categoria' },
  { value: 'PAGES',      label: 'Quantidade geral' },
];

// ─── component ──────────────────────────────────────────────────────────────

const Metas: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems]       = useState<StudyGoal[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tab, setTab]           = useState(0);

  // create/edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<StudyGoal | null>(null);
  const [fTitle, setFTitle]         = useState('');
  const [fType, setFType]           = useState('PAGES');
  const [fGoalUnit, setFGoalUnit]   = useState<'PAGES' | 'TIME'>('PAGES');
  const [fTarget, setFTarget]       = useState<number>(0);
  const [fDaily, setFDaily]         = useState<number>(0);
  const [fTargetHours, setFTargetHours]   = useState<number>(0);
  const [fTargetMins, setFTargetMins]     = useState<number>(0);
  const [fDailyHours, setFDailyHours]     = useState<number>(0);
  const [fDailyMins, setFDailyMins]       = useState<number>(0);
  const [fDeadline, setFDeadline]   = useState('');
  const [fDiscipline, setFDiscipline] = useState('');
  const [fCategory, setFCategory]   = useState('');
  // book search
  const [fContentId, setFContentId]           = useState('');
  const [fContentTitle, setFContentTitle]     = useState('');
  const [fContentThumb, setFContentThumb]     = useState('');
  const [fBookResults, setFBookResults]       = useState<Content[]>([]);
  const [fBookSearching, setFBookSearching]   = useState(false);
  const [fBookSelected, setFBookSelected]     = useState<Content | null>(null);

  // progress dialog
  const [progressFor, setProgressFor] = useState<StudyGoal | null>(null);
  const [addPages, setAddPages]       = useState<number>(1);
  const [addHours, setAddHours]       = useState<number>(0);
  const [addMins, setAddMins]         = useState<number>(0);

  // reminder dialog
  const [reminderFor, setReminderFor]   = useState<StudyGoal | null>(null);
  const [rEmail, setREmail]             = useState('');
  const [rFreq, setRFreq]               = useState('DAILY');
  const [rDays, setRDays]               = useState<number>(1);
  const [rTime, setRTime]               = useState('08:00');
  const [rError, setRError]             = useState<string | null>(null);

  // ── data ──────────────────────────────────────────────────────
  const load = () => {
    setLoading(true);
    Promise.all([listGoals(), listDisciplines().catch(() => [] as Discipline[])])
      .then(([goals, discs]) => { setItems(goals); setDisciplines(discs); })
      .catch(e => setError(e?.message || 'Falha ao carregar'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (tab === 1) return items.filter(g => g.status === 'ACTIVE');
    if (tab === 2) return items.filter(g => g.status === 'PAUSED');
    if (tab === 3) return items.filter(g => g.status === 'COMPLETED');
    return items;
  }, [items, tab]);

  // ── summary stats ────────────────────────────────────────────
  const totalPagesRead = items.filter(g => g.goalUnit !== 'TIME').reduce((s, g) => s + g.currentPages, 0);
  const totalMinsRead  = items.filter(g => g.goalUnit === 'TIME').reduce((s, g) => s + (g.currentMinutes || 0), 0);
  const onTrackCount = items.filter(g => g.status === 'ACTIVE' && computeStats(g).onTrack).length;
  const lateCount    = items.filter(g => g.status === 'ACTIVE' && !computeStats(g).onTrack).length;

  // ── book search ──────────────────────────────────────────────
  const handleBookSearch = async (q: string) => {
    if (q.length < 2) { setFBookResults([]); return; }
    setFBookSearching(true);
    try {
      const res = await searchContents(q, 0, 8);
      setFBookResults(res.content);
    } catch { setFBookResults([]); }
    finally { setFBookSearching(false); }
  };

  // ── dialogs ──────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setFTitle(''); setFType('PAGES'); setFGoalUnit('PAGES');
    setFTarget(0); setFDaily(0);
    setFTargetHours(0); setFTargetMins(0); setFDailyHours(0); setFDailyMins(0);
    setFDeadline(''); setFDiscipline(''); setFCategory('');
    setFContentId(''); setFContentTitle(''); setFContentThumb('');
    setFBookSelected(null); setFBookResults([]);
    setDialogOpen(true);
  };

  const openEdit = (g: StudyGoal) => {
    setEditing(g);
    setFTitle(g.title); setFType(g.goalType ?? 'PAGES');
    const unit = (g.goalUnit === 'TIME' ? 'TIME' : 'PAGES') as 'PAGES' | 'TIME';
    setFGoalUnit(unit);
    setFTarget(g.targetPages); setFDaily(g.dailyPagesTarget);
    const tH = Math.floor((g.targetMinutes || 0) / 60);
    const tM = (g.targetMinutes || 0) % 60;
    setFTargetHours(tH); setFTargetMins(tM);
    const dH = Math.floor((g.dailyMinutesTarget || 0) / 60);
    const dM = (g.dailyMinutesTarget || 0) % 60;
    setFDailyHours(dH); setFDailyMins(dM);
    setFDeadline(g.deadline);
    setFDiscipline(g.discipline ?? ''); setFCategory(g.category ?? '');
    setFContentId(g.contentId ?? ''); setFContentTitle(g.contentTitle ?? '');
    setFContentThumb(g.contentThumbnail ?? '');
    setFBookSelected(null); setFBookResults([]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const isTime = fGoalUnit === 'TIME';
    const targetMinutes = fTargetHours * 60 + fTargetMins;
    const dailyMinutes  = fDailyHours  * 60 + fDailyMins;
    const targetOk = isTime ? targetMinutes > 0 : fTarget > 0;
    if (!fTitle || !targetOk || !fDeadline) {
      setError(`Preencha título, ${isTime ? 'duração' : 'páginas'} e prazo`); return;
    }
    try {
      const payload: Parameters<typeof createGoal>[0] = {
        title: fTitle,
        goalType: fType,
        goalUnit: fGoalUnit,
        deadline: fDeadline,
        discipline: fDiscipline || undefined,
        category: fCategory || undefined,
      };
      if (isTime) {
        payload.targetMinutes = targetMinutes;
        if (dailyMinutes > 0) payload.dailyMinutesTarget = dailyMinutes;
      } else {
        payload.targetPages = fTarget;
        if (fDaily > 0) payload.dailyPagesTarget = fDaily;
      }
      if (fType === 'BOOK' && fContentId) {
        payload.contentId = fContentId;
        payload.contentTitle = fContentTitle;
        payload.contentThumbnail = fContentThumb || undefined;
      }

      if (editing) {
        const updated = await updateGoal(editing.id, payload as Partial<StudyGoal>);
        setItems(prev => prev.map(g => g.id === updated.id ? updated : g));
      } else {
        await createGoal(payload);
        load();
      }
      setDialogOpen(false);
    } catch (e: any) { setError(e?.message || 'Falha ao guardar'); }
  };

  const handleProgress = async () => {
    if (!progressFor) return;
    const isTime = progressFor.goalUnit === 'TIME';
    const minutes = addHours * 60 + addMins;
    if (isTime && minutes <= 0) return;
    if (!isTime && addPages <= 0) return;
    try {
      await addGoalProgress(progressFor.id, isTime ? 0 : addPages, isTime ? minutes : undefined);
      setProgressFor(null); setAddPages(1); setAddHours(0); setAddMins(0);
      load();
    } catch (e: any) { setError(e?.message || 'Falha'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apagar esta meta?')) return;
    try { await deleteGoal(id); setItems(prev => prev.filter(g => g.id !== id)); }
    catch (e: any) { setError(e?.message || 'Falha'); }
  };

  const handlePause   = async (g: StudyGoal) => {
    const u = await pauseGoal(g.id).catch(() => null);
    if (u) setItems(prev => prev.map(x => x.id === u.id ? u : x));
  };
  const handleResume  = async (g: StudyGoal) => {
    const u = await resumeGoal(g.id).catch(() => null);
    if (u) setItems(prev => prev.map(x => x.id === u.id ? u : x));
  };
  const handleReset   = async (g: StudyGoal) => {
    if (!confirm('Reiniciar progresso para 0?')) return;
    const u = await resetGoal(g.id).catch(() => null);
    if (u) setItems(prev => prev.map(x => x.id === u.id ? u : x));
  };

  const openReminder = (g: StudyGoal) => {
    setReminderFor(g); setRError(null);
    setREmail(g.reminderEmail ?? '');
    setRFreq(g.reminderFrequency ?? 'DAILY');
    setRDays(g.reminderDaysBefore ?? 1);
    setRTime(g.reminderTime ?? '08:00');
  };
  const handleSetReminder = async () => {
    if (!reminderFor) return;
    if (!rEmail || !/\S+@\S+\.\S+/.test(rEmail)) { setRError('Email inválido'); return; }
    try {
      const u = await setGoalReminder(reminderFor.id, {
        email: rEmail, frequency: rFreq, daysBefore: rDays, time: rTime,
      });
      setItems(prev => prev.map(g => g.id === u.id ? u : g));
      setReminderFor(null);
    } catch { setRError('Falha ao guardar lembrete'); }
  };
  const handleRemoveReminder = async (id: string) => {
    const u = await removeGoalReminder(id).catch(() => null);
    if (u) setItems(prev => prev.map(g => g.id === u.id ? u : g));
  };

  const goToBook = (g: StudyGoal) => {
    if (!g.contentId) return;
    const token = localStorage.getItem('sae_token');
    navigate(`${token ? '' : '/biblioteca'}/leitor/${g.contentId}`);
  };

  // ── render ───────────────────────────────────────────────────
  return (
    <Box>
      {/* Título + botão */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0A1628">Metas de Leitura</Typography>
          <Typography variant="body2" color="text.secondary">
            Acompanha o teu ritmo e cumpre os teus objetivos de leitura
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ bgcolor: '#001B33', textTransform: 'none', '&:hover': { bgcolor: '#002B50' }, flexShrink: 0 }}>
          Nova Meta
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Cards de resumo */}
      {!loading && items.length > 0 && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Páginas lidas', value: totalPagesRead, color: '#0A1628' },
            { label: 'Tempo lido', value: totalMinsRead > 0 ? fmtMinutes(totalMinsRead) : '—', color: '#00A651' },
            { label: 'No prazo', value: onTrackCount, color: '#16A34A' },
            { label: 'Atrasadas', value: lateCount, color: lateCount > 0 ? '#DC2626' : '#6B7280' },
          ].map(s => (
            <Grid key={s.label} size={{ xs: 6, sm: 3 }}>
              <Card sx={{ borderRadius: 3, textAlign: 'center', py: 1.5 }}>
                <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}
        TabIndicatorProps={{ style: { backgroundColor: '#001B33' } }}>
        <Tab label={`Todas (${items.length})`} sx={{ textTransform: 'none' }} />
        <Tab label={`Ativas (${items.filter(g => g.status === 'ACTIVE').length})`} sx={{ textTransform: 'none' }} />
        <Tab label={`Em pausa (${items.filter(g => g.status === 'PAUSED').length})`} sx={{ textTransform: 'none' }} />
        <Tab label={`Concluídas (${items.filter(g => g.status === 'COMPLETED').length})`} sx={{ textTransform: 'none' }} />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Box textAlign="center" py={8} bgcolor="#fff" borderRadius={3}>
          <GoalIcon sx={{ fontSize: 56, color: '#E5E7EB', mb: 1 }} />
          <Typography fontWeight={600} color="text.secondary">Sem metas nesta categoria</Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map(g => <GoalCard key={g.id} goal={g}
            onProgress={() => { setProgressFor(g); setAddPages(1); setAddHours(0); setAddMins(0); }}
            onEdit={() => openEdit(g)}
            onPause={() => handlePause(g)}
            onResume={() => handleResume(g)}
            onReset={() => handleReset(g)}
            onDelete={() => handleDelete(g.id)}
            onReminder={() => openReminder(g)}
            onRemoveReminder={() => handleRemoveReminder(g.id)}
            onGoToBook={() => goToBook(g)}
          />)}
        </Grid>
      )}

      {/* ── Dialog criar/editar ──────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>{editing ? 'Editar Meta' : 'Nova Meta de Leitura'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} mt={1}>

            {/* Tipo de meta */}
            <TextField select label="Tipo de meta" fullWidth value={fType}
              onChange={e => { setFType(e.target.value); setFContentId(''); setFContentTitle(''); setFContentThumb(''); setFBookSelected(null); }}>
              {TYPE_OPTS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>

            {/* Pesquisa de livro (só quando BOOK) */}
            {fType === 'BOOK' && (
              <Autocomplete
                options={fBookResults}
                getOptionLabel={(o: Content) => o.title}
                loading={fBookSearching}
                value={fBookSelected}
                onInputChange={(_, v) => handleBookSearch(v)}
                onChange={(_, v) => {
                  setFBookSelected(v);
                  if (v) {
                    setFContentId(v.id);
                    setFContentTitle(v.title);
                    const thumb = absoluteContentUrl(v.thumbnailUrl);
                    setFContentThumb(thumb ?? '');
                    if (!fTitle) setFTitle(`Ler "${v.title}"`);
                    if (v.totalPages && !fTarget) setFTarget(v.totalPages);
                  } else {
                    setFContentId(''); setFContentTitle(''); setFContentThumb('');
                  }
                }}
                noOptionsText={fBookResults.length === 0 ? 'Escreve para pesquisar…' : 'Sem resultados'}
                renderInput={(params) => (
                  <TextField {...params} label="Pesquisar livro" fullWidth
                    InputProps={{ ...params.InputProps, endAdornment: params.InputProps.endAdornment }} />
                )}
              />
            )}

            {fType === 'DISCIPLINE' && (
              <TextField select label="Disciplina" fullWidth value={fDiscipline}
                onChange={e => setFDiscipline(e.target.value)}>
                <MenuItem value="">Qualquer</MenuItem>
                {disciplines.map(d => <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>)}
              </TextField>
            )}
            {fType === 'CATEGORY' && (
              <TextField label="Categoria" fullWidth value={fCategory}
                onChange={e => setFCategory(e.target.value)} />
            )}

            <TextField label="Título da meta" fullWidth value={fTitle}
              onChange={e => setFTitle(e.target.value)} />

            {/* Unidade: páginas ou tempo */}
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                Medir progresso por
              </Typography>
              <ToggleButtonGroup exclusive value={fGoalUnit}
                onChange={(_, v) => { if (v) setFGoalUnit(v); }}
                size="small">
                <ToggleButton value="PAGES" sx={{ textTransform: 'none', px: 2 }}>
                  <PagesIcon sx={{ fontSize: 16, mr: 0.75 }} /> Páginas
                </ToggleButton>
                <ToggleButton value="TIME" sx={{ textTransform: 'none', px: 2 }}>
                  <TimeIcon sx={{ fontSize: 16, mr: 0.75 }} /> Tempo
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {fGoalUnit === 'PAGES' ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Total de páginas" type="number" fullWidth value={fTarget || ''}
                  onChange={e => setFTarget(Number(e.target.value) || 0)}
                  helperText={fBookSelected?.totalPages ? `${fBookSelected.totalPages} pág. no livro` : undefined} />
                <TextField label="Páginas por dia" type="number" fullWidth value={fDaily || ''}
                  onChange={e => setFDaily(Number(e.target.value) || 0)}
                  helperText="Opcional" />
              </Stack>
            ) : (
              <>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Total de tempo a ler
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    <TextField label="Horas" type="number" fullWidth value={fTargetHours || ''}
                      onChange={e => setFTargetHours(Math.max(0, Number(e.target.value) || 0))}
                      inputProps={{ min: 0 }} />
                    <TextField label="Minutos" type="number" fullWidth value={fTargetMins || ''}
                      onChange={e => setFTargetMins(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
                      inputProps={{ min: 0, max: 59 }} />
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Meta diária de leitura (opcional)
                  </Typography>
                  <Stack direction="row" spacing={1.5}>
                    <TextField label="Horas" type="number" fullWidth value={fDailyHours || ''}
                      onChange={e => setFDailyHours(Math.max(0, Number(e.target.value) || 0))}
                      inputProps={{ min: 0 }} />
                    <TextField label="Minutos" type="number" fullWidth value={fDailyMins || ''}
                      onChange={e => setFDailyMins(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
                      inputProps={{ min: 0, max: 59 }} />
                  </Stack>
                </Box>
              </>
            )}

            <TextField label="Data limite" type="date" InputLabelProps={{ shrink: true }} fullWidth
              value={fDeadline} onChange={e => setFDeadline(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}
            sx={{ bgcolor: '#001B33', '&:hover': { bgcolor: '#002B50' }, textTransform: 'none' }}>
            {editing ? 'Guardar' : 'Criar Meta'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog adicionar progresso ────────────────────────── */}
      <Dialog open={progressFor !== null} onClose={() => setProgressFor(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Registar progresso</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>{progressFor?.title}</Typography>
          {progressFor?.goalUnit === 'TIME' ? (
            <>
              <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                Tempo atual: {fmtMinutes(progressFor.currentMinutes || 0)} / {fmtMinutes(progressFor.targetMinutes || 0)}
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <TextField label="Horas lidas" type="number" fullWidth autoFocus value={addHours || ''}
                  onChange={e => setAddHours(Math.max(0, Number(e.target.value) || 0))}
                  inputProps={{ min: 0 }} />
                <TextField label="Minutos lidos" type="number" fullWidth value={addMins || ''}
                  onChange={e => setAddMins(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
                  inputProps={{ min: 0, max: 59 }} />
              </Stack>
            </>
          ) : (
            <>
              {progressFor && (
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Progresso atual: {progressFor.currentPages} / {progressFor.targetPages} páginas
                </Typography>
              )}
              <TextField label="Páginas lidas agora" type="number" fullWidth autoFocus
                value={addPages || ''} onChange={e => setAddPages(Number(e.target.value) || 0)} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setProgressFor(null)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleProgress}
            sx={{ bgcolor: '#001B33', '&:hover': { bgcolor: '#002B50' }, textTransform: 'none' }}>
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog lembrete ──────────────────────────────────── */}
      <Dialog open={reminderFor !== null} onClose={() => setReminderFor(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Lembrete por Email</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Receberás um email de lembrete para continuares: <strong>{reminderFor?.title}</strong>
          </Typography>
          {rError && <Alert severity="error" sx={{ mb: 2 }}>{rError}</Alert>}
          <Stack spacing={2.5}>
            <TextField label="Email" type="email" fullWidth autoFocus value={rEmail}
              onChange={e => setREmail(e.target.value)} />
            <TextField select label="Frequência" fullWidth value={rFreq}
              onChange={e => setRFreq(e.target.value)}>
              {FREQ_OPTS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
            {rFreq === 'BEFORE_DEADLINE' && (
              <TextField label="Dias antes do prazo" type="number" fullWidth value={rDays || ''}
                onChange={e => setRDays(Math.max(1, Number(e.target.value) || 1))} />
            )}
            <TextField label="Hora do envio" type="time" InputLabelProps={{ shrink: true }} fullWidth
              value={rTime} onChange={e => setRTime(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setReminderFor(null)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSetReminder}
            sx={{ bgcolor: '#001B33', '&:hover': { bgcolor: '#002B50' }, textTransform: 'none' }}>
            Guardar Lembrete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ─── GoalCard sub-component ──────────────────────────────────────────────────

interface GoalCardProps {
  goal: StudyGoal;
  onProgress: () => void; onEdit: () => void;
  onPause: () => void;    onResume: () => void;  onReset: () => void;
  onDelete: () => void;   onReminder: () => void; onRemoveReminder: () => void;
  onGoToBook: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal: g, onProgress, onEdit, onPause, onResume, onReset,
  onDelete, onReminder, onRemoveReminder, onGoToBook,
}) => {
  const { pct, behind, avgDay, forecast, remaining, onTrack, isTime, target, current } = computeStats(g);
  const isActive    = g.status === 'ACTIVE';
  const isPaused    = g.status === 'PAUSED';
  const isCompleted = g.status === 'COMPLETED';

  const fmtVal = (v: number) => isTime ? fmtMinutes(Math.round(v)) : `${Math.round(v)} pág.`;
  const dailyTarget = isTime ? (g.dailyMinutesTarget || 0) : (g.dailyPagesTarget || 0);

  return (
    <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
      <Card sx={{
        borderRadius: 3, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column',
        border: !onTrack && isActive ? '1px solid #FCA5A5' : '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0,0,0,.08)',
      }}>

        {/* Thumbnail ou header colorido */}
        {g.contentThumbnail ? (
          <Box sx={{ height: 120, overflow: 'hidden', position: 'relative', bgcolor: '#0A1628' }}>
            <Box component="img" src={g.contentThumbnail} alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
            <Box sx={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(10,22,40,.8) 0%, transparent 60%)',
            }} />
            <Box sx={{ position: 'absolute', bottom: 8, left: 12, right: 12 }}>
              <Typography variant="caption" color="rgba(255,255,255,.7)" noWrap>{g.title}</Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{
            height: 6,
            background: isCompleted ? '#16A34A' : isPaused ? '#9CA3AF' : !onTrack ? '#EF4444' : '#00A651',
          }} />
        )}

        <CardContent sx={{ flex: 1, pb: 1 }}>
          {/* Título + badges */}
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={0.5} gap={1}>
            <Typography fontWeight={700} fontSize={14} lineHeight={1.3}>{g.title}</Typography>
            <Stack direction="row" gap={0.5} flexShrink={0}>
              {isTime && <Chip size="small" icon={<TimeIcon sx={{ fontSize: '12px !important' }} />}
                label="Tempo" sx={{ height: 18, fontSize: 10 }} />}
              {isCompleted && <DoneIcon sx={{ fontSize: 18, color: '#16A34A' }} />}
              {isPaused    && <PauseIcon sx={{ fontSize: 18, color: '#9CA3AF' }} />}
              {isActive && !onTrack && <WarnIcon sx={{ fontSize: 18, color: '#EF4444' }} />}
            </Stack>
          </Stack>

          {/* Livro / disciplina */}
          {g.contentTitle && (
            <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
              <BookIcon sx={{ fontSize: 13, color: '#6B7280' }} />
              <Typography variant="caption" color="primary"
                sx={{ cursor: g.contentId ? 'pointer' : 'default', '&:hover': { textDecoration: g.contentId ? 'underline' : 'none' } }}
                onClick={onGoToBook}>
                {g.contentTitle}
              </Typography>
            </Stack>
          )}
          {g.discipline && (
            <Chip size="small" label={g.discipline}
              sx={{ bgcolor: '#EEF2FF', color: '#4338CA', fontSize: 11, mb: 1, height: 20 }} />
          )}

          {/* Progresso */}
          <Box mt={1.5} mb={1}>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">
                {fmtVal(current)} / {fmtVal(target)}
              </Typography>
              <Typography variant="caption" fontWeight={700}
                color={isCompleted ? '#16A34A' : !onTrack && isActive ? '#EF4444' : '#0A1628'}>
                {pct.toFixed(0)}%
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={pct} sx={{
              height: 7, borderRadius: 4,
              bgcolor: '#F3F4F6',
              '& .MuiLinearProgress-bar': {
                bgcolor: isCompleted ? '#16A34A' : !onTrack && isActive ? '#EF4444' : '#00A651',
              },
            }} />
          </Box>

          {/* Status / alerta */}
          {isActive && !onTrack && behind > 0 && (
            <Alert severity="warning" sx={{ py: 0, px: 1, mb: 1, fontSize: 12 }}>
              {fmtVal(behind)} em atraso
            </Alert>
          )}
          {isCompleted && (
            <Alert severity="success" sx={{ py: 0, px: 1, mb: 1, fontSize: 12 }}>
              Meta concluída!
            </Alert>
          )}

          {/* Mini-estatísticas */}
          <Stack direction="row" flexWrap="wrap" gap={1.5} mt={1}>
            {avgDay > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Média/dia</Typography>
                <Typography variant="caption" fontWeight={700}>{fmtVal(avgDay)}</Typography>
              </Box>
            )}
            {dailyTarget > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Meta diária</Typography>
                <Typography variant="caption" fontWeight={700}>{fmtVal(dailyTarget)}</Typography>
              </Box>
            )}
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Prazo</Typography>
              <Typography variant="caption" fontWeight={700}>
                {remaining > 0 ? `${remaining} dias` : g.deadline}
              </Typography>
            </Box>
            {forecast && isActive && !isCompleted && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Previsão</Typography>
                <Typography variant="caption" fontWeight={700}
                  color={forecast > new Date(g.deadline) ? '#EF4444' : '#16A34A'}>
                  {fmtDate(forecast)}
                </Typography>
              </Box>
            )}
          </Stack>

          {/* Lembrete ativo */}
          {g.reminderEnabled && g.reminderEmail && (
            <Stack direction="row" alignItems="center" gap={0.5} mt={1}>
              <BellOnIcon sx={{ fontSize: 13, color: '#6366F1' }} />
              <Typography variant="caption" color="#6366F1" noWrap>
                {g.reminderEmail} · {FREQ_OPTS.find(f => f.value === g.reminderFrequency)?.label ?? g.reminderFrequency}
              </Typography>
            </Stack>
          )}
        </CardContent>

        {/* Acções */}
        <Divider />
        <Stack direction="row" px={1} py={0.75} gap={0.25} flexWrap="wrap">
          {!isCompleted && (
            <Tooltip title="Registar progresso">
              <IconButton size="small" onClick={onProgress} color="primary">
                <ProgressIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Editar meta">
            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isActive && (
            <Tooltip title="Pausar">
              <IconButton size="small" onClick={onPause}>
                <PauseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {isPaused && (
            <Tooltip title="Retomar">
              <IconButton size="small" color="success" onClick={onResume}>
                <ResumeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Reiniciar progresso">
            <IconButton size="small" onClick={onReset}>
              <ResetIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {g.reminderEnabled ? (
            <Tooltip title="Remover lembrete">
              <IconButton size="small" onClick={onRemoveReminder} sx={{ color: '#6366F1' }}>
                <BellOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Configurar lembrete">
              <IconButton size="small" onClick={onReminder}>
                <BellOnIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Box flex={1} />
          <Tooltip title="Apagar meta">
            <IconButton size="small" color="error" onClick={onDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Card>
    </Grid>
  );
};

export default Metas;
