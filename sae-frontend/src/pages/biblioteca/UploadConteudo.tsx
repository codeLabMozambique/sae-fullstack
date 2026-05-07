import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, MenuItem,
  Alert, Stack, LinearProgress,
} from '@mui/material';
import { CloudUpload as UploadIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import {
  uploadAsProfessor, uploadAsAdmin, listDisciplines,
  type ContentMetadata, type Discipline, type Content,
} from '../../services/contentService';
import { useAuth } from '../../context/AuthContext';

const UploadConteudo: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrador' || user?.role === 'ADMIN';

  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<ContentMetadata>({
    title: '', description: '', discipline: '', level: 'Secundário',
    year: new Date().getFullYear(), publisher: '',
    targetClassroomIds: [], targetForumIds: [],
  });
  const [tagsInput, setTagsInput] = useState('');
  const [classroomsInput, setClassroomsInput] = useState('');

  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Content | null>(null);

  useEffect(() => {
    listDisciplines().then(setDisciplines).catch(() => undefined);
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!file) { setError('Selecciona um ficheiro PDF'); return; }
    if (!meta.title) { setError('Título é obrigatório'); return; }

    const payload: ContentMetadata = {
      ...meta,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      targetClassroomIds: classroomsInput
        .split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0),
    };

    setLoading(true);
    try {
      const result = isAdmin
        ? await uploadAsAdmin(file, payload)
        : await uploadAsProfessor(file, payload);
      setSuccess(result);
      // reset
      setFile(null); setTagsInput(''); setClassroomsInput('');
      setMeta({ ...meta, title: '', description: '' });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Falha no upload');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={1} color="#0A1628">
        Carregar Conteúdo {isAdmin ? '(Admin)' : '(Professor)'}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Upload de PDF — o sistema extrai automaticamente o número de páginas e gera thumbnail
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && (
        <Alert severity="success" icon={<CheckIcon />} sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          Carregado com sucesso! "{success.title}" — {success.totalPages} páginas
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, maxWidth: 720 }}>
        <CardContent>
          <Stack spacing={2.5}>
            {/* Ficheiro */}
            <Button
              component="label" variant="outlined" startIcon={<UploadIcon />}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
            >
              {file ? file.name : 'Escolher ficheiro PDF'}
              <input
                type="file" accept="application/pdf" hidden
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </Button>

            <TextField
              label="Título *" fullWidth value={meta.title}
              onChange={e => setMeta({ ...meta, title: e.target.value })}
            />
            <TextField
              label="Descrição" fullWidth multiline rows={2}
              value={meta.description ?? ''}
              onChange={e => setMeta({ ...meta, description: e.target.value })}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select label="Disciplina" fullWidth value={meta.discipline ?? ''}
                onChange={e => setMeta({ ...meta, discipline: e.target.value })}
              >
                <MenuItem value="">— Nenhuma —</MenuItem>
                {disciplines.map(d => (
                  <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select label="Nível" fullWidth value={meta.level ?? ''}
                onChange={e => setMeta({ ...meta, level: e.target.value })}
              >
                <MenuItem value="Primário">Primário</MenuItem>
                <MenuItem value="Secundário">Secundário</MenuItem>
                <MenuItem value="Universitário">Universitário</MenuItem>
                <MenuItem value="EAD">EAD</MenuItem>
              </TextField>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Ano" type="number" fullWidth value={meta.year ?? ''}
                onChange={e => setMeta({ ...meta, year: Number(e.target.value) || undefined })}
              />
              <TextField
                label="Editora" fullWidth value={meta.publisher ?? ''}
                onChange={e => setMeta({ ...meta, publisher: e.target.value })}
              />
            </Stack>

            <TextField
              label="Tags (separadas por vírgula)" fullWidth value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="algebra, equações, exercicios"
            />
            <TextField
              label="IDs de turmas (vírgula)" fullWidth value={classroomsInput}
              onChange={e => setClassroomsInput(e.target.value)}
              placeholder="1, 2, 3"
              helperText="Deixa vazio para conteúdo público a todas as turmas"
            />

            {loading && <LinearProgress />}

            <Button
              variant="contained" size="large" fullWidth
              onClick={handleSubmit} disabled={loading}
              startIcon={<UploadIcon />}
              sx={{ bgcolor: '#001B33', textTransform: 'none', '&:hover': { bgcolor: '#002B50' } }}
            >
              {loading ? 'A carregar…' : 'Carregar Conteúdo'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UploadConteudo;
