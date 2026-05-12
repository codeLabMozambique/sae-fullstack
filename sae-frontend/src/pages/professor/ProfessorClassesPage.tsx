import { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea,
  Drawer, Avatar, Chip, CircularProgress, Divider,
  List, ListItem, ListItemAvatar, ListItemText, IconButton,
  Stack, Tooltip,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useAuth } from '../../context/AuthContext';
import {
  professorAssignmentService,
  studentService,
  type ProfessorAssignmentDetailDTO,
  type StudentProfileDTO,
} from '../../services/academicService';

interface ClassroomGroup {
  classroomId: number;
  classroomName: string;
  classroomShift: string;
  classroomAcademicYear: string;
  classLevelName: string;
  subjects: { id: number; name: string }[];
}

function shiftLabel(shift: string | null) {
  if (!shift) return '';
  const map: Record<string, string> = { MORNING: 'Manhã', AFTERNOON: 'Tarde', EVENING: 'Noite' };
  return map[shift] ?? shift;
}

function avatarColor(name: string) {
  const colors = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c62828', '#00838f', '#558b2f'];
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function ProfessorClassesPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ProfessorAssignmentDetailDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassroomGroup | null>(null);
  const [students, setStudents] = useState<StudentProfileDTO[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    if (!user?.userId) return;
    professorAssignmentService.findByProfessor(user.userId)
      .then(setAssignments)
      .finally(() => setLoading(false));
  }, [user?.userId]);

  const classrooms = useMemo<ClassroomGroup[]>(() => {
    const map = new Map<number, ClassroomGroup>();
    for (const a of assignments) {
      if (!map.has(a.classroomId)) {
        map.set(a.classroomId, {
          classroomId: a.classroomId,
          classroomName: a.classroomName,
          classroomShift: a.classroomShift,
          classroomAcademicYear: a.classroomAcademicYear,
          classLevelName: a.classLevelName,
          subjects: [],
        });
      }
      map.get(a.classroomId)!.subjects.push({ id: a.subjectId, name: a.subjectName });
    }
    return Array.from(map.values());
  }, [assignments]);

  const handleOpenClass = (cls: ClassroomGroup) => {
    setSelectedClass(cls);
    setDrawerOpen(true);
    setStudents([]);
    setStudentsLoading(true);
    studentService.getByClassroom(cls.classroomId)
      .then(setStudents)
      .finally(() => setStudentsLoading(false));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
        <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={700}>Minhas Turmas</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" mb={4}>
        {classrooms.length} turma{classrooms.length !== 1 ? 's' : ''} atribuída{classrooms.length !== 1 ? 's' : ''}
      </Typography>

      {classrooms.length === 0 ? (
        <Box textAlign="center" py={8}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">Nenhuma turma atribuída.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {classrooms.map(cls => (
            <Grid item xs={12} sm={6} md={4} key={cls.classroomId}>
              <Card
                elevation={2}
                sx={{
                  borderRadius: 3,
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 6 },
                }}
              >
                <CardActionArea onClick={() => handleOpenClass(cls)} sx={{ p: 0 }}>
                  <Box
                    sx={{
                      background: 'linear-gradient(135deg, #00A651 0%, #4caf50 100%)',
                      p: 2.5,
                      borderRadius: '12px 12px 0 0',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="h6" fontWeight={700} color="white">
                          {cls.classroomName}
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.85)">
                          {cls.classLevelName}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
                        <GroupIcon sx={{ color: 'white' }} />
                      </Avatar>
                    </Stack>
                  </Box>
                  <CardContent>
                    <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap" useFlexGap>
                      {cls.classroomShift && (
                        <Chip label={shiftLabel(cls.classroomShift)} size="small" variant="outlined" />
                      )}
                      {cls.classroomAcademicYear && (
                        <Chip label={cls.classroomAcademicYear} size="small" variant="outlined" />
                      )}
                    </Stack>
                    <Divider sx={{ mb: 1.5 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                      Disciplinas
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {cls.subjects.map(s => (
                        <Chip
                          key={s.id}
                          label={s.name}
                          size="small"
                          icon={<MenuBookIcon fontSize="small" />}
                          sx={{ bgcolor: 'primary.50', color: 'primary.main', fontWeight: 500 }}
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, borderRadius: { sm: '16px 0 0 16px' } } }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
            <Box>
              <Typography variant="h6" fontWeight={700}>{selectedClass?.classroomName}</Typography>
              <Typography variant="body2" color="text.secondary">{selectedClass?.classLevelName}</Typography>
            </Box>
            <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
          </Stack>
          <Divider sx={{ mb: 2 }} />

          {studentsLoading ? (
            <Box display="flex" justifyContent="center" pt={6}>
              <CircularProgress />
            </Box>
          ) : students.length === 0 ? (
            <Box textAlign="center" pt={6}>
              <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">Nenhum aluno nesta turma.</Typography>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" mb={1}>
                {students.length} aluno{students.length !== 1 ? 's' : ''}
              </Typography>
              <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {students.map((s, i) => (
                  <ListItem key={s.userId} divider={i < students.length - 1} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Tooltip title={s.fullName}>
                        <Avatar sx={{ bgcolor: avatarColor(s.fullName), width: 40, height: 40, fontSize: 14 }}>
                          {initials(s.fullName)}
                        </Avatar>
                      </Tooltip>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography fontWeight={500}>{s.fullName}</Typography>}
                      secondary={s.username}
                    />
                    {s.grade && <Chip label={s.grade} size="small" variant="outlined" />}
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
