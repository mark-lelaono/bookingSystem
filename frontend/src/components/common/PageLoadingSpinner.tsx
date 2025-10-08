import React from 'react';
import { Box, CircularProgress } from '@mui/material';

interface PageLoadingSpinnerProps {
  open: boolean;
}

const PageLoadingSpinner: React.FC<PageLoadingSpinnerProps> = ({ open }) => {
  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(2px)',
      }}
    >
      <CircularProgress color="success" size={60} />
    </Box>
  );
};

export default PageLoadingSpinner;
