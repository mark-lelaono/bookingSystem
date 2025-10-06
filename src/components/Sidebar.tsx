import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Badge,
  Paper,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  MeetingRoom as MeetingRoomIcon,
  BookOnline as BookOnlineIcon,
  CalendarMonth as CalendarMonthIcon,
  ManageAccounts as ManageAccountsIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string | null;
}

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const drawerWidth = isCollapsed ? 48 : 192;

  const menuItems: MenuItem[] = [
    {
      icon: <DashboardIcon />,
      label: 'Dashboard',
      href: '#dashboard',
      badge: null,
    },
    {
      icon: <MeetingRoomIcon />,
      label: 'Room Booking',
      href: '#booking',
      badge: null,
    },
    {
      icon: <BookOnlineIcon />,
      label: 'My Bookings',
      href: '#my-bookings',
      badge: '3',
    },
    {
      icon: <CalendarMonthIcon />,
      label: 'Calendar',
      href: '#calendar',
      badge: null,
    },
    {
      icon: <ManageAccountsIcon />,
      label: 'Room Management',
      href: '#rooms',
      badge: null,
    },
    {
      icon: <AssessmentIcon />,
      label: 'Reports',
      href: '#reports',
      badge: null,
    },
    {
      icon: <SettingsIcon />,
      label: 'Settings',
      href: '#settings',
      badge: null,
    },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'grey.900',
          color: 'white',
          transition: 'width 0.3s',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Sidebar Header */}
      <Box
        sx={{
          p: 1,
          borderBottom: 1,
          borderColor: 'grey.700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
        }}
      >
        {!isCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                bgcolor: 'primary.main',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1,
              }}
            >
              <MeetingRoomIcon sx={{ fontSize: 12, color: 'white' }} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
              Menu
            </Typography>
          </Box>
        )}
        <IconButton
          size="small"
          onClick={() => setIsCollapsed(!isCollapsed)}
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'grey.800' },
          }}
        >
          {isCollapsed ? (
            <ChevronRightIcon sx={{ fontSize: 12 }} />
          ) : (
            <ChevronLeftIcon sx={{ fontSize: 12 }} />
          )}
        </IconButton>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ mt: 1, px: 0.5 }}>
        {menuItems.map((item, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton
              component="a"
              href={item.href}
              sx={{
                borderRadius: 1,
                py: 0.75,
                px: 1,
                '&:hover': {
                  bgcolor: 'grey.800',
                },
                minHeight: 32,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: isCollapsed ? 'auto' : 32,
                  color: 'grey.400',
                  '.MuiListItemButton-root:hover &': {
                    color: 'white',
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: 16,
                  },
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!isCollapsed && (
                <>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'grey.300',
                    }}
                    sx={{
                      '.MuiListItemButton-root:hover &': {
                        '& .MuiTypography-root': {
                          color: 'white',
                        },
                      },
                    }}
                  />
                  {item.badge && (
                    <Badge
                      badgeContent={item.badge}
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.625rem',
                          height: 16,
                          minWidth: 16,
                          padding: '0 4px',
                        },
                      }}
                    />
                  )}
                </>
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Quick Stats */}
      {!isCollapsed && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            right: 8,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'grey.800',
              p: 1,
              borderRadius: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 500, color: 'grey.300', display: 'block', mb: 0.5 }}
            >
              Today
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'grey.400' }}>
                  Active
                </Typography>
                <Typography variant="caption" sx={{ color: 'primary.light' }}>
                  8
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'grey.400' }}>
                  Available
                </Typography>
                <Typography variant="caption" sx={{ color: 'success.light' }}>
                  4
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </Drawer>
  );
};

export default Sidebar;
