import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Stack, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Button, Chip, Alert, Snackbar,
  Tooltip, Avatar, Divider, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import GradingIcon from '@mui/icons-material/Grading';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAuth } from '../../context/AuthContext';
import {
  professorAssignmentService,
  studentService,
  type ProfessorAssignmentDetailDTO,
  type StudentProfileDTO,
} from '../../services/academicService';
import { gradeService, PERIODS, PERIOD_LABELS, type GradeDTO } from '../../services/gradeService';

interface GradeRow {
  student: StudentProfileDTO;
  score: string;
  saved: boolean;
  dirty: boolean;
}

function scoreColor(score: number | null): string {
  if (score === null || score === undefined) return 'default';
  if (score >= 14) return 'success';
  if (score >= 10) return 'warning';
  return 'error';
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function avatarColor(name: string) {
  const colors = ['#00A651', '#2e7d32', '#e65100', '#6a1b9a', '#b71c1c', '#006064', '#33691e'];
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function ProfessorGradesPage() {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<ProfessorAssignmentDetailDTO[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  const [selectedClassroomId, setSelectedClassroomId] = useState<number | ''>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('T1');

  const [students, setStudents] = useState<StudentProfileDTO[]>([]);
  const [grades, setGrades] = useState<GradeDTO[]>([]);
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!user?.userId) return;
    professorAssignmentService.findByProfessor(user.userId)
      .then(setAssignments)
      .finally(() => setLoadingAssignments(false));
  }, [user?.userId]);

  const classrooms = useMemo(() => {
    const map = new Map<number, { id: number; name: string; levelName: string }>();
    for (const a of assignments) {
      if (!map.has(a.classroomId)) {
        map.set(a.classroomId, { id: a.classroomId, name: a.classroomName, levelName: a.classLevelName });
      }
    }
    return Array.from(map.values());
  }, [assignments]);

  const subjectsForClassroom = useMemo(() => {
    if (!selectedClassroomId) return [];
    const seen = new Set<number>();
    return assignments
      .filter(a => a.classroomId === selectedClassroomId)
      .filter(a => { const ok = !seen.has(a.subjectId); seen.add(a.subjectId); return ok; })
      .map(a => ({ id: a.subjectId, name: a.subjectName }));
  }, [assignments, selectedClassroomId]);

  useEffect(() => {
    setSelectedSubjectId('');
  }, [selectedClassroomId]);

  const loadSheet = useCallback(async () => {
    if (!selectedClassroomId || !selectedSubjectId || !selectedPeriod) return;
    setLoadingSheet(true);
    try {
      const [fetchedStudents, fetchedGrades] = await Promise.all([
        studentService.getByClassroom(selectedClassroomId as number),
        gradeService.getGrades(selectedClassroomId as number, selectedSubjectId as number, selectedPeriod),
      ]);
      setStudents(fetchedStudents);
      setGrades(fetchedGrades);
      const gradeMap = new Map(fetchedGrades.map(g => [g.studentId, g]));
      setRows(fetchedStudents.map(s => {
        const g = gradeMap.get(s.userId);
        return { student: s, score: g?.score != null ? String(g.score) : '', saved: !!g, dirty: false };
      }));
    } finally {
      setLoadingSheet(false);
    }
  }, [selectedClassroomId, selectedSubjectId, selectedPeriod]);

  useEffect(() => {
    if (selectedClassroomId && selectedSubjectId && selectedPeriod) loadSheet();
  }, [loadSheet]);

  const handleScoreChange = (idx: number, value: string) => {
    setRows(prev => prev.map((r, i) =>
      i === idx ? { ...r, score: value, dirty: true } : r
    ));
  };

  const handleSaveAll = async () => {
    const dirtyRows = rows.filter(r => r.dirty);
    if (dirtyRows.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(dirtyRows.map(r => {
        const parsed = r.score === '' ? null : parseFloat(r.score);
        return gradeService.saveGrade({
          studentId: r.student.userId,
          classroomId: selectedClassroomId as number,
          subjectId: selectedSubjectId as number,
          period: selectedPeriod,
          score: parsed,
        });
      }));
      setRows(prev => prev.map(r => r.dirty ? { ...r, dirty: false, saved: true } : r));
      setSnackMsg('Notas guardadas com sucesso!');
      setSnackSeverity('success');
    } catch {
      setSnackMsg('Erro ao guardar notas. Tente novamente.');
      setSnackSeverity('error');
    } finally {
      setSaving(false);
      setSnackOpen(true);
    }
  };

  const dirtyCount = rows.filter(r => r.dirty).length;
  const filledCount = rows.filter(r => r.score !== '').length;

  const selectedClassroom = classrooms.find(c => c.id === selectedClassroomId);
  const selectedSubject = subjectsForClassroom.find(s => s.id === selectedSubjectId);

  if (loadingAssignments) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <GradingIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={700}>Gestão de Notas</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Seleccione a turma, disciplina e período para lançar as notas
      </Typography>

      {/* Filters */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 3, mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Turma</InputLabel>
            <Select
              value={selectedClassroomId}
              label="Turma"
              onChange={e => setSelectedClassroomId(e.target.value as number)}
            >
              {classrooms.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} {c.levelName ? `— ${c.levelName}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }} disabled={!selectedClassroomId}>
            <InputLabel>Disciplina</InputLabel>
            <Select
              value={selectedSubjectId}
              label="Disciplina"
              onChange={e => setSelectedSubjectId(e.target.value as number)}
            >
              {subjectsForClassroom.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            value={selectedPeriod}
            exclusive
            onChange={(_, v) => v && setSelectedPeriod(v)}
            size="small"
          >
            {PERIODS.map(p => (
              <ToggleButton key={p} value={p} sx={{ px: 2.5, fontWeight: 600 }}>
                {PERIOD_LABELS[p]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      {/* Grade sheet */}
      {selectedClassroomId && selectedSubjectId ? (
        loadingSheet ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Header bar */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {selectedClassroom?.name} · {selectedSubject?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {PERIOD_LABELS[selectedPeriod]} · {filledCount}/{students.length} notas lançadas
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                {dirtyCount > 0 && (
                  <Chip
                    icon={<WarningAmberIcon />}
                    label={`${dirtyCount} alteração${dirtyCount !== 1 ? 'ões' : ''} por guardar`}
                    color="warning"
                    size="small"
                  />
                )}
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  disabled={dirtyCount === 0 || saving}
                  onClick={handleSaveAll}
                  sx={{ borderRadius: 2, fontWeight: 600, px: 3 }}
                >
                  Guardar Notas
                </Button>
              </Stack>
            </Stack>

            <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 700, width: 48 }}>#</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Aluno</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700 }}>Nº Aluno</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, width: 140 }} align="center">
                      Nota (0–20)
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 700, width: 100 }} align="center">
                      Estado
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        Nenhum aluno nesta turma.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, idx) => {
                      const numScore = row.score !== '' ? parseFloat(row.score) : null;
                      const valid = numScore === null || (numScore >= 0 && numScore <= 20);
                      return (
                        <TableRow
                          key={row.student.userId}
                          sx={{
                            bgcolor: row.dirty ? 'warning.50' : idx % 2 === 0 ? 'grey.50' : 'white',
                            transition: 'background 0.15s',
                            '&:hover': { bgcolor: 'primary.50' },
                          }}
                        >
                          <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{idx + 1}</TableCell>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Avatar
                                sx={{
                                  width: 34, height: 34, fontSize: 13, fontWeight: 700,
                                  bgcolor: avatarColor(row.student.fullName),
                                }}
                              >
                                {initials(row.student.fullName)}
                              </Avatar>
                              <Typography fontWeight={500}>{row.student.fullName}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{row.student.username}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              value={row.score}
                              onChange={e => handleScoreChange(idx, e.target.value)}
                              type="number"
                              inputProps={{ min: 0, max: 20, step: 0.5 }}
                              size="small"
                              error={!valid}
                              helperText={!valid ? '0–20' : ''}
                              sx={{ width: 100 }}
                              placeholder="—"
                            />
                          </TableCell>
                          <TableCell align="center">
                            {row.dirty ? (
                              <Tooltip title="Não guardado">
                                <WarningAmberIcon color="warning" fontSize="small" />
                              </Tooltip>
                            ) : numScore !== null ? (
                              <Tooltip title={`Nota: ${numScore}`}>
                                <Chip
                                  label={numScore.toFixed(1)}
                                  size="small"
                                  color={scoreColor(numScore) as any}
                                  icon={numScore >= 10 ? <CheckCircleIcon /> : undefined}
                                />
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Legend */}
            <Stack direction="row" spacing={2} mt={2} flexWrap="wrap">
              <Chip label="≥ 14 — Muito Bom" color="success" size="small" />
              <Chip label="10–13 — Suficiente" color="warning" size="small" />
              <Chip label="< 10 — Negativa" color="error" size="small" />
            </Stack>
          </>
        )
      ) : (
        <Box textAlign="center" py={10}>
          <GradingIcon sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary" variant="h6">
            Seleccione uma turma e disciplina para ver a pauta
          </Typography>
        </Box>
      )}

      <Snackbar
        open={snackOpen}
        autoHideDuration={3500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackSeverity} onClose={() => setSnackOpen(false)} sx={{ borderRadius: 2 }}>
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
