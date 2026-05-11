import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, CircularProgress, Alert, Chip,
  Grid, Card, CardHeader, CardContent, CardActions, IconButton,
  Avatar, Tooltip, Dialog, DialogTitle, DialogContent,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Tabs, Tab, FormControl, InputLabel, Select, MenuItem, TextField,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Assignment as AssignmentIcon,
  Folder as FolderIcon,
  Save as SaveIcon,
  People as PeopleIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import {
  professorService, professorAssignmentService, classroomService,
  classLevelService, subjectService,
  studentService, gradeService,
  type StudentProfileDTO, type GradeDTO,
  type ClassroomDTO, type SubjectDTO,
} from '../../services/academicService';

interface ClassroomInfo {
  id: number;
  name: string;
  classLevelName: string;
  subjectIds: number[];
  students: StudentProfileDTO[];
  color?: string;
}

interface GradeRow extends GradeDTO {
  dirty: boolean;
  saving: boolean;
}

const CURRENT_YEAR = String(new Date().getFullYear());

const CARD_COLORS = [
  '#1E40AF', // Blue
  '#166534', // Green
  '#991B1B', // Red
  '#854D0E', // Yellow/Gold
  '#5B21B6', // Purple
  '#065F46', // Teal
];

const ProfessorClassroomsPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classrooms, setClassrooms] = useState<ClassroomInfo[]>([]);
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);

  // Selection for students modal
  const [selectedClassroomForStudents, setSelectedClassroomForStudents] = useState<ClassroomInfo | null>(null);

  // grades tab state
  const [selectedClassroom, setSelectedClassroom] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [academicYear, setAcademicYear] = useState(CURRENT_YEAR);
  const [gradeRows, setGradeRows] = useState<GradeRow[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);

  useEffect(() => {
    if (!user?.username) return;
    loadData();
  }, [user?.username]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [professors, assignments, allClassrooms, classLevels, allSubjects] = await Promise.all([
        professorService.findAll(),
        professorAssignmentService.findAll(),
        classroomService.findAll(),
        classLevelService.findAll(),
        subjectService.findAll(),
      ]);

      setSubjects(allSubjects);

      const prof = professors.find(p => p.username === user!.username);
      if (!prof) { setLoading(false); return; }

      const myAssignments = assignments.filter(a => a.professorId === prof.id);
      const classroomIds = [...new Set(myAssignments.map(a => a.classroomId))];
      const levelMap: Record<number, string> = {};
      classLevels.forEach(cl => { if (cl.id) levelMap[cl.id] = cl.name; });

      const infos: ClassroomInfo[] = await Promise.all(
        classroomIds.map(async (cid, index) => {
          const cr = allClassrooms.find(c => c.id === cid);
          const levelName = cr ? (levelMap[cr.classLevelId] ?? `Nível ${cr.classLevelId}`) : `Turma ${cid}`;
          const name = cr?.name ?? `Sala ${cid}`;
          const subjectIds = myAssignments.filter(a => a.classroomId === cid).map(a => a.subjectId);
          let students: StudentProfileDTO[] = [];
          try { students = await studentService.findByClassroom(cid); } catch {}
          return { 
            id: cid, 
            name, 
            classLevelName: levelName, 
            subjectIds, 
            students,
            color: CARD_COLORS[index % CARD_COLORS.length]
          };
        })
      );

      setClassrooms(infos);
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadGrades = useCallback(async () => {
    if (!selectedClassroom || !selectedSubject || !academicYear) return;
    setGradesLoading(true);
    try {
      const cr = classrooms.find(c => c.id === selectedClassroom);
      const savedGrades = await gradeService.findByClassroomAndSubject(
        selectedClassroom as number,
        selectedSubject as number,
        academicYear,
      );
      const savedMap: Record<number, GradeDTO> = {};
      savedGrades.forEach(g => { savedMap[g.studentId] = g; });

      const students = cr?.students ?? [];
      const rows: GradeRow[] = students.map(s => {
        const existing = savedMap[s.userId];
        return {
          ...(existing ?? {
            studentId: s.userId,
            classroomId: selectedClassroom as number,
            subjectId: selectedSubject as number,
            academicYear,
          }),
          studentName: s.fullName,
          studentUsername: s.username,
          dirty: false,
          saving: false,
        } as GradeRow;
      });
      setGradeRows(rows);
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar notas');
    } finally {
      setGradesLoading(false);
    }
  }, [selectedClassroom, selectedSubject, academicYear, classrooms]);

  useEffect(() => { loadGrades(); }, [selectedClassroom, selectedSubject, academicYear]);

  const updateRow = (studentId: number, field: keyof GradeDTO, value: string) => {
    setGradeRows(prev => prev.map(r =>
      r.studentId === studentId
        ? { ...r, [field]: value === '' ? null : parseFloat(value), dirty: true }
        : r
    ));
  };

  const saveRow = async (row: GradeRow) => {
    setGradeRows(prev => prev.map(r => r.studentId === row.studentId ? { ...r, saving: true } : r));
    try {
      const saved = await gradeService.save({
        id: row.id,
        studentId: row.studentId,
        classroomId: row.classroomId!,
        subjectId: row.subjectId!,
        academicYear: row.academicYear!,
        nota1: row.nota1, nota2: row.nota2, nota3: row.nota3,
        acp1: row.acp1, acp2: row.acp2,
        miniteste1: row.miniteste1, miniteste2: row.miniteste2,
        exameFinal: row.exameFinal,
      });
      setGradeRows(prev => prev.map(r =>
        r.studentId === row.studentId
          ? { ...r, ...saved, dirty: false, saving: false }
          : r
      ));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Falha ao guardar nota');
      setGradeRows(prev => prev.map(r => r.studentId === row.studentId ? { ...r, saving: false } : r));
    }
  };

  const gradeInput = (row: GradeRow, field: keyof GradeDTO) => (
    <TextField
      size="small"
      type="number"
      value={row[field] ?? ''}
      onChange={e => updateRow(row.studentId, field, e.target.value)}
      inputProps={{ min: 0, max: 20, step: 0.5 }}
      sx={{ width: 64, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
    />
  );

  const mediaColor = (m: number | null | undefined) => {
    if (m == null) return '#6B7280';
    if (m >= 14) return '#00A651';
    if (m >= 10) return '#D97706';
    return '#DC2626';
  };

  const availableSubjects = subjects.filter(s =>
    classrooms.find(c => c.id === selectedClassroom)?.subjectIds.includes(s.id ?? 0) ?? false
  );

  return (
    <Box>
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #0A1628 0%, #00A651 100%)',
          borderRadius: 4,
          p: 4,
          mb: 4,
          color: '#fff',
          boxShadow: '0 10px 30px rgba(0, 166, 81, 0.2)'
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <SchoolIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" fontWeight={800} gutterBottom>Minhas Turmas</Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {loading ? 'A carregar…' : `${classrooms.length} turmas sob tua responsabilidade.`}
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' } }}>
          <Tab label="Visão Geral" />
          <Tab label="Pautas e Notas" />
        </Tabs>
      </Box>

      {/* ── Tab 0: Turmas (Google Classroom Style) ── */}
      {tab === 0 && (
        <Box>
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}><CircularProgress sx={{ color: '#00A651' }} /></Box>
          ) : classrooms.length === 0 ? (
            <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, bgcolor: '#F9FAFB' }}>
              <Typography color="text.secondary">Nenhuma turma atribuída</Typography>
            </Paper>
          ) : (
            <Grid container spacing={4}>
              {classrooms.map(cr => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={cr.id}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' },
                      overflow: 'hidden',
                      border: '1px solid #E5E7EB'
                    }}
                    elevation={0}
                  >
                    <Box sx={{ bgcolor: cr.color || '#1E40AF', p: 2, pb: 6, color: '#fff', position: 'relative' }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, mb: 0.5 }}>{cr.name}</Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>{cr.classLevelName}</Typography>
                        </Box>
                        <IconButton size="small" sx={{ color: '#fff' }}><MoreIcon /></IconButton>
                      </Box>
                      <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.7 }}>
                        {user?.username}
                      </Typography>
                      <Avatar 
                        sx={{ 
                          width: 64, 
                          height: 64, 
                          position: 'absolute', 
                          bottom: -32, 
                          right: 16, 
                          border: '4px solid #fff',
                          bgcolor: cr.color,
                          fontSize: '1.5rem',
                          fontWeight: 700
                        }}
                      >
                        {(user?.username || 'P').charAt(0).toUpperCase()}
                      </Avatar>
                    </Box>
                    <CardContent sx={{ pt: 5, flexGrow: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon sx={{ fontSize: 18 }} /> {cr.students.length} alunos inscritos
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 1, borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end' }}>
                      <Tooltip title="Ver Alunos">
                        <IconButton size="small" onClick={() => setSelectedClassroomForStudents(cr)}><PeopleIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Tarefas">
                        <IconButton size="small" onClick={() => navigate('/professor/assignments')}><AssignmentIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Pasta da Turma">
                        <IconButton size="small"><FolderIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* ── Tab 1: Gestão de Notas ── */}
      {tab === 1 && (
        <Box>
          <Paper sx={{ p: 3, borderRadius: 4, mb: 4, border: '1px solid #F3F4F6' }} elevation={0}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Selecionar Turma</InputLabel>
                  <Select
                    label="Selecionar Turma"
                    value={selectedClassroom}
                    onChange={e => { setSelectedClassroom(e.target.value as number); setSelectedSubject(''); }}
                    sx={{ borderRadius: 2 }}
                  >
                    {classrooms.map(cr => (
                      <MenuItem key={cr.id} value={cr.id}>{cr.name} — {cr.classLevelName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small" disabled={!selectedClassroom}>
                  <InputLabel>Disciplina</InputLabel>
                  <Select
                    label="Disciplina"
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value as number)}
                    sx={{ borderRadius: 2 }}
                  >
                    {availableSubjects.map(s => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Ano Lectivo"
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </Paper>

          {!selectedClassroom || !selectedSubject ? (
            <Box textAlign="center" py={10} bgcolor="#F9FAFB" borderRadius={4}>
              <SchoolIcon sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
              <Typography color="text.secondary">Seleciona uma turma e disciplina para gerir a pauta de notas.</Typography>
            </Box>
          ) : gradesLoading ? (
            <Box display="flex" justifyContent="center" py={10}><CircularProgress sx={{ color: '#00A651' }} /></Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 4, border: '1px solid #F3F4F6', overflow: 'hidden' }} elevation={0}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                  <TableRow>
                    {['#', 'Aluno', 'N1', 'N2', 'N3', 'ACP1', 'ACP2', 'Mini1', 'Mini2', 'Exame', 'Média', ''].map(h => (
                      <TableCell key={h} sx={{ color: '#4B5563', fontWeight: 700, py: 2, fontSize: '0.75rem' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gradeRows.length === 0 ? (
                    <TableRow><TableCell colSpan={12} align="center" sx={{ py: 6 }}>Sem alunos inscritos nesta disciplina.</TableCell></TableRow>
                  ) : (
                    gradeRows.map((row, idx) => (
                      <TableRow key={row.studentId} hover sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                        <TableCell sx={{ color: '#9CA3AF' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#111827', minWidth: 160 }}>
                          {row.studentName || row.studentUsername}
                        </TableCell>
                        <TableCell>{gradeInput(row, 'nota1')}</TableCell>
                        <TableCell>{gradeInput(row, 'nota2')}</TableCell>
                        <TableCell>{gradeInput(row, 'nota3')}</TableCell>
                        <TableCell>{gradeInput(row, 'acp1')}</TableCell>
                        <TableCell>{gradeInput(row, 'acp2')}</TableCell>
                        <TableCell>{gradeInput(row, 'miniteste1')}</TableCell>
                        <TableCell>{gradeInput(row, 'miniteste2')}</TableCell>
                        <TableCell>{gradeInput(row, 'exameFinal')}</TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={800} sx={{ color: mediaColor(row.media) }}>
                            {row.media != null ? row.media.toFixed(1) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            disabled={!row.dirty || row.saving}
                            onClick={() => saveRow(row)}
                            sx={{ color: row.dirty ? '#00A651' : '#D1D5DB' }}
                          >
                            {row.saving ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Modal Lista de Alunos */}
      <Dialog 
        open={Boolean(selectedClassroomForStudents)} 
        onClose={() => setSelectedClassroomForStudents(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, p: 3, pb: 1 }}>
          Alunos da Turma: {selectedClassroomForStudents?.name}
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Nome Completo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Classe</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedClassroomForStudents?.students.map(s => (
                  <TableRow key={s.userId}>
                    <TableCell sx={{ fontWeight: 600 }}>{s.fullName}</TableCell>
                    <TableCell color="text.secondary">{s.username}</TableCell>
                    <TableCell>{s.email || '—'}</TableCell>
                    <TableCell>{s.grade || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProfessorClassroomsPage;
