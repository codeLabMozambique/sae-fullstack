import React from 'react';
import { Box, Typography } from '@mui/material';
import { WifiOff as WifiOffIcon } from '@mui/icons-material';
import { useOffline } from '../hooks/useOffline';

const OfflineIndicator: React.FC = () => {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        bottom: 16, 
        right: 16, 
        bgcolor: '#f44336', 
        color: 'white', 
        px: 2, 
        py: 1, 
        borderRadius: 2, 
        boxShadow: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        zIndex: 2000
      }}
    >
      <WifiOffIcon />
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        Você está offline. Algumas funcionalidades podem estar limitadas.
      </Typography>
    </Box>
  );
};

export default OfflineIndicator;
