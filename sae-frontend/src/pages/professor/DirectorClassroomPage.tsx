import React, { useEffect, useState } from 'react';
import {
  Box, Typography, CircularProgress, Alert, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, Divider,
} from '@mui/material';
import {
  Star as StarIcon, People as PeopleIcon, MenuBook as SubjectIcon,
  MeetingRoom as ClassroomIcon, WbSunny as MorningIcon,
  WbTwilight as AfternoonIcon, NightsStay as NightIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import {
  classroomService, professorAssignmentService, studentService, professorService,
  type ClassroomDTO, type ProfessorAssignmentDetailDTO, type StudentProfileDTO, type ProfessorDTO,
} from '../../services/academicService';

const ACCENT  = '#f59e0b';
const PRIMARY = '#0A1628';

const glass = {
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.88)',
  boxShadow: '0 8px 32px rgba(31,38,135,0.08)',
} as const;

const shiftIcon: Record<string, React.ReactNode> = {
  'Manhã': <MorningIcon sx={{ fontSize: 16 }} />,
  'Tarde': <AfternoonIcon sx={{ fontSize: 16 }} />,
  'Noite': <NightIcon sx={{ fontSize: 16 }} />,
};

const DirectorClassroomPage: React.FC = () => {
  const { user } = useAuth();

  const [classroom, setClassroom] = useState<ClassroomDTO | null>(null);
  const [disciplines, setDisciplines] = useState<ProfessorAssignmentDetailDTO[]>([]);
  const [students, setStudents] = useState<StudentProfileDTO[]>([]);
  const [professors, setProfessors] = useState<ProfessorDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.userId) return;
    const load = async () => {
      try {
        setLoading(true);
        const cls = await classroomService.findByDirector(user.userId!);
        setClassroom(cls);
        const [disc, studs, profs] = await Promise.all([
          professorAssignmentService.findByClassroom(cls.id!),
          studentService.findByClassroom(cls.id!),
          professorService.findAll(),
        ]);
        setDisciplines(disc);
        setStudents(studs);
        setProfessors(profs);
      } catch {
        setError('Erro ao carregar dados da turma. Verifique se é director de alguma turma.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.userId]);

  const profName = (id: number) => professors.find(p => p.id === id)?.fullName ?? `Prof. #${id}`;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: ACCENT }} />
      </Box>
    );
  }

  if (error || !classroom) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          {error ?? 'Não está designado como director de nenhuma turma.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100%', background: 'linear-gradient(160deg,#fffbeb 0%,#f8fafc 50%,#f0fdf4 100%)', p: 3 }}>

      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg,#0A1628 0%,#d97706 100%)',
        borderRadius: 3, p: 3, mb: 3,
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)', display: 'flex' }}>
          <StarIcon sx={{ color: '#fbbf24', fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h5" color="white" fontWeight={700}>{classroom.name}</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mt: 0.3 }}>
            Director de Turma — visão geral
          </Typography>
        </Box>
      </Box>

      {/* Info cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { icon: <ClassroomIcon />, label: 'Turma', value: classroom.name },
          { icon: shiftIcon[classroom.shift] ?? <ClassroomIcon />, label: 'Turno', value: classroom.shift || '—' },
          { icon: <SubjectIcon />, label: 'Disciplinas', value: String(disciplines.length) },
          { icon: <PeopleIcon />, label: 'Alunos', value: String(students.length) },
        ].map(item => (
          <Card key={item.label} sx={{ ...glass, borderRadius: 3, flex: '1 1 140px', minWidth: 130 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{ color: ACCENT, mb: 0.5 }}>{item.icon}</Box>
              <Typography variant="h5" fontWeight={800} color={PRIMARY}>{item.value}</Typography>
              <Typography variant="caption" color="text.secondary">{item.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Disciplines */}
      <Box sx={{ ...glass, borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SubjectIcon sx={{ color: ACCENT }} />
          <Typography variant="h6" color={PRIMARY} fontWeight={700}>Disciplinas</Typography>
          <Chip label={disciplines.length} size="small"
            sx={{ bgcolor: 'rgba(245,158,11,0.12)', color: '#d97706', border: '1px solid rgba(245,158,11,0.25)', ml: 'auto' }} />
        </Box>
        {disciplines.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <SubjectIcon sx={{ fontSize: 44, color: 'rgba(0,0,0,0.08)', mb: 1 }} />
            <Typography color="text.secondary" variant="body2">Nenhuma disciplina atribuída.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'rgba(0,0,0,0.025)' }}>
                  {['Disciplina', 'Professor'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.7, py: 1.5 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {disciplines.map(d => (
                  <TableRow key={d.id} sx={{ '&:hover': { background: 'rgba(245,158,11,0.03)' } }}>
                    <TableCell>
                      <Chip label={d.subjectName} size="small"
                        sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.25)', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(0,166,81,0.1)', color: '#00A651', fontSize: '0.65rem', fontWeight: 800 }}>
                          {profName(d.professorId).slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" color={PRIMARY}>{profName(d.professorId)}</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Students */}
      <Box sx={{ ...glass, borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PeopleIcon sx={{ color: '#00A651' }} />
          <Typography variant="h6" color={PRIMARY} fontWeight={700}>Alunos Matriculados</Typography>
          <Chip label={students.length} size="small"
            sx={{ bgcolor: 'rgba(0,166,81,0.1)', color: '#00A651', border: '1px solid rgba(0,166,81,0.2)', ml: 'auto' }} />
        </Box>
        {students.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <PeopleIcon sx={{ fontSize: 44, color: 'rgba(0,0,0,0.08)', mb: 1 }} />
            <Typography color="text.secondary" variant="body2">Nenhum aluno matriculado nesta turma.</Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1.5 }}>
            {students.map(s => (
              <Box key={s.userId} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                borderRadius: 2, border: '1px solid rgba(0,0,0,0.07)',
                bgcolor: 'rgba(0,166,81,0.03)',
              }}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(0,166,81,0.12)', color: '#00A651', fontSize: '0.7rem', fontWeight: 800 }}>
                  {(s.fullName ?? s.username).slice(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} color={PRIMARY} noWrap>{s.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.username}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DirectorClassroomPage;
