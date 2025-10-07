import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Info as InfoIcon,
} from '@mui/icons-material';

interface RoomData {
  id: string | number;
  name: string;
  image: string;
  availability: number;
  capacity?: number;
  category?: string;
}

interface RoomScheduleProps {
  rooms?: any[];
  onRoomClick?: (room: any) => void;
}

const RoomAvailabilitySection: React.FC<RoomScheduleProps> = ({ rooms: propsRooms, onRoomClick }) => {
  const [hoveredRoom, setHoveredRoom] = useState<string | number | null>(null);

  // Sample room data - use props if available, otherwise use mock data
  const defaultRooms: RoomData[] = [
    {
      id: '1',
      name: 'Conference Room',
      image: '/icpac-meeting-spaces/Conference room.jpg',
      availability: 75,
      capacity: 200,
      category: 'conference',
    },
    {
      id: '2',
      name: 'Main Boardroom',
      image: '/icpac-meeting-spaces/Main Boardroom.jpg',
      availability: 60,
      capacity: 25,
      category: 'conference',
    },
    {
      id: '3',
      name: 'Small Boardroom',
      image: '/icpac-meeting-spaces/small boardroom.jpg',
      availability: 90,
      capacity: 12,
      category: 'conference',
    },
    {
      id: '4',
      name: 'Lab 1',
      image: '/icpac-meeting-spaces/Lab 1.jpg',
      availability: 45,
      capacity: 20,
      category: 'computer_lab',
    },
    {
      id: '5',
      name: 'Lab 2',
      image: '/icpac-meeting-spaces/Lab 2.jpg',
      availability: 80,
      capacity: 20,
      category: 'computer_lab',
    },
    {
      id: '6',
      name: 'Meeting Room',
      image: '/icpac-meeting-spaces/Conference room.jpg',
      availability: 30,
      capacity: 8,
      category: 'meeting',
    },
  ];

  // Map API rooms to include images
  const mapRoomsWithImages = (apiRooms: any[]): RoomData[] => {
    const imageMap: { [key: string]: string } = {
      'Conference Room - Ground Floor': '/icpac-meeting-spaces/Conference room.jpg',
      'Conference Room': '/icpac-meeting-spaces/Conference room.jpg',
      'Boardroom - First Floor': '/icpac-meeting-spaces/Main Boardroom.jpg',
      'Main Boardroom': '/icpac-meeting-spaces/Main Boardroom.jpg',
      'Small Boardroom - 1st Floor': '/icpac-meeting-spaces/small boardroom.jpg',
      'Small Boardroom': '/icpac-meeting-spaces/small boardroom.jpg',
      'Situation Room': '/icpac-meeting-spaces/Conference room.jpg',
      'Computer Lab 1 - Ground Floor': '/icpac-meeting-spaces/Lab 1.jpg',
      'Lab 1': '/icpac-meeting-spaces/Lab 1.jpg',
      'Computer Lab 2 - First Floor': '/icpac-meeting-spaces/Lab 2.jpg',
      'Lab 2': '/icpac-meeting-spaces/Lab 2.jpg',
    };

    return apiRooms.map(room => ({
      ...room,
      image: imageMap[room.name] || '/icpac-meeting-spaces/Conference room.jpg',
    }));
  };

  const rooms = propsRooms && propsRooms.length > 0 ? mapRoomsWithImages(propsRooms) : defaultRooms;

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
    <Box sx={{ 
      flexGrow: 1, 
      p: { xs: 2, sm: 3 }, 
      backgroundColor: '#F8F9FA',
      borderRadius: 0,
      boxShadow: 'none',
      border: 'none',
      borderTop: '1px solid #E5E7EB',
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        mb: 4,
        pb: 3,
        borderBottom: '3px solid #044E36'
      }}>
        <Typography
          variant="h5"
          component="h2"
          align="center"
          sx={{
            color: '#044E36',
            fontWeight: 700,
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            background: 'linear-gradient(135deg, #044E36 0%, #065F46 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          📊 Room Availability Status
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(3, 1fr)',
          },
          columnGap: 0,
          rowGap: { xs: 2, sm: 3, md: 4 },
          justifyItems: 'stretch',
        }}
      >
        {rooms.map((room) => (
          <Card
            key={room.id}
            onClick={() => onRoomClick && onRoomClick(room)}
            onMouseEnter={() => setHoveredRoom(room.id)}
            onMouseLeave={() => setHoveredRoom(null)}
            sx={{
              cursor: onRoomClick ? 'pointer' : 'default',
              height: { xs: 320, sm: 340, md: 360, lg: 380 },
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 0,
              boxShadow: hoveredRoom === room.id ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.12)',
              backgroundColor: '#FFFFFF',
              transition: 'all 0.2s ease',
              borderLeft: hoveredRoom === room.id ? '4px solid #F97316' : '4px solid #E5E7EB',
              borderTop: '1px solid #E5E7EB',
              borderRight: '1px solid #E5E7EB',
              borderBottom: '1px solid #E5E7EB',
              position: 'relative',
              overflow: 'hidden',
              transform: hoveredRoom === room.id ? 'translateX(4px)' : 'translateX(0)',
            }}
          >
            <Box sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                height={180}
                image={room.image}
                alt={room.name}
                sx={{
                  objectFit: 'cover',
                  flexShrink: 0,
                  borderRadius: 0,
                  filter: hoveredRoom === room.id ? 'brightness(1.05)' : 'brightness(1)',
                  transition: 'all 0.2s ease',
                }}
              />
              <Box sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                display: 'flex',
                gap: 1,
              }}>
                <Chip
                  label={room.availability >= 70 ? '✓ Available' : room.availability >= 40 ? '⚠ Limited' : '✕ Busy'}
                  size="small"
                  sx={{
                    bgcolor: room.availability >= 70 ? '#10B981' : room.availability >= 40 ? '#F59E0B' : '#EF4444',
                    color: 'white',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                />
              </Box>
            </Box>
            
            <CardContent sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              p: { xs: 2, sm: 2.5 },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    fontWeight: 700,
                    color: '#044E36',
                    flex: 1,
                  }}
                >
                  {room.name}
                </Typography>
                <Tooltip title="Room Information" arrow>
                  <IconButton size="small" sx={{ color: '#6B7280' }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {room.capacity && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  👥 Capacity: <strong>{room.capacity} people</strong>
                </Typography>
              )}

              <Box sx={{
                width: '100%',
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Availability
                  </Typography>
                  <Typography variant="caption" color={getProgressColor(room.availability)} fontWeight={700}>
                    {room.availability}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={room.availability}
                  sx={{
                    height: 8,
                    borderRadius: 0,
                    backgroundColor: '#E5E7EB',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getProgressColor(room.availability),
                      borderRadius: 0,
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
