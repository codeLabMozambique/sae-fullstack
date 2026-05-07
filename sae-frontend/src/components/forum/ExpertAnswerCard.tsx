import React from 'react';
import { Card, CardContent, Box, Typography, Chip, Button } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { ExpertAnswer } from '../../types/forum';

interface Props {
  answer: ExpertAnswer;
  isQuestionOwner: boolean;
  questionClosed: boolean;
  onAccept?: (answerId: number) => void;
}

const ExpertAnswerCard: React.FC<Props> = ({ answer, isQuestionOwner, questionClosed, onAccept }) => (
  <Card sx={{
    border: answer.accepted ? '2px solid #2563EB' : '1px solid #E5E7EB',
    borderRadius: 2,
    bgcolor: answer.accepted ? '#EFF6FF' : '#fff',
  }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Chip
          icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
          label="Resposta de Especialista"
          size="small"
          sx={{ bgcolor: '#1D4ED8', color: '#fff', fontWeight: 700, fontSize: '0.72rem' }}
        />
        {answer.accepted && (
          <Chip
            icon={<CheckCircleOutlineIcon sx={{ fontSize: '14px !important' }} />}
            label="Aceite"
            size="small"
            sx={{ bgcolor: '#16A34A', color: '#fff', fontWeight: 700 }}
          />
        )}
      </Box>

      <Typography variant="body2" color="#1F2937" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
        {answer.conteudo}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {answer.answeredBy} · {new Date(answer.createdAt).toLocaleDateString('pt-PT')}
        </Typography>
        {isQuestionOwner && !questionClosed && !answer.accepted && (
          <Button
            size="small"
            variant="contained"
            onClick={() => onAccept?.(answer.id)}
            sx={{ bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' }, textTransform: 'none', fontWeight: 700 }}
          >
            Aceitar Resposta
          </Button>
        )}
      </Box>
    </CardContent>
  </Card>
);

export default ExpertAnswerCard;
