import React from 'react';
import { Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import type { ValidationStatus } from '../../types/forum';

interface Props {
  status: ValidationStatus;
  rejectedBy?: string | null;
}

const ValidationBadge: React.FC<Props> = ({ status, rejectedBy }) => {
  if (rejectedBy) {
    return (
      <Chip
        icon={<CancelIcon />}
        label="Rejeitada"
        size="small"
        sx={{ bgcolor: '#F3F4F6', color: '#6B7280', fontWeight: 600 }}
      />
    );
  }
  if (status === 'VALIDADA') {
    return (
      <Chip
        icon={<CheckCircleIcon />}
        label="Validado por Docente"
        size="small"
        sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 600 }}
      />
    );
  }
  return (
    <Chip
      icon={<AccessTimeIcon />}
      label="A aguardar validação"
      size="small"
      sx={{ bgcolor: '#FEF9C3', color: '#A16207', fontWeight: 600 }}
    />
  );
};

export default ValidationBadge;
