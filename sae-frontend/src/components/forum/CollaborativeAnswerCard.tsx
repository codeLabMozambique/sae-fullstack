import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
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
