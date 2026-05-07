import React, { useState } from 'react';
import {
  Dialog, DialogContent, Box, Typography, TextField, Button,
  CircularProgress, Stack, Alert, Avatar, IconButton, Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCommentIcon from '@mui/icons-material/AddComment';
import { useNavigate } from 'react-router-dom';
import { forumService } from '../../services/forumService';
import MenuItem from '@mui/material/MenuItem';
import type { QuestionType, DisciplinaEnum } from '../../types/forum';

const DISCIPLINAS: DisciplinaEnum[] = [
  'MATEMATICA', 'FISICA', 'QUIMICA', 'BIOLOGIA', 'PORTUGUES',
  'HISTORIA', 'GEOGRAFIA', 'INGLES', 'FILOSOFIA', 'INFORMATICA', 'GERAL'
];

const TYPES: {
  value: QuestionType;
  label: string;
  desc: string;
  color: string;
  lightBg: string;
}[] = [
  {
    value: 'ESPECIALIZADO',
    label: 'Especializado',
    desc: 'Respondido por professores',
    color: '#2563EB',
    lightBg: '#DBEAFE',
  },
  {
    value: 'COLABORATIVO',
    label: 'Colaborativo',
    desc: 'Respondido pela comunidade',
    color: '#16A34A',
    lightBg: '#DCFCE7',
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const NewQuestion: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [disciplina, setDisciplina] = useState<DisciplinaEnum>('GERAL');
  const [questionType, setQuestionType] = useState<QuestionType>('ESPECIALIZADO');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selected = TYPES.find(t => t.value === questionType)!;

  const reset = () => {
    setTitulo('');
    setDescricao('');
    setDisciplina('GERAL');
    setQuestionType('ESPECIALIZADO');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError('');
    if (!titulo.trim() || !descricao.trim()) {
      setError('Título e mensagem são obrigatórios');
      return;
    }
    setSubmitting(true);
    try {
      const q = await forumService.createQuestion({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        disciplina,
        questionType,
      });
      reset();
      onClose();
      navigate(`/app/forum/questions/${q.id}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erro ao criar conversa');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.16)',
        },
      }}
    >
      {/* Dialog header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          py: 2,
          borderBottom: `3px solid ${selected.color}`,
        }}
      >
        <Avatar
          sx={{
            bgcolor: selected.lightBg,
            color: selected.color,
            fontWeight: 700,
            width: 38,
            height: 38,
          }}
        >
          <AddCommentIcon fontSize="small" />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" fontWeight={700} color="#111827">
            Nova Conversa
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Inicia uma nova discussão no fórum
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} sx={{ color: '#9CA3AF' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5 }}>
            {error}
          </Alert>
        )}

        {/* Type selection */}
        <Typography
          variant="caption"
          fontWeight={700}
          color="#9CA3AF"
          sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          Tipo de Fórum
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
          {TYPES.map(type => (
            <Box
              key={type.value}
              onClick={() => setQuestionType(type.value)}
              sx={{
                flex: 1,
                p: 1.5,
                borderRadius: 2.5,
                cursor: 'pointer',
                border:
                  questionType === type.value
                    ? `2px solid ${type.color}`
                    : '2px solid #F3F4F6',
                bgcolor:
                  questionType === type.value ? `${type.color}08` : '#FAFAFA',
                transition: 'all 0.18s',
                '&:hover': { borderColor: type.color, bgcolor: `${type.color}05` },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor:
                      questionType === type.value ? type.color : '#D1D5DB',
                    transition: 'background-color 0.18s',
                  }}
                />
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={questionType === type.value ? type.color : '#374151'}
                >
                  {type.label}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ pl: 2.25 }}>
                {type.desc}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* Title */}
        <Typography
          variant="caption"
          fontWeight={700}
          color="#9CA3AF"
          sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          Título
        </Typography>
        <TextField
          fullWidth
          placeholder="De que se trata a tua pergunta?"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 200 } }}
          helperText={`${titulo.length}/200`}
          sx={{
            mb: 2.5,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&.Mui-focused fieldset': { borderColor: selected.color },
            },
          }}
        />

        {/* Description */}
        <Typography
          variant="caption"
          fontWeight={700}
          color="#9CA3AF"
          sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          Mensagem
        </Typography>
        <Box
          sx={{
            border: '1px solid #E5E7EB',
            borderRadius: 2,
            overflow: 'hidden',
            mb: 2.5,
            '&:focus-within': {
              borderColor: selected.color,
              boxShadow: `0 0 0 2px ${selected.color}18`,
            },
          }}
        >
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Explica a tua dúvida com o máximo detalhe..."
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { border: 'none' },
              },
            }}
          />
        </Box>

        {/* Disciplina Select */}
        <Typography
          variant="caption"
          fontWeight={700}
          color="#9CA3AF"
          sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          Disciplina
        </Typography>
        <TextField
          select
          fullWidth
          value={disciplina}
          onChange={e => setDisciplina(e.target.value as DisciplinaEnum)}
          sx={{
            mb: 2.5,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&.Mui-focused fieldset': { borderColor: selected.color },
            },
          }}
        >
          {DISCIPLINAS.map((disc) => (
            <MenuItem key={disc} value={disc}>
              {disc}
            </MenuItem>
          ))}
        </TextField>

        <Divider sx={{ mt: 2, mb: 2.5 }} />

        {/* Submit */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={submitting || !titulo.trim() || !descricao.trim()}
          sx={{
            bgcolor: selected.color,
            borderRadius: 2.5,
            '&:hover': { filter: 'brightness(0.92)' },
            textTransform: 'none',
            fontWeight: 700,
            py: 1.25,
            boxShadow: `0 4px 14px ${selected.color}35`,
          }}
        >
          {submitting ? (
            <CircularProgress size={22} sx={{ color: '#fff' }} />
          ) : (
            'Iniciar Conversa'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default NewQuestion;
