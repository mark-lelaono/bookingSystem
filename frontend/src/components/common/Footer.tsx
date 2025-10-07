import React from 'react';
import { Box, Typography } from '@mui/material';

interface FooterProps {
  roomsCount: number;
  bookingsCount: number;
}

const Footer: React.FC<FooterProps> = ({ roomsCount, bookingsCount }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box component="footer" sx={{ 
      mt: 'auto',
      pt: 0,
      py: 0, 
      borderTop: '2px solid #E5E7EB', 
    }}>
      <Box
        sx={{
          bgcolor: '#044E36',
          color: '#9CA3AF',
          py: 3,
          px: { xs: 3, md: 6 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        
          <Box 
            component="img" 
            src="/ICPAC_Website_Header_Logo.svg" 
            alt="IGAD Logo" 
            sx={{ height: { xs: 40, sm: 55 } }} 
          />
        </Box>
        
        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
          © {currentYear} ICPAC. All rights reserved.
        </Typography>
        
        <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#6B7280' }}>
          Booking System v1.0
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer;

