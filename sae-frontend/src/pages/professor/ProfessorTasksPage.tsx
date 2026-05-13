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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  CloudDownload as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  type Assignment,
  listProfessorAssignments,
  createAssignment,
  type CreateAssignmentPayload,
  deleteAssignment,
  assignmentFileUrl,
} from '../../services/assignmentService';
import { useMyClassrooms } from '../../hooks/useMyClassrooms';

export default function ProfessorTasksPage() {
  const navigate = useNavigate();
  const { classrooms, loading: classroomsLoading, error: classroomsError } = useMyClassrooms();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateAssignmentPayload>>({
    title: '',
    description: '',
    deadline: '',
    maxScore: 20,
    classroomId: undefined,
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await listProfessorAssignments();
      setAssignments(data);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Falha ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => setOpenDialog(true);
  const handleClose = () => {
    setOpenDialog(false);
    setFormData({ title: '', description: '', deadline: '', maxScore: 20, classroomId: undefined });
    setFile(null);
  };

  const handleChange = (field: keyof CreateAssignmentPayload) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.deadline || !formData.maxScore || !formData.classroomId) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      setSubmitting(true);
      await createAssignment({
        ...formData as CreateAssignmentPayload,
        file
      });
      handleClose();
      fetchAssignments();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Falha ao criar tarefa');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tens a certeza que desejas apagar esta tarefa?')) return;
    try {
      await deleteAssignment(id);
      fetchAssignments();
    } catch (e: any) {
      alert('Falha ao apagar tarefa');
    }
  };

  const getClassroomName = (id: number) => {
    return classrooms.find(c => c.id === id)?.name || `Turma ${id}`;
  };

  if (loading || classroomsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: '#1E40AF' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #0A1628 0%, #1E40AF 100%)',
          borderRadius: 4,
          p: 4,
          mb: 4,
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 30px rgba(30, 64, 175, 0.2)'
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>Gestão de Tarefas</Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>Cria e avalia os trabalhos das tuas turmas.</Typography>
        </Box>
        <Button 
          variant="contained" 
          onClick={handleOpen}
          startIcon={<AddIcon />}
          sx={{ 
            bgcolor: '#fff', 
            color: '#1E40AF',
            fontWeight: 700,
            px: 3,
            py: 1.5,
            borderRadius: 3,
            '&:hover': { bgcolor: '#F3F4F6' }
          }}
        >
          Nova Tarefa
        </Button>
      </Box>

      {error || classroomsError ? (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error || classroomsError}</Alert>
      ) : null}

      {assignments.length === 0 ? (
        <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '2px dashed #E5E7EB', bgcolor: 'transparent' }}>
          <AssignmentIcon sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>Nenhuma tarefa criada</Typography>
          <Button variant="text" onClick={handleOpen} sx={{ color: '#1E40AF', fontWeight: 700 }}>
            Clica aqui para criar a primeira
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {assignments.map(a => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={a.id}>
              <Card sx={{ 
                borderRadius: 4, 
                border: '1px solid #F3F4F6',
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Chip 
                      label={getClassroomName(a.classroomId)} 
                      size="small" 
                      sx={{ bgcolor: '#EFF6FF', color: '#1E40AF', fontWeight: 700, borderRadius: 1.5 }} 
                    />
                    <Box>
                      <IconButton size="small" onClick={() => handleDelete(a.id)} sx={{ color: '#DC2626', mr: 0.5 }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small"><MoreIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>

                  <Typography variant="h6" fontWeight={700} gutterBottom>{a.title}</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ 
                    mb: 2, 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden',
                    height: '2.5em'
                  }}>
                    {a.description || 'Sem descrição.'}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <ScheduleIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
                    <Typography variant="caption" color="textSecondary">
                      Expira em: {new Date(a.deadline).toLocaleDateString()}
                    </Typography>
                  </Box>

                  {a.fileName && (
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <FileIcon sx={{ fontSize: 16, color: '#1E40AF' }} />
                      <Typography variant="caption" color="#1E40AF" fontWeight={700} sx={{ cursor: 'pointer' }}>
                        {a.fileOriginalName || 'Ficheiro anexo'}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" fontWeight={800} display="inline">{a.submissionCount || 0}</Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 0.5 }}>entregas</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800} display="inline" color="#00A651">{a.gradedCount || 0}</Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ ml: 0.5 }}>avaliadas</Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={() => navigate(`/professor/assignments/${a.id}`)}
                    sx={{ borderRadius: 2.5, bgcolor: '#0A1628', textTransform: 'none', fontWeight: 700 }}
                  >
                    Gerir Submissões
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal de Criação (Refinado estilo Image 3) */}
      <Dialog 
        open={openDialog} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Criar Nova Tarefa</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="caption" fontWeight={700} color="textSecondary">TÍTULO</Typography>
              <TextField
                placeholder="ex: Trabalho de Pesquisa — Cap. 3"
                fullWidth
                required
                value={formData.title}
                onChange={handleChange('title')}
                sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />
            </Box>

            <Box>
              <Typography variant="caption" fontWeight={700} color="textSecondary">TURMA</Typography>
              <TextField
                select
                fullWidth
                required
                value={formData.classroomId || ''}
                onChange={handleChange('classroomId')}
                sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              >
                {classrooms.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name} ({c.classLevelName})</MenuItem>
                ))}
              </TextField>
            </Box>

            <Box>
              <Typography variant="caption" fontWeight={700} color="textSecondary">DESCRIÇÃO</Typography>
              <TextField
                placeholder="Descrição da tarefa..."
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange('description')}
                sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" fontWeight={700} color="textSecondary">DATA LIMITE</Typography>
                <TextField
                  type="datetime-local"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={formData.deadline}
                  onChange={handleChange('deadline')}
                  sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" fontWeight={700} color="textSecondary">PONTUAÇÃO MÁXIMA</Typography>
                <TextField
                  type="number"
                  fullWidth
                  required
                  value={formData.maxScore}
                  onChange={handleChange('maxScore')}
                  sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                />
              </Grid>
            </Grid>

            <Box>
              <Typography variant="caption" fontWeight={700} color="textSecondary">ANEXAR FICHEIRO (OPCIONAL)</Typography>
              <Button
                fullWidth
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ mt: 1, borderRadius: 2.5, py: 1.5, borderStyle: 'dashed', textTransform: 'none' }}
              >
                {file ? file.name : 'Selecionar Documento/Livro'}
                <input type="file" hidden onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClose} sx={{ color: '#6B7280', textTransform: 'none', fontWeight: 700 }}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting}
            sx={{ borderRadius: 2.5, px: 4, bgcolor: '#1E40AF', textTransform: 'none', fontWeight: 700 }}
          >
            {submitting ? 'Publicando...' : 'Publicar Tarefa'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
