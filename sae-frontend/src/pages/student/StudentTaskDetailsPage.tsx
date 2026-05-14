import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  CircularProgress,
  IconButton,
  TextField,
  Alert,
  Divider,
  Avatar,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as UploadFileIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as GradeIcon,
} from '@mui/icons-material';
import FileViewerDialog from '../../components/FileViewerDialog';
import { useParams, useNavigate } from 'react-router-dom';
import {
  type Assignment,
  getStudentAssignment,
  submitAssignment,
  submissionFileUrl,
  assignmentFileUrl,
} from '../../services/assignmentService';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';

export default function StudentTaskDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { classrooms, loading: classroomsLoading } = useMyClassrooms();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Visualizador inline (anti-download)
  const [viewer, setViewer] = useState<{ url: string; name: string; title: string } | null>(null);

  useEffect(() => {
    if (id && classrooms.length > 0) {
      fetchData(Number(id), classrooms.map(c => c.id));
    } else if (!classroomsLoading && classrooms.length === 0) {
      setError("Não estás associado a nenhuma turma.");
      setLoading(false);
    }
  }, [id, classrooms, classroomsLoading]);

  const fetchData = async (assignmentId: number, classIds: number[]) => {
    try {
      setLoading(true);
      const data = await getStudentAssignment(assignmentId, classIds);
      setAssignment(data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Falha ao carregar detalhes da tarefa');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment) return;

    try {
      setSubmitting(true);
      const classIds = classrooms.map(c => c.id);
      const submission = await submitAssignment(assignment.id, { comment, file, classroomIds: classIds });
      setAssignment({ ...assignment, mySubmission: submission });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Falha ao submeter');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || classroomsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#00A651' }} />
      </Box>
    );
  }
  if (error || !assignment) return <Box p={3}><Alert severity="error" sx={{ borderRadius: 3 }}>{error || 'Tarefa não encontrada'}</Alert></Box>;

  const hasSubmitted = !!assignment.mySubmission;
  const isLate = new Date() > new Date(assignment.deadline) && !hasSubmitted;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={4}>
        <IconButton onClick={() => navigate('/student/assignments')} sx={{ mr: 2, bgcolor: '#F3F4F6', '&:hover': { bgcolor: '#E5E7EB' } }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#111827">Detalhes da Tarefa</Typography>
          <Typography variant="body2" color="textSecondary">Lê as instruções e submete o teu trabalho.</Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Lado Esquerdo: Instruções */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 4, borderRadius: 4, mb: 3, border: '1px solid #F3F4F6' }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Typography variant="h5" fontWeight={700} color="#111827">{assignment.title}</Typography>
              {hasSubmitted ? (
                <Chip label="Entregue" sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 700 }} />
              ) : isLate ? (
                <Chip label="Atrasado" sx={{ bgcolor: '#FEF2F2', color: '#991B1B', fontWeight: 700 }} />
              ) : (
                <Chip label="Pendente" sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 700 }} />
              )}
            </Box>
            
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: '#374151', lineHeight: 1.6, mb: 3 }}>
              {assignment.description || 'Sem descrição detalhada fornecida pelo professor.'}
            </Typography>

            {assignment.fileName && (
              <Box sx={{ mb: 4, p: 2, bgcolor: '#F9FAFB', borderRadius: 3, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                <Box>
                  <Typography variant="caption" display="block" color="textSecondary" fontWeight={700}>FICHEIRO DE APOIO</Typography>
                  <Typography variant="body2" fontWeight={600}>{assignment.fileOriginalName}</Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => setViewer({
                    url: assignmentFileUrl(assignment.id),
                    name: assignment.fileOriginalName || 'material.pdf',
                    title: 'Material de apoio',
                  })}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#0A1628' }}
                >
                  Ver material
                </Button>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={3}>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="textSecondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Professor</Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: '#00A651' }}>{(assignment.createdByName || 'P').charAt(0)}</Avatar>
                  <Typography variant="body2" fontWeight={600}>{assignment.createdByName || assignment.createdBy}</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="textSecondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Prazo</Typography>
                <Typography variant="body2" fontWeight={600} color={isLate ? '#EF4444' : '#111827'} mt={0.5}>
                  {new Date(assignment.deadline).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="caption" color="textSecondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Pontuação</Typography>
                <Typography variant="body2" fontWeight={600} mt={0.5}>{assignment.maxScore} Pontos</Typography>
              </Grid>
            </Grid>
          </Paper>

          {hasSubmitted && (
            <Paper sx={{ p: 4, borderRadius: 4, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <CheckCircleIcon sx={{ color: '#166534', fontSize: 32 }} />
                <Box>
                  <Typography variant="h6" fontWeight={700} color="#166534">Trabalho Entregue</Typography>
                  <Typography variant="body2" color="#166534" sx={{ opacity: 0.8 }}>
                    Entregue em {new Date(assignment.mySubmission!.submittedAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 3 }}>
                    <Typography variant="caption" color="textSecondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>O teu comentário</Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      {assignment.mySubmission!.comment || 'Sem comentário.'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  {assignment.mySubmission!.fileName && (
                    <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 3 }}>
                      <Typography variant="caption" color="textSecondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>Anexo enviado</Typography>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => setViewer({
                          url: submissionFileUrl(assignment.mySubmission!.id),
                          name: assignment.mySubmission!.fileOriginalName || 'anexo',
                          title: 'O teu anexo',
                        })}
                        sx={{ mt: 1, borderRadius: 2, textTransform: 'none', borderColor: '#BBF7D0', color: '#166534' }}
                      >
                        {assignment.mySubmission!.fileOriginalName}
                      </Button>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>
          )}
        </Grid>

        {/* Lado Direito: Submissão ou Nota */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {!hasSubmitted ? (
            <Card sx={{ borderRadius: 4, border: '1px solid #F3F4F6' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Entregar Trabalho</Typography>
                <Typography variant="body2" color="textSecondary" mb={3}>Preenche os campos abaixo para submeter.</Typography>
                
                {isLate && (
                  <Alert severity="warning" sx={{ mb: 3, borderRadius: 2, fontSize: '0.8rem' }}>
                    O prazo expirou. A entrega será marcada como atrasada.
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <TextField
                    label="Comentário"
                    placeholder="Adiciona uma nota ao teu trabalho..."
                    fullWidth
                    multiline
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    component="label"
                    startIcon={<UploadFileIcon />}
                    sx={{ mb: 3, py: 1.5, borderRadius: 3, borderStyle: 'dashed', textTransform: 'none' }}
                  >
                    {file ? file.name : 'Selecionar Ficheiro'}
                    <input
                      type="file"
                      hidden
                      onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    />
                  </Button>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={submitting || (!file && !comment.trim())}
                    sx={{ 
                      borderRadius: 3, 
                      py: 1.5, 
                      textTransform: 'none', 
                      fontWeight: 700,
                      bgcolor: '#0A1628',
                      '&:hover': { bgcolor: '#00A651' }
                    }}
                  >
                    {submitting ? 'A enviar...' : 'Confirmar Entrega'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ borderRadius: 4, border: '1px solid #F3F4F6', bgcolor: '#0A1628', color: '#fff' }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <GradeIcon sx={{ fontSize: 48, color: '#00A651', mb: 2 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>Classificação</Typography>
                
                <Box sx={{ my: 4 }}>
                  {assignment.mySubmission!.grade !== null ? (
                    <Box>
                      <Typography variant="h2" fontWeight={900} color="#00A651">
                        {assignment.mySubmission!.grade}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.6 }}>de {assignment.maxScore} pontos</Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="h4" fontWeight={700} sx={{ opacity: 0.4 }}>Pendente</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.6, mt: 1 }}>O professor ainda não avaliou este trabalho.</Typography>
                    </Box>
                  )}
                </Box>

                <Button 
                  fullWidth 
                  variant="outlined" 
                  sx={{ borderRadius: 3, color: '#fff', borderColor: 'rgba(255,255,255,0.2)', textTransform: 'none' }}
                  onClick={() => navigate('/student/submissions')}
                >
                  Ver Histórico
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

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
