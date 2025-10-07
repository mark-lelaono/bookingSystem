import React from 'react';
import { Box, Typography, Card } from '@mui/material';

interface HeaderProps {
  roomsCount: number;
  todayBookingsCount: number;
  availableRoomsCount: number;
}

const Header: React.FC<HeaderProps> = ({
  roomsCount,
  todayBookingsCount,
  availableRoomsCount,
}) => {
  return (
    <Box
      sx={{
        mb: 0,
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 0,
        background: '#044E36',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
        <Box component="img" src="/ICPAC_Website_Header_Logo.svg" alt="ICPAC Logo" sx={{ height: { xs: 40, sm: 55 } }} />
      </Box>
      
      <Box sx={{ textAlign: 'center', flexGrow: 1 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            fontSize: { xs: '1.25rem', sm: '2.125rem' },
            lineHeight: { xs: 1.2, sm: 1.235 }
          }}
        >
          ICPAC INTERNAL BOOKING SYSTEM
        </Typography>
        <Typography
          variant="body2"
          sx={{
            opacity: 0.9,
            display: { xs: 'none', sm: 'block' }
          }}
        >
          Reserve your meeting space with ease - Book conference rooms, manage schedules, and collaborate seamlessly across ICPAC facilities
        </Typography>
      </Box>
      
      <Box sx={{
        display: 'flex',
        gap: { xs: 1, sm: 1.5, md: 2 },
        justifyContent: { xs: 'center', md: 'flex-end' },
        flexWrap: 'wrap'
      }}>
        <Card sx={{
          px: { xs: 1.5, sm: 2, md: 2.5 },
          py: { xs: 1, sm: 1.5 },
          textAlign: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 0,
          minWidth: { xs: '70px', sm: '80px', md: '90px' },
          backdropFilter: 'blur(10px)',
        }}>
          <Typography
            variant="h6"
            fontWeight={700}
            color="#FFFFFF"
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}
          >
            {roomsCount}
          </Typography>
          <Typography 
            variant="caption" 
            color="#FFFFFF"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
          >
            Rooms
          </Typography>
        </Card>
        
        <Card sx={{
          px: { xs: 1.5, sm: 2, md: 2.5 },
          py: { xs: 1, sm: 1.5 },
          textAlign: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 0,
          minWidth: { xs: '70px', sm: '80px', md: '90px' },
          backdropFilter: 'blur(10px)',
        }}>
          <Typography
            variant="h6"
            fontWeight={700}
            color="#FFFFFF"
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}
          >
            {todayBookingsCount}
          </Typography>
          <Typography 
            variant="caption" 
            color="#FFFFFF"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
          >
            Today
          </Typography>
        </Card>
        
        <Card sx={{
          px: { xs: 1.5, sm: 2, md: 2.5 },
          py: { xs: 1, sm: 1.5 },
          textAlign: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 0,
          minWidth: { xs: '70px', sm: '80px', md: '90px' },
          backdropFilter: 'blur(10px)',
        }}>
          <Typography
            variant="h6"
            fontWeight={700}
            color="#FFFFFF"
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}
          >
            {availableRoomsCount}
          </Typography>
          <Typography 
            variant="caption" 
            color="#FFFFFF"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
          >
            Available
          </Typography>
        </Card>
      </Box>
    </Box>
  );
};

export default Header;

