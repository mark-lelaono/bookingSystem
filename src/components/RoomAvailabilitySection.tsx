import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  LinearProgress,
  Chip,
} from '@mui/material';

interface RoomData {
  id: string;
  name: string;
  image: string;
  availability: number;
}

const RoomAvailabilitySection: React.FC = () => {
  // Sample room data - in a real app, this would come from props or API
  const rooms: RoomData[] = [
    {
      id: '1',
      name: 'Conference Room',
      image: '/icpac-meeting-spaces/Conference room.jpg',
      availability: 75,
    },
    {
      id: '2',
      name: 'Main Boardroom',
      image: '/icpac-meeting-spaces/Main Boardroom.jpg',
      availability: 60,
    },
    {
      id: '3',
      name: 'Small Boardroom',
      image: '/icpac-meeting-spaces/small boardroom.jpg',
      availability: 90,
    },
    {
      id: '4',
      name: 'Lab 1',
      image: '/icpac-meeting-spaces/Lab 1.jpg',
      availability: 45,
    },
    {
      id: '5',
      name: 'Lab 2',
      image: '/icpac-meeting-spaces/Lab 2.jpg',
      availability: 80,
    },
    {
      id: '6',
      name: 'Meeting Room',
      image: '/icpac-meeting-spaces/Conference room.jpg',
      availability: 30,
    },
  ];

  const getAvailabilityColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage >= 70) return 'success';
    if (percentage >= 40) return 'warning';
    return 'error';
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 70) return '#4caf50';
    if (percentage >= 40) return '#ff9800';
    return '#f44336';
  };

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, backgroundColor: '#EAFEF8', borderRadius: 2 }}>
      <Typography
        variant="h6"
        component="h2"
        gutterBottom
        align="center"
        sx={{
          mb: 3,
          color: '#044E36',
          fontWeight: 700,
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}
      >
        Room Availability Status
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: { xs: 5, sm: 7 },
          justifyItems: 'center',
          maxWidth: 900,
          mx: 'auto',
        }}
      >
        {rooms.map((room) => (
          <Card
            key={room.id}
            sx={{
              height: { xs: 260, sm: 280 },
              width: '100%',
              maxWidth: { xs: 340, sm: 320 },
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              boxShadow: 3,
              backgroundColor: '#FFFFFF',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            <CardMedia
              component="img"
              height={130}
              image={room.image}
              alt={room.name}
              sx={{
                objectFit: 'cover',
                flexShrink: 0,
                borderRadius: '8px 8px 0 0',
              }}
            />
            <CardContent sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              p: { xs: 1.5, sm: 2 },
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography
                variant="h6"
                component="div"
                gutterBottom
                align="center"
                sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 600,
                  mb: 1.5,
                  minHeight: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#044E36',
                  textAlign: 'center',
                }}
              >
                {room.name}
              </Typography>

              <Box sx={{
                width: '100%',
                mb: 1.5,
                px: { xs: 0, sm: 1 }
              }}>
                <LinearProgress
                  variant="determinate"
                  value={room.availability}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getProgressColor(room.availability),
                      borderRadius: 5,
                    },
                  }}
                />
              </Box>

              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%'
              }}>
                <Chip
                  label={`${room.availability}% Available`}
                  variant="outlined"
                  color={getAvailabilityColor(room.availability)}
                  sx={{
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    height: { xs: 22, sm: 24 },
                    fontWeight: 600,
                    '& .MuiChip-label': {
                      px: { xs: 1, sm: 1.5 },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default RoomAvailabilitySection;
