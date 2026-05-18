import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  EmojiEvents as GradeIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import FileViewerDialog from '../../components/FileViewerDialog';
import { useNavigate } from 'react-router-dom';
import {
  type Submission,
  listMySubmissions,
  submissionFileUrl
} from '../../services/assignmentService';

export default function StudentSubmissionsPage() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await listMySubmissions();
      setSubmissions(data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Falha ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#00A651' }} />
      </Box>
    );
  }

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
          <HistoryIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" fontWeight={800} gutterBottom>Histórico de Entregas</Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>Acompanha o estado e as notas das tuas submissões.</Typography>
          </Box>
        </Box>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
      ) : null}

      <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #F3F4F6' }} elevation={0}>
        {submissions.length === 0 ? (
          <Box p={8} textAlign="center">
            <AssignmentIcon sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>Ainda não fizeste nenhuma entrega</Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/student/assignments')}
              sx={{ mt: 2, borderRadius: 3, bgcolor: '#0A1628', textTransform: 'none' }}
            >
              Ver Tarefas Pendentes
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Data de Entrega</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Tarefa</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Ficheiro</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Estado</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#4B5563' }}>Nota</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#4B5563' }}>Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <ScheduleIcon sx={{ fontSize: 18, color: '#9CA3AF' }} />
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{new Date(sub.submittedAt).toLocaleDateString()}</Typography>
                          <Typography variant="caption" color="textSecondary">{new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="#111827">Tarefa #{sub.assignmentId}</Typography>
                    </TableCell>
                    <TableCell>
                      {sub.fileOriginalName ? (
                        <Tooltip title={`Ver: ${sub.fileOriginalName}`}>
                          <IconButton
                            size="small"
                            sx={{ color: '#00A651', bgcolor: 'rgba(0,166,81,0.05)' }}
                            onClick={() => setViewer({ url: submissionFileUrl(sub.id), name: sub.fileOriginalName! })}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="textSecondary">Sem anexo</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {sub.state === 'avaliado' ? (
                        <Chip label="Avaliado" size="small" sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 700, fontSize: '0.7rem' }} />
                      ) : (
                        <Chip label="Pendente" size="small" sx={{ bgcolor: '#FFFBEB', color: '#92400E', fontWeight: 700, fontSize: '0.7rem' }} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {sub.grade !== null ? (
                        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                          <GradeIcon sx={{ fontSize: 16, color: '#00A651' }} />
                          <Typography fontWeight={800} color="#111827">{sub.grade}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="#9CA3AF" fontWeight={700}>--</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="text" 
                        onClick={() => navigate(`/student/assignments/${sub.assignmentId}`)}
                        sx={{ textTransform: 'none', fontWeight: 700, color: '#0A1628' }}
                      >
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <FileViewerDialog
        open={!!viewer}
        onClose={() => setViewer(null)}
        url={viewer?.url || ''}
        fileName={viewer?.name}
        title="O teu anexo"
      />
    </Box>
  );
}
