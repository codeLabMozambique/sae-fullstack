import React from 'react';
import { Card, CardContent, Box, Typography, Chip } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ValidationBadge from './ValidationBadge';
import type { CollaborativeAnswer } from '../../types/forum';

interface Props {
  answer: CollaborativeAnswer;
}

const CollaborativeAnswerCard: React.FC<Props> = ({ answer }) => (
  <Card sx={{ border: '1px solid #E5E7EB', borderRadius: 2 }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <ValidationBadge status={answer.validationStatus} rejectedBy={answer.rejectedBy} />
        {answer.aiGenerated && (
          <Chip
            icon={<SmartToyIcon sx={{ fontSize: '13px !important', color: '#fff !important' }} />}
            label="Assistente IA"
            size="small"
            sx={{ bgcolor: '#7C3AED', color: '#fff', fontWeight: 700, fontSize: '0.72rem' }}
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
        {answer.validatedBy && (
          <Typography variant="caption" sx={{ color: '#16A34A' }}>
            Validado por {answer.validatedBy}
          </Typography>
        )}
      </Box>
    </CardContent>
  </Card>
);

export default CollaborativeAnswerCard;
