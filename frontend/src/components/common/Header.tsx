import React, { useState } from 'react';
import { Box, Typography, Card, Avatar, Menu, MenuItem, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  roomsCount: number;
  todayBookingsCount: number;
  availableRoomsCount: number;
}

// Helper function to generate avatar props
const stringAvatar = (name: string) => {
  const nameParts = name.split(' ');
  const firstInitial = nameParts[0]?.[0]?.toUpperCase() || '';
  const lastInitial = nameParts[1]?.[0]?.toUpperCase() || '';

  return {
    sx: {
      bgcolor: '#10B981',
      width: 40,
      height: 40,
      fontSize: '0.875rem',
      fontWeight: 600,
    },
    children: `${firstInitial}${lastInitial}`,
  };
};

const Header: React.FC<HeaderProps> = ({
  roomsCount,
  todayBookingsCount,
  availableRoomsCount,
}) => {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  // Get user's full name for avatar
  const getUserDisplayName = () => {
    if (!user) return 'User';
    return `${user.first_name} ${user.last_name}`.trim() || user.username;
  };

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
        flexWrap: 'wrap',
        alignItems: 'center'
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

        {/* User Avatar with Dropdown */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleAvatarClick}
              sx={{
                p: 0,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <Avatar {...stringAvatar(getUserDisplayName())} />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  borderRadius: 2,
                  minWidth: 120,
                  mt: 1,
                }
              }}
            >
              <MenuItem
                onClick={handleLogout}
                sx={{
                  color: '#DC2626',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  py: 1.5,
                  '&:hover': {
                    bgcolor: '#FEF2F2',
                  }
                }}
              >
                Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Header;
