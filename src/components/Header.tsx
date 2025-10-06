import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Divider,
} from '@mui/material';
import {
  MeetingRoom as MeetingRoomIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useApp, User } from '../context/AppContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useApp();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const getUserInitials = (user: User | null): string => {
    if (!user) return 'U';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';
  };

  const getUserDisplayName = (user: User | null): string => {
    if (!user) return 'User';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'User';
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ boxShadow: 1 }}>
      <Toolbar variant="dense" sx={{ minHeight: 48 }}>
        {/* Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              bgcolor: 'white',
              color: 'primary.main',
              mr: 1.5,
            }}
          >
            <MeetingRoomIcon sx={{ fontSize: 16 }} />
          </Avatar>
          <Typography variant="h6" component="h1" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
            ICPAC Boardroom Booking
          </Typography>
        </Box>

        {/* User Menu */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            borderRadius: 1,
            px: 1,
            py: 0.5,
          }}
          onClick={handleMenuOpen}
        >
          <Box sx={{ textAlign: 'right', mr: 1.5 }}>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
              {getUserDisplayName(user)}
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              bgcolor: 'primary.light',
              fontSize: '0.75rem',
              fontWeight: 500,
            }}
          >
            {getUserInitials(user)}
          </Avatar>
          <IconButton
            size="small"
            sx={{
              color: 'white',
              ml: 0.5,
              p: 0,
            }}
          >
            <ArrowDropDownIcon />
          </IconButton>
        </Box>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {getUserDisplayName(user)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ fontSize: 18, mr: 1.5 }} />
            <Typography variant="body2">Sign Out</Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
