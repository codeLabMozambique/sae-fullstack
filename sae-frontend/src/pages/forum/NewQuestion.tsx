import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button, CircularProgress,
  Chip, Stack, Alert, Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { forumService } from '../../services/forumService';
import type { QuestionType } from '../../types/forum';

const AREAS = ['Matematica', 'Portugues', 'Ciencias', 'Historia', 'Ingles', 'Informatica'];

const QUESTION_TYPES: { value: QuestionType; label: string; desc: string; color: string }[] = [
  { value: 'ESPECIALIZADO', label: 'Fórum Especializado', desc: 'Respondido por professores com especialização na área', color: '#2563EB' },
  { value: 'COLABORATIVO', label: 'Fórum Colaborativo', desc: 'Respondido por outros estudantes e validado por professores', color: '#16A34A' },
];

const NewQuestion: React.FC = () => {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('ESPECIALIZADO');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleSubmit = async () => {
    setError('');
    if (!titulo.trim() || !descricao.trim()) { setError('Título e descrição são obrigatórios'); return; }
    setSubmitting(true);
    try {
      const q = await forumService.createQuestion({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        tags: tags.join(',') || undefined,
        questionType,
      });
      navigate(`/app/forum/questions/${q.id}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao criar pergunta');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedType = QUESTION_TYPES.find(t => t.value === questionType)!;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/app/forum')}
        sx={{ mb: 2, textTransform: 'none', color: '#6B7280' }}>
        Voltar ao Fórum
      </Button>

      <Typography variant="h5" fontWeight={700} color="#0A1628" sx={{ mb: 3 }}>Nova Pergunta</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {/* Forum type selection */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Tipo de Fórum</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          {QUESTION_TYPES.map(type => (
            <Box
              key={type.value}
              onClick={() => setQuestionType(type.value)}
              sx={{
                flex: 1, p: 2, borderRadius: 2, cursor: 'pointer',
                border: questionType === type.value ? `2px solid ${type.color}` : '2px solid #E5E7EB',
                bgcolor: questionType === type.value ? `${type.color}08` : '#fff',
                transition: 'all 0.2s',
              }}
            >
              <Typography fontWeight={700} color={questionType === type.value ? type.color : '#374151'}>
                {type.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">{type.desc}</Typography>
            </Box>
          ))}
        </Stack>

        {/* Title */}
        <TextField fullWidth label="Título da pergunta" value={titulo}
          onChange={e => setTitulo(e.target.value)} sx={{ mb: 2 }}
          inputProps={{ maxLength: 200 }}
          helperText={`${titulo.length}/200`}
        />

        {/* Description */}
        <TextField fullWidth multiline rows={5} label="Descrição detalhada"
          value={descricao} onChange={e => setDescricao(e.target.value)} sx={{ mb: 2 }}
          placeholder="Explica a tua dúvida com o máximo de detalhe possível..."
        />

        {/* Tags */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Tags (opcional)</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField size="small" placeholder="Adicionar tag..."
            value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            sx={{ flex: 1 }}
          />
          <Button variant="outlined" size="small" onClick={addTag}
            sx={{ textTransform: 'none', borderColor: selectedType.color, color: selectedType.color }}>
            Adicionar
          </Button>
        </Box>
        <Box sx={{ mb: 1 }}>
          {AREAS.map(a => (
            <Chip key={a} label={a} size="small" clickable variant="outlined"
              onClick={() => !tags.includes(a.toLowerCase()) && setTags([...tags, a.toLowerCase()])}
              sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
            />
          ))}
        </Box>
        {tags.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {tags.map(t => (
              <Chip key={t} label={t} onDelete={() => removeTag(t)} size="small"
                sx={{ bgcolor: `${selectedType.color}15`, color: selectedType.color, fontWeight: 600 }}
              />
            ))}
          </Stack>
        )}

        <Button fullWidth variant="contained" size="large" onClick={handleSubmit}
          disabled={submitting || !titulo.trim() || !descricao.trim()}
          sx={{ mt: 1, bgcolor: selectedType.color, '&:hover': { filter: 'brightness(0.9)' }, textTransform: 'none', fontWeight: 700 }}>
          {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Publicar Pergunta'}
        </Button>
      </Paper>
    </Box>
  );
};

export default NewQuestion;
