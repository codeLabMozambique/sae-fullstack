import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, CircularProgress, Alert, Chip,
  TextField, Select, MenuItem, FormControl, InputLabel, Button,
  Tooltip, IconButton,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
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
}

interface GradeRow extends GradeDTO {
  dirty: boolean;
  saving: boolean;
}

const CURRENT_YEAR = String(new Date().getFullYear());

const ProfessorClassroomsPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classrooms, setClassrooms] = useState<ClassroomInfo[]>([]);
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);

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
        classroomIds.map(async (cid) => {
          const cr = allClassrooms.find(c => c.id === cid);
          const levelName = cr ? (levelMap[cr.classLevelId] ?? `Nível ${cr.classLevelId}`) : `Turma ${cid}`;
          const name = cr?.name ?? `Sala ${cid}`;
          const subjectIds = myAssignments.filter(a => a.classroomId === cid).map(a => a.subjectId);
          let students: StudentProfileDTO[] = [];
          try { students = await studentService.findByClassroom(cid); } catch {}
          return { id: cid, name, classLevelName: levelName, subjectIds, students };
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
      <Typography variant="h5" fontWeight={700} color="#0A1628" mb={0.5}>
        Minhas Turmas
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        {loading ? 'A carregar…' : `${classrooms.length} turma(s) atribuída(s)`}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Turmas e Alunos" />
          <Tab label="Gestão de Notas" />
        </Tabs>
      </Box>

      {/* ── Tab 0: Turmas e Alunos ── */}
      {tab === 0 && (
        <Box>
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
          ) : classrooms.length === 0 ? (
            <Box textAlign="center" py={8} bgcolor="#fff" borderRadius={3}>
              <Typography color="text.secondary">Nenhuma turma atribuída</Typography>
            </Box>
          ) : (
            classrooms.map(cr => (
              <Box key={cr.id} mb={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Typography variant="h6" fontWeight={700} color="#0A1628">
                    {cr.name} — {cr.classLevelName}
                  </Typography>
                  <Chip
                    label={`${cr.students.length} alunos`}
                    size="small"
                    sx={{ bgcolor: '#DCFCE7', color: '#00A651', fontWeight: 600 }}
                  />
                </Box>
                <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#0A1628' }}>
                        {['#', 'Nome Completo', 'Telefone / Username', 'Email', 'Classe', 'Idade'].map(h => (
                          <TableCell key={h} sx={{ color: 'white', fontWeight: 600, fontSize: '0.8rem', py: 1.5 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cr.students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            Nenhum aluno nesta turma
                          </TableCell>
                        </TableRow>
                      ) : (
                        cr.students.map((s, idx) => (
                          <TableRow key={s.userId} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                            <TableCell sx={{ color: '#6B7280', fontSize: '0.8rem' }}>{idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.fullName}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', color: '#374151' }}>{s.username}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem', color: '#6B7280' }}>{s.email ?? '—'}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>{s.grade ?? '—'}</TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>{s.age ?? '—'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))
          )}
        </Box>
      )}

      {/* ── Tab 1: Gestão de Notas ── */}
      {tab === 1 && (
        <Box>
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Turma</InputLabel>
              <Select
                label="Turma"
                value={selectedClassroom}
                onChange={e => { setSelectedClassroom(e.target.value as number); setSelectedSubject(''); }}
              >
                {classrooms.map(cr => (
                  <MenuItem key={cr.id} value={cr.id}>{cr.name} — {cr.classLevelName}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }} disabled={!selectedClassroom}>
              <InputLabel>Disciplina</InputLabel>
              <Select
                label="Disciplina"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value as number)}
              >
                {availableSubjects.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Ano Lectivo"
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              sx={{ width: 120 }}
            />
          </Box>

          {!selectedClassroom || !selectedSubject ? (
            <Box textAlign="center" py={8} bgcolor="#fff" borderRadius={3}>
              <Typography color="text.secondary">Selecciona turma e disciplina para ver a pauta</Typography>
            </Box>
          ) : gradesLoading ? (
            <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#0A1628' }}>
                    {['#', 'Aluno', 'Nota 1', 'Nota 2', 'Nota 3', 'ACP 1', 'ACP 2', 'Mini 1', 'Mini 2', 'Exame', 'Média', ''].map(h => (
                      <TableCell key={h} sx={{ color: 'white', fontWeight: 600, fontSize: '0.78rem', py: 1.5, whiteSpace: 'nowrap' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gradeRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        Nenhum aluno nesta turma
                      </TableCell>
                    </TableRow>
                  ) : (
                    gradeRows.map((row, idx) => (
                      <TableRow key={row.studentId} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFC' } }}>
                        <TableCell sx={{ color: '#6B7280', fontSize: '0.78rem' }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem', minWidth: 140 }}>
                          {row.studentName || row.studentUsername || row.studentId}
                        </TableCell>
                        <TableCell>{gradeInput(row, 'nota1')}</TableCell>
                        <TableCell>{gradeInput(row, 'nota2')}</TableCell>
                        <TableCell>{gradeInput(row, 'nota3')}</TableCell>
                        <TableCell>{gradeInput(row, 'acp1')}</TableCell>
                        <TableCell>{gradeInput(row, 'acp2')}</TableCell>
                        <TableCell>{gradeInput(row, 'miniteste1')}</TableCell>
                        <TableCell>{gradeInput(row, 'miniteste2')}</TableCell>
                        <TableCell>{gradeInput(row, 'exameFinal')}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ color: mediaColor(row.media), minWidth: 40, textAlign: 'center' }}
                          >
                            {row.media != null ? row.media.toFixed(1) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Guardar">
                            <span>
                              <IconButton
                                size="small"
                                disabled={!row.dirty || row.saving}
                                onClick={() => saveRow(row)}
                                sx={{ color: row.dirty ? '#00A651' : '#D1D5DB' }}
                              >
                                {row.saving ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
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
    </Box>
  );
};

export default ProfessorClassroomsPage;
