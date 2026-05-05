import React from 'react';
import { Card, CardActionArea, CardContent, Box, Typography, Chip, Stack } from '@mui/material';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import type { ForumQuestion } from '../../types/forum';

const SPECIALIZED_COLOR = '#2563EB';
const COLLABORATIVE_COLOR = '#16A34A';

interface Props {
  question: ForumQuestion;
}

const QuestionCard: React.FC<Props> = ({ question }) => {
  const navigate = useNavigate();
  const isSpecialized = question.questionType === 'ESPECIALIZADO';
  const accentColor = isSpecialized ? SPECIALIZED_COLOR : COLLABORATIVE_COLOR;
  const tags = question.tags ? question.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <Card
      sx={{
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' },
      }}
    >
      <CardActionArea onClick={() => navigate(`/app/forum/questions/${question.id}`)}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} color="#0A1628" sx={{ flex: 1, mr: 1 }}>
              {question.titulo}
            </Typography>
            {question.status === 'FECHADA' && (
              <LockIcon sx={{ fontSize: 18, color: '#9CA3AF' }} />
            )}
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
            <Chip
              label={isSpecialized ? 'Especializado' : 'Colaborativo'}
              size="small"
              sx={{
                bgcolor: isSpecialized ? '#DBEAFE' : '#DCFCE7',
                color: accentColor,
                fontWeight: 700,
                fontSize: '0.7rem',
              }}
            />
            {question.area && (
              <Chip
                label={question.area}
                size="small"
                sx={{ bgcolor: '#F3F4F6', color: '#374151', fontSize: '0.7rem' }}
              />
            )}
            {tags.slice(0, 3).map(tag => (
              <Chip key={tag} label={tag} size="small"
                sx={{ bgcolor: 'transparent', border: '1px solid #E5E7EB', fontSize: '0.65rem', color: '#6B7280' }} />
            ))}
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6B7280' }}>
              <QuestionAnswerIcon sx={{ fontSize: 15 }} />
              <Typography variant="caption">
                {(question.expertAnswers?.length ?? 0) + (question.collaborativeAnswers?.length ?? 0)} respostas
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {new Date(question.createdAt).toLocaleDateString('pt-PT')}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default QuestionCard;
