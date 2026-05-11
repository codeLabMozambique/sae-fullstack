import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ArrowForwardIos as ArrowIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  type Assignment,
  listStudentAssignments
} from '../../services/assignmentService';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';

export default function StudentTasksPage() {
  const navigate = useNavigate();
  const { classrooms, loading: classroomsLoading, error: classroomsError } = useMyClassrooms();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classroomsLoading && classrooms.length > 0) {
      fetchAssignments(classrooms.map(c => c.id));
    } else if (!classroomsLoading && classrooms.length === 0) {
      setLoading(false);
    }
  }, [classroomsLoading, classrooms]);

  const fetchAssignments = async (ids: number[]) => {
    try {
      setLoading(true);
      const data = await listStudentAssignments(ids);
      setAssignments(data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Falha ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  const getClassroomName = (id: number) => {
    return classrooms.find(c => c.id === id)?.name || `Turma ${id}`;
  };

  if (loading || classroomsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#00A651' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header com Gradiente Premium */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #0A1628 0%, #00A651 100%)',
          borderRadius: 4,
          p: 4,
          mb: 4,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 166, 81, 0.2)'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Minhas Tarefas
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Acompanha os teus trabalhos e prazos de entrega.
          </Typography>
        </Box>
        <AssignmentIcon 
          sx={{ 
            position: 'absolute', 
            right: -20, 
            bottom: -20, 
            fontSize: 180, 
            opacity: 0.1,
            transform: 'rotate(-15deg)'
          }} 
        />
      </Box>

      {error || classroomsError ? (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error || classroomsError}</Alert>
      ) : null}

      {classrooms.length === 0 && !classroomsLoading ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, bgcolor: '#f9fafb' }}>
          <SchoolIcon sx={{ fontSize: 48, color: '#9CA3AF', mb: 2 }} />
          <Typography variant="h6" color="textPrimary" gutterBottom>Nenhuma turma encontrada</Typography>
          <Typography color="textSecondary">Não estás associado a nenhuma turma neste momento.</Typography>
        </Paper>
      ) : null}

      {assignments.length === 0 && classrooms.length > 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: '#00A651', opacity: 0.2, mb: 2 }} />
          <Typography variant="h6" color="textSecondary">Tudo em dia! Não tens tarefas pendentes.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {assignments.map(a => {
            const hasSubmitted = !!a.mySubmission;
            const isLate = new Date() > new Date(a.deadline) && !hasSubmitted;
            
            return (
              <Grid item xs={12} md={6} lg={4} key={a.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    border: '1px solid #F3F4F6',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                      borderColor: '#00A651'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box sx={{ 
                        p: 1, 
                        borderRadius: 2, 
                        bgcolor: hasSubmitted ? 'rgba(0,166,81,0.1)' : isLate ? 'rgba(239,68,68,0.1)' : 'rgba(37,99,235,0.1)',
                        display: 'flex',
                        mb: 1
                      }}>
                        <AssignmentIcon sx={{ color: hasSubmitted ? '#00A651' : isLate ? '#EF4444' : '#2563EB' }} />
                      </Box>
                      {hasSubmitted ? (
                        <Chip size="small" label="Entregue" sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 700 }} />
                      ) : isLate ? (
                        <Chip size="small" label="Atrasado" sx={{ bgcolor: '#FEF2F2', color: '#991B1B', fontWeight: 700 }} />
                      ) : (
                        <Chip size="small" label="Pendente" sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 700 }} />
                      )}
                    </Box>

                    <Typography variant="h6" fontWeight={700} color="#111827" gutterBottom sx={{ lineHeight: 1.3 }}>
                      {a.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SchoolIcon sx={{ fontSize: 16 }} /> {getClassroomName(a.classroomId)}
                    </Typography>

                    <Box 
                      sx={{ 
                        p: 2, 
                        borderRadius: 3, 
                        bgcolor: '#F9FAFB', 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1.5
                      }}
                    >
                      <ScheduleIcon sx={{ fontSize: 20, color: isLate ? '#EF4444' : '#6B7280' }} />
                      <Box>
                        <Typography variant="caption" display="block" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.6rem' }}>
                          PRAZO DE ENTREGA
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color={isLate ? '#EF4444' : '#374151'}>
                          {new Date(a.deadline).toLocaleDateString()} às {new Date(a.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate(`/student/assignments/${a.id}`)}
                      endIcon={<ArrowIcon sx={{ fontSize: 14 }} />}
                      sx={{
                        borderRadius: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: hasSubmitted ? '#F3F4F6' : '#0A1628',
                        color: hasSubmitted ? '#374151' : '#fff',
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: hasSubmitted ? '#E5E7EB' : '#00A651',
                          boxShadow: hasSubmitted ? 'none' : '0 10px 20px rgba(0,166,81,0.2)'
                        }
                      }}
                    >
                      {hasSubmitted ? 'Ver Detalhes' : 'Submeter Trabalho'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

