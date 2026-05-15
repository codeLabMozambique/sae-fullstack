import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  Alert,
  Avatar,
  Card,
  CardContent,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  Grade as GradeIcon,
  Assignment as AssignmentIcon,
  EditCalendar as EditCalendarIcon,
} from '@mui/icons-material';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  type Assignment,
  type Submission,
  getProfessorAssignment,
  listAssignmentSubmissions,
  gradeSubmission,
  updateAssignment,
  submissionFileUrl,
  assignmentFileUrl,
} from '../../services/assignmentService';
import FileViewerDialog from '../../components/FileViewerDialog';

export default function ProfessorTaskDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradingId, setGradingId] = useState<number | null>(null);
  const [gradeInput, setGradeInput] = useState<string>('');

  // Visualizador inline (anti-download)
  const [viewer, setViewer] = useState<{ url: string; name: string; title: string } | null>(null);

  // Editor de prazo (permite reabrir tarefa expirada)
  const [editDeadlineOpen, setEditDeadlineOpen] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState<string>('');
  const [savingDeadline, setSavingDeadline] = useState(false);

  const openEditDeadline = () => {
    if (!assignment) return;
    // Converte ISO → input value "YYYY-MM-DDTHH:mm"
    const d = new Date(assignment.deadline);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setDeadlineInput(local);
    setEditDeadlineOpen(true);
  };

  const saveDeadline = async () => {
    if (!assignment || !deadlineInput) return;
    try {
      setSavingDeadline(true);
      // datetime-local não traz segundos — appendamos ":00" para ficar ISO-like
      const iso = deadlineInput.length === 16 ? `${deadlineInput}:00` : deadlineInput;
      const updated = await updateAssignment(assignment.id, { deadline: iso });
      setAssignment(prev => prev ? { ...prev, deadline: updated.deadline } : prev);
      setEditDeadlineOpen(false);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Falha ao actualizar prazo');
    } finally {
      setSavingDeadline(false);
    }
  };

  useEffect(() => {
    if (id) fetchData(Number(id));
  }, [id]);

  const fetchData = async (assignmentId: number) => {
    try {
      setLoading(true);
      const [assigData, subsData] = await Promise.all([
        getProfessorAssignment(assignmentId),
        listAssignmentSubmissions(assignmentId)
      ]);
      setAssignment(assigData);
      setSubmissions(subsData);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Falha ao carregar detalhes');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGrading = (sub: Submission) => {
    setGradingId(sub.id);
    setGradeInput(sub.grade !== null ? sub.grade.toString() : '');
  };

  const handleSaveGrade = async (sub: Submission) => {
    const gradeVal = parseFloat(gradeInput);
    if (isNaN(gradeVal) || gradeVal < 0 || (assignment && gradeVal > assignment.maxScore)) {
      alert(`Nota inválida. Deve ser entre 0 e ${assignment?.maxScore}`);
      return;
    }

    try {
      const updated = await gradeSubmission(sub.id, gradeVal);
      setSubmissions(submissions.map(s => s.id === sub.id ? updated : s));
      setGradingId(null);
      setAssignment(prev => prev ? { ...prev, gradedCount: (prev.gradedCount || 0) + (sub.state === 'pendente' ? 1 : 0) } : prev);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Falha ao guardar nota');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#1E40AF' }} />
      </Box>
    );
  }
  if (error || !assignment) return <Box p={3}><Alert severity="error" sx={{ borderRadius: 3 }}>{error || 'Tarefa não encontrada'}</Alert></Box>;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={4}>
        <IconButton onClick={() => navigate('/professor/assignments')} sx={{ mr: 2, bgcolor: '#F3F4F6', '&:hover': { bgcolor: '#E5E7EB' } }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#111827">Submissões Recebidas</Typography>
          <Typography variant="body2" color="textSecondary">Avalia e dá feedback aos teus alunos.</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Sumário da Tarefa */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 4, border: '1px solid #F3F4F6', position: 'sticky', top: 20 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="overline" color="textSecondary" fontWeight={700}>DETALHES DA TAREFA</Typography>
              <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mt: 1 }}>{assignment.title}</Typography>
              <Typography variant="body2" color="textSecondary" paragraph>{assignment.description || 'Sem descrição.'}</Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                <ScheduleIcon sx={{ color: '#6B7280' }} />
                <Box flex={1}>
                  <Typography variant="caption" display="block" color="textSecondary" fontWeight={700}>PRAZO FINAL</Typography>
                  <Typography variant="body2" fontWeight={600} color={new Date() > new Date(assignment.deadline) ? '#991B1B' : '#111827'}>
                    {new Date(assignment.deadline).toLocaleString()}
                    {new Date() > new Date(assignment.deadline) && (
                      <Chip label="Expirado" size="small" sx={{ ml: 1, bgcolor: '#FEF2F2', color: '#991B1B', fontWeight: 700, fontSize: '0.65rem' }} />
                    )}
                  </Typography>
                </Box>
                <Tooltip title="Editar / reabrir prazo">
                  <IconButton size="small" onClick={openEditDeadline} sx={{ color: '#1E40AF' }}>
                    <EditCalendarIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                <GradeIcon sx={{ color: '#1E40AF' }} />
                <Box>
                  <Typography variant="caption" display="block" color="textSecondary" fontWeight={700}>PONTUAÇÃO MÁXIMA</Typography>
                  <Typography variant="body2" fontWeight={600}>{assignment.maxScore} Pontos</Typography>
                </Box>
              </Box>

              {assignment.fileName && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" display="block" color="textSecondary" fontWeight={700} sx={{ mb: 1 }}>FICHEIRO DE APOIO</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => setViewer({
                      url: assignmentFileUrl(assignment.id),
                      name: assignment.fileOriginalName || 'material.pdf',
                      title: 'Material de apoio',
                    })}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                  >
                    Ver anexo
                  </Button>
                </Box>
              )}

              <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Progresso</Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="caption" color="textSecondary">{assignment.gradedCount || 0} de {assignment.submissionCount || 0} avaliadas</Typography>
                  <Typography variant="caption" fontWeight={700} color="#1E40AF">
                    {assignment.submissionCount ? Math.round(((assignment.gradedCount || 0) / assignment.submissionCount) * 100) : 0}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={assignment.submissionCount ? ((assignment.gradedCount || 0) / assignment.submissionCount) * 100 : 0} 
                  sx={{ height: 6, borderRadius: 3, bgcolor: '#E5E7EB', '& .MuiLinearProgress-bar': { bgcolor: '#1E40AF' } }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tabela de Submissões */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #F3F4F6' }} elevation={0}>
            {submissions.length === 0 ? (
              <Box p={6} textAlign="center">
                <AssignmentIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                <Typography color="textSecondary">Aguardando as primeiras submissões dos alunos.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Estudante</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Data de Entrega</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Ficheiro</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#4B5563' }}>Estado</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#4B5563' }}>Nota</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {submissions.map((sub) => (
                      <TableRow key={sub.id} sx={{ '&:hover': { bgcolor: '#F9FAFB' } }}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: '#1E40AF' }}>
                              {(sub.studentName || sub.studentUsername).charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700} color="#111827">{sub.studentName || 'Estudante'}</Typography>
                              <Typography variant="caption" color="textSecondary">{sub.studentUsername}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{new Date(sub.submittedAt).toLocaleDateString()}</Typography>
                          <Typography variant="caption" color="textSecondary">{new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                        </TableCell>
                        <TableCell>
                          {sub.fileOriginalName ? (
                            <Tooltip title={`Ver ${sub.fileOriginalName}`}>
                              <IconButton
                                size="small"
                                sx={{ color: '#1E40AF', bgcolor: 'rgba(30,64,175,0.05)' }}
                                onClick={() => setViewer({
                                  url: submissionFileUrl(sub.id),
                                  name: sub.fileOriginalName || 'anexo',
                                  title: `Submissão de ${sub.studentName || sub.studentUsername}`,
                                })}
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
                        <TableCell align="right">
                          {gradingId === sub.id ? (
                            <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                              <TextField
                                size="small"
                                type="number"
                                sx={{ width: 70 }}
                                value={gradeInput}
                                onChange={(e) => setGradeInput(e.target.value)}
                                inputProps={{ step: 0.5, min: 0, max: assignment.maxScore, style: { padding: '8px', fontWeight: 700 } }}
                                autoFocus
                              />
                              <IconButton size="small" sx={{ color: '#00A651' }} onClick={() => handleSaveGrade(sub)}>
                                <CheckIcon />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box display="flex" alignItems="center" justifyContent="flex-end" gap={2}>
                              <Typography fontWeight={800} color={sub.grade !== null ? '#111827' : '#9CA3AF'}>
                                {sub.grade !== null ? sub.grade : '--'}
                              </Typography>
                              <Tooltip title="Atribuir Nota">
                                <IconButton size="small" onClick={() => handleStartGrading(sub)} sx={{ color: '#6B7280' }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Editar / estender prazo da tarefa */}
      <Dialog open={editDeadlineOpen} onClose={() => setEditDeadlineOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Editar prazo da tarefa</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Define um novo prazo. Se o prazo já tinha expirado, a tarefa volta a aceitar entregas.
          </Typography>
          <TextField
            type="datetime-local"
            fullWidth
            value={deadlineInput}
            onChange={(e) => setDeadlineInput(e.target.value)}
            InputLabelProps={{ shrink: true }}
            label="Novo prazo"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDeadlineOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={saveDeadline}
            disabled={savingDeadline || !deadlineInput}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#1E40AF' }}
          >
            {savingDeadline ? 'A guardar…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Visualizador inline — política da plataforma: sem download */}
      <FileViewerDialog
        open={!!viewer}
        onClose={() => setViewer(null)}
        url={viewer?.url || ''}
        fileName={viewer?.name}
        title={viewer?.title}
      />
    </Box>
  );
}

