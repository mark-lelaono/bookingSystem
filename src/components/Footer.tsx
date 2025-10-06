import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        color: 'white',
        mt: 'auto',
        borderColor: 'grey.700',
        py: 0.5,
        px: 1.5,
      }}
    >
      <Container maxWidth={false} disableGutters>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: 'grey.400' }}>
            © 2025 ICPAC
          </Typography>
          <Typography variant="caption" sx={{ color: 'grey.500' }}>
            v1.0.0
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
