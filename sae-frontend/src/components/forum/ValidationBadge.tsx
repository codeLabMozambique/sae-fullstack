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

const CHIP_SX = {
  height: 20,
  fontSize: '0.62rem',
  fontWeight: 600,
  '& .MuiChip-label': { px: 0.75 },
  '& .MuiChip-icon': { fontSize: '11px !important', ml: 0.5 },
};

const ValidationBadge: React.FC<Props> = ({ status, rejectedBy }) => {
  if (rejectedBy) {
    return (
      <Chip
        icon={<CancelIcon />}
        label="Rejeitada"
        size="small"
        sx={{ ...CHIP_SX, bgcolor: '#F3F4F6', color: '#6B7280' }}
      />
    );
  }
  if (status === 'VALIDADA') {
    return (
      <Chip
        icon={<CheckCircleIcon />}
        label="Validado"
        size="small"
        sx={{ ...CHIP_SX, bgcolor: '#DCFCE7', color: '#15803D' }}
      />
    );
  }
  return (
    <Chip
      icon={<AccessTimeIcon />}
      label="Pendente"
      size="small"
      sx={{ ...CHIP_SX, bgcolor: '#FEF9C3', color: '#A16207' }}
    />
  );
};

export default ValidationBadge;
