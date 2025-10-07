import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card, 
  Paper,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  TextField,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Badge,
  Tooltip,
  FormControl,
  InputLabel,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  CalendarMonth as CalendarIcon,
  People as PeopleIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  BookmarkBorder as BookmarkIcon,
  EventAvailable as EventAvailableIcon,
} from '@mui/icons-material';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import BallotOutlinedIcon from '@mui/icons-material/BallotOutlined';
import FreeCancellationOutlinedIcon from '@mui/icons-material/FreeCancellationOutlined';
import { styled } from '@mui/material/styles';
import { useApp } from '../context/AppContext';
import { User, Room, Booking } from '../context/AppContext';
import apiService from '../services/api';
import EmailSettingsPanel from '../components/booking/EmailSettingsPanel';
import RoomAvailabilitySection from '../components/booking/RoomAvailabilitySection';
import RoomScheduleDialog from '../components/booking/RoomScheduleDialog';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';


// Extend the Room type to include availability
interface ExtendedRoom extends Room {
  availability: number;
}

type BookingType = 'hourly' | 'full-day' | 'multi-day' | 'weekly';

const BookingBoard: React.FC = () => {
  const { user } = useApp();

  // State
  const defaultDate = new Date('2025-10-05T13:05:00+03:00'); // 01:05 PM EAT, October 05, 2025
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);
  const [rooms, setRooms] = useState<ExtendedRoom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showEmailSettings, setShowEmailSettings] = useState<boolean>(false);
  const [selectedRoom, setSelectedRoom] = useState<ExtendedRoom | null>(null);
  const [selectedBookingType, setSelectedBookingType] = useState<BookingType | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [openRoomSchedule, setOpenRoomSchedule] = useState(false);
  const [openBookingTypePopup, setOpenBookingTypePopup] = useState(false);
  const [openBookingForm, setOpenBookingForm] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [duration, setDuration] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [attendees, setAttendees] = useState('');
  const [roomDayBookings, setRoomDayBookings] = useState<any[]>([]);
  
  // New state for enhanced features
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error' | 'info'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [submitting, setSubmitting] = useState(false);

  // Helper functions
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const RoomItem = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    textAlign: 'center',
    cursor: 'pointer',
    border: '1px solid #E0E0E0',
    borderRadius: theme.shape.borderRadius,
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: '#F5F7FA',
    },
  }));

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1)); // Start on Monday
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return {
        day: day.toLocaleDateString('en-US', { weekday: 'short' }),
        date: day.getDate(),
        fullDate: day,
        isSelected: day.toDateString() === date.toDateString(),
      };
    });
  };

  const handleRoomSelection = (room: ExtendedRoom) => {
    setSelectedRoom(room);
    // Load bookings for this room on the selected date
    loadRoomSchedule(room);
    setOpenRoomSchedule(true);
  };

  const loadRoomSchedule = (room: ExtendedRoom) => {
    // Filter bookings for this room - backend returns all bookings
    const roomBookings = bookings.filter((b: any) => {
      const matchesRoom = (typeof b.room === 'object' ? b.room.id : b.room) === room.id;
      return matchesRoom;
    });
    setRoomDayBookings(roomBookings);
  };

  const handleProceedToBook = () => {
    setOpenRoomSchedule(false);
    setOpenBookingForm(true);
  };

  const handleBookingTypeChange = (event: any) => {
    setSelectedBookingType(event.target.value as BookingType);
  };

  const handleConfirmBookingType = () => {
    setOpenBookingTypePopup(false);
    setOpenBookingForm(true);
  };

  const handleBookingSubmit = async () => {
    if (!selectedRoom || !meetingTitle || !startTime || !endTime) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    setSubmitting(true);
    try {
      // Format data for backend - it expects separate date and time fields
      const bookingData = {
        room: selectedRoom.id,
        start_date: formatDate(selectedDate),
        end_date: formatDate(selectedDate),
        start_time: startTime + ':00',
        end_time: endTime + ':00',
        purpose: meetingTitle,
        special_requirements: description || '',
        expected_attendees: parseInt(attendees) || 1,
        booking_type: selectedBookingType || 'hourly',
      };

      const response = await apiService.createBooking(bookingData as any);
      
      setSnackbar({
        open: true,
        message: 'Booking request submitted successfully! Awaiting approval.',
        severity: 'success'
      });
      
      // Reset form
      setOpenBookingForm(false);
      setMeetingTitle('');
      setOrganizer('');
      setDuration('');
      setStartTime('');
      setEndTime('');
      setDescription('');
      setAttendees('');
      setSelectedRoom(null);
      setSelectedBookingType('');
      
      // Refresh bookings
      const bookingsResponse = await apiService.getBookings();
      setBookings(bookingsResponse.results || bookingsResponse);
      
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to submit booking',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Load my bookings
  const loadMyBookings = useCallback(async () => {
    try {
      const response = await apiService.getMyBookings();
      setMyBookings(response.results || response);
    } catch (error) {
      console.error('Failed to load my bookings:', error);
    }
  }, []);

  // Filter rooms based on category and availability
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesCategory = categoryFilter === 'all' || room.category === categoryFilter;
      
      let matchesAvailability = true;
      if (availabilityFilter === 'available') {
        matchesAvailability = room.availability >= 70;
      } else if (availabilityFilter === 'limited') {
        matchesAvailability = room.availability >= 40 && room.availability < 70;
      } else if (availabilityFilter === 'busy') {
        matchesAvailability = room.availability < 40;
      }
      
      return matchesCategory && matchesAvailability;
    });
  }, [rooms, categoryFilter, availabilityFilter]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(rooms.map(r => r.category));
    return ['all', ...Array.from(cats)];
  }, [rooms]);

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Load data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getRooms();
        const roomsData = response.results || response;
        const transformedRooms: ExtendedRoom[] = roomsData.map((room: any) => ({
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          category: room.category,
          amenities: Array.isArray(room.amenities)
            ? room.amenities
            : typeof room.amenities === 'string'
            ? room.amenities.split(',').map((a: string) => a.trim()).filter((a: string) => a)
            : [],
          availability: room.availability || Math.floor(Math.random() * 100), // Use API data or mock
        }));
        setRooms(transformedRooms);

        const bookingsResponse = await apiService.getBookings();
        const bookingsData = bookingsResponse.results || bookingsResponse;
        setBookings(bookingsData);
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load room data. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Set current user from context
  useEffect(() => {
    if (user) {
      setCurrentUser({
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_staff: user.is_staff,
        is_superuser: user.is_superuser,
      });
    }
  }, [user]);

  // Calculate stats
  const availableRoomsCount = useMemo(() => rooms.length, [rooms]);

  const todayBookingsCount = useMemo(() => {
    const selectedDateStr = formatDate(selectedDate);
    return bookings.filter((b: any) => b.startDate === selectedDateStr || b.date === selectedDateStr).length;
  }, [bookings, selectedDate]);

  const timeOptions = [
    '08:00', '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45',
    '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45',
    '12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45',
    '14:00', '14:15', '14:30', '14:45', '15:00', '15:15', '15:30', '15:45',
    '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45', '18:00'
  ];

  // DatePickerCard Component
  const DatePickerCard = () => {
    const weekDays = getWeekDays(selectedDate);

    return (
      <Card sx={{ 
        borderRadius: 0, 
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)', 
        backgroundColor: '#FFFFFF',
        height: '100%',
        minHeight: { xs: 'auto', lg: '450px' },
        display: 'flex',
        flexDirection: 'column',
        borderTop: '3px solid #0284C7',
        borderLeft: '1px solid #E5E7EB',
        borderRight: '1px solid #E5E7EB',
        borderBottom: '1px solid #E5E7EB',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        }
      }}>
        <CardContent sx={{ 
          flexGrow: 1,
          p: { xs: 2, sm: 2.5, md: 3 },
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Select Date */}
          <Box sx={{ 
            mb: 3, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            pb: 2,
            borderBottom: '2px solid #0284C7'
          }}>
            <Typography 
              variant="h6" 
              color="#1F2937" 
              fontWeight={700} 
              sx={{ 
                fontSize: { xs: '1.1rem', sm: '1.25rem' }, 
                display: 'flex', 
                alignItems: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <CalendarIcon sx={{ mr: 1, color: '#0284C7', fontSize: { xs: 22, sm: 26 } }} /> 
              Select Date
            </Typography>
            <Chip 
              label={selectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              size="small"
              sx={{ 
                bgcolor: '#0284C7', 
                color: 'white',
                fontWeight: 600,
                borderRadius: 0,
              }}
            />
          </Box>

          {/* Date Picker */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="#044E36" fontWeight={600} gutterBottom sx={{ mb: 1 }}>
              📅 Choose a date:
            </Typography>
            <TextField
              type="date"
              fullWidth
              value={formatDate(selectedDate)}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                if (!isNaN(newDate.getTime())) setSelectedDate(newDate);
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: formatDate(new Date()) }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#F9FAFB',
                  borderRadius: 0,
                  '& fieldset': {
                    borderColor: '#D1D5DB',
                  },
                  '&:hover fieldset': {
                    borderColor: '#0284C7',
                  },
                },
                '& .MuiInputBase-input': { 
                  padding: '12px',
                  fontWeight: 500
                }
              }}
            />
          </Box>

          {/* Weekly Calendar */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="#044E36" fontWeight={600} gutterBottom sx={{ mb: 1.5 }}>
              📆 Quick Select - Current Week
            </Typography>
            <Box sx={{
              display: 'flex',
              gap: { xs: 0.5, sm: 1 },
              justifyContent: 'space-between',
              overflowX: { xs: 'auto', sm: 'visible' },
              pb: { xs: 1, sm: 0 }
            }}>
              {weekDays.map((weekDay) => (
                <Tooltip 
                  key={`${weekDay.day}-${weekDay.date}`}
                  title={weekDay.fullDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  arrow
                >
                  <Box sx={{
                    flex: { xs: '0 0 auto', sm: 1 },
                    minWidth: { xs: '60px', sm: 'auto' }
                  }}>
                    <Card
                      role="button"
                      tabIndex={0}
                      sx={{
                        p: { xs: 0.75, sm: 1.25 },
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: weekDay.isSelected ? '#0284C7' : '#FFFFFF',
                        color: weekDay.isSelected ? '#FFFFFF' : '#374151',
                        border: weekDay.isSelected ? '2px solid #0284C7' : '2px solid #E5E7EB',
                        borderRadius: 0,
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          backgroundColor: weekDay.isSelected ? '#0369A1' : '#F9FAFB',
                          borderColor: weekDay.isSelected ? '#0369A1' : '#0284C7',
                        },
                        width: '100%',
                        minHeight: { xs: '60px', sm: '70px' }
                      }}
                      onClick={() => setSelectedDate(weekDay.fullDate)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedDate(weekDay.fullDate)}
                    >
                      <Typography
                        variant="caption"
                        display="block"
                        fontWeight={700}
                        sx={{ 
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          opacity: 0.9,
                          mb: 0.5
                        }}
                      >
                        {weekDay.day.toUpperCase()}
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                      >
                        {weekDay.date}
                      </Typography>
                    </Card>
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // MeetingSpacesCard Component
  const MeetingSpacesCard = ({ 
    rooms, 
    selectedRoom, 
    setSelectedRoom, 
    handleRoomSelection }: any) => (
    <Card sx={{ 
      borderRadius: 0, 
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)', 
      backgroundColor: '#FFFFFF',
      height: '100%',
      minHeight: { xs: 'auto', lg: '450px' },
      display: 'flex',
      flexDirection: 'column',
      borderTop: '3px solid #F97316',
      borderLeft: '1px solid #E5E7EB',
      borderRight: '1px solid #E5E7EB',
      borderBottom: '1px solid #E5E7EB',
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      }
    }}>
      <CardContent sx={{ 
        flexGrow: 1,
        p: { xs: 2, sm: 2.5, md: 3 },
        display: 'flex',
        flexDirection: 'column',
      }}>
        {selectedRoom ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            sx={{
              flexGrow: 1,
              p: 3,
              textAlign: 'center',
              gap: 3,
              borderRadius: 0,
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
            }}
          >
            <Box sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: 0, 
              backgroundColor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #059669',
            }}>
              <CheckCircleOutlinedIcon sx={{ fontSize: 48, color: 'white' }} />
            </Box>
            
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={600}
                gutterBottom
                sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
              >
                ✓ Selected Space
              </Typography>
              <Typography variant="h5" color="#044E36" fontWeight={700}>
                {selectedRoom.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<PeopleIcon />}
                  label={`${selectedRoom.capacity} people`}
                  size="small"
                  sx={{ 
                    bgcolor: '#EFF6FF', 
                    color: '#1E40AF',
                    fontWeight: 600
                  }}
                />
                <Chip 
                  label={selectedRoom.category}
                  size="small"
                  sx={{ 
                    bgcolor: '#F0FDF4', 
                    color: '#166534',
                    fontWeight: 600
                  }}
                />
              </Box>
            </Box>
        
            <Box sx={{ flexGrow: 1 }} />
            
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              sx={{
                color: '#1F2937',
                borderColor: '#D1D5DB',
                borderWidth: 1,
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                '&:hover': {
                  backgroundColor: '#F3F4F6',
                  borderColor: '#9CA3AF',
                  borderWidth: 1,
                },
                transition: 'all 0.2s ease',
              }}
              onClick={() => setSelectedRoom(null)}
            >
              Change Selection
            </Button>
          </Box>
        
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <Box sx={{ 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              pb: 2,
              borderBottom: '2px solid #F97316'
            }}>
              <Typography 
                variant="h6" 
                color="#1F2937" 
                fontWeight={700} 
                sx={{ 
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  display: 'flex',
                  alignItems: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <ArticleOutlinedIcon sx={{ mr: 1, color: '#F97316' }} />
                Meeting Spaces
              </Typography>
              <Badge badgeContent={rooms.length} color="primary" sx={{ '& .MuiBadge-badge': { bgcolor: '#F97316', borderRadius: 0 } }}>
                <EventAvailableIcon sx={{ color: '#F97316' }} />
              </Badge>
            </Box>
  
            <Box sx={{ flexGrow: 1, mt: 1 }}>
              <Grid 
                container 
                spacing={{ xs: 1.5, sm: 2 }} 
                justifyContent="center"
              >
                {rooms.slice(0, 6).map((room: Room) => (
                  <Grid key={room.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <RoomItem 
                      onClick={() => handleRoomSelection(room)}
                      sx={{
                        height: { xs: 100, sm: 110 },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderLeft: '3px solid #E5E7EB',
                        borderRadius: 0,
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderLeftColor: '#F97316',
                          borderLeftWidth: '3px',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          backgroundColor: '#FFFBEB',
                        },
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: '#044E36', 
                          fontWeight: 600,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          textAlign: 'center',
                          px: 1.5,
                          mb: 0.5
                        }}
                      >
                        {room.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PeopleIcon sx={{ fontSize: 14, color: '#6B7280' }} />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#6B7280',
                            fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            fontWeight: 500
                          }}
                        >
                          {room.capacity} people
                        </Typography>
                      </Box>
                    </RoomItem>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
  
  // BookingTypePopup Component
  const BookingTypePopup = () => (
    <Dialog open={openBookingTypePopup} onClose={() => setOpenBookingTypePopup(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#044E36', color: '#FFFFFF', textAlign: 'center', justifyContent: 'center', }}>
        <FreeCancellationOutlinedIcon sx={{mr: 3, color: 'white', }}/> Select Booking Type
      </DialogTitle>
      <DialogContent sx={{ backgroundColor: '#EAFEF8', }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, textAlign: 'center', justifyContent: 'center', alignItems: 'center', backgroundColor: '#EAFEF8', }}>
          <Button
            variant={selectedBookingType === 'hourly' ? 'contained' : 'outlined'}
            onClick={() => setSelectedBookingType('hourly')}
            sx={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 300, py: 1.5, borderColor: '#044E36', color: selectedBookingType === 'hourly' ? '#fff' : '#044E36',
              backgroundColor: selectedBookingType === 'hourly' ? '#F97316' : 'transparent',
              }}
          >
            ⏰ Hourly Booking
            <Typography variant="caption" sx={{ ml: 1 }}>
              Book for specific hours
            </Typography>
          </Button>
          <Button
            variant={selectedBookingType === 'full-day' ? 'contained' : 'outlined'}
            onClick={() => setSelectedBookingType('full-day')}
            sx={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 300, py: 1.5, borderColor: '#044E36', color: selectedBookingType === 'full-day' ? '#fff' : '#044E36',
              backgroundColor: selectedBookingType === 'full-day' ? '#F97316' : 'transparent',
              }}
          >
            📅 Full Day
            <Typography variant="caption" sx={{ ml: 1 }}>
              Entire day booking
            </Typography>
          </Button>
          <Button
            variant={selectedBookingType === 'multi-day' ? 'contained' : 'outlined'}
            onClick={() => setSelectedBookingType('multi-day')}
            sx={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 300, py: 1.5, borderColor: '#044E36', color: selectedBookingType === 'multi-day' ? '#fff' : '#044E36',
              backgroundColor: selectedBookingType === 'multi-day' ? '#F97316' : 'transparent',
              }}
          >
            📊 Multi-Day
            <Typography variant="caption" sx={{ ml: 1 }}>
              Multiple consecutive days
            </Typography>
          </Button>
          <Button
            variant={selectedBookingType === 'weekly' ? 'contained' : 'outlined'}
            onClick={() => setSelectedBookingType('weekly')}
            sx={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 300, py: 1.5, borderColor: '#044E36', color: selectedBookingType === 'weekly' ? '#fff' : '#044E36',
              backgroundColor: selectedBookingType === 'weekly' ? '#F97316' : 'transparent',
              }}
          >
            🗓️ Weekly
            <Typography variant="caption" sx={{ ml: 1 }}>
              Recurring weekly booking
            </Typography>
          </Button>
        </Box>
      </DialogContent>
      <DialogActions sx={{ backgroundColor: '#EAFEF8', display: 'flex', justifyContent: 'center', gap: 2, py: 2 }}>
        <Button onClick={() => setOpenBookingTypePopup(false)} color="inherit" variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleConfirmBookingType} color="success" variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );

  // BookingFormPopup Component
  const BookingFormPopup = () => (
    <Dialog open={openBookingForm} onClose={() => setOpenBookingForm(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#044E36', color: '#FFFFFF', justifyContent: 'center', textAlign: 'center', }}>
        <BallotOutlinedIcon sx={{mr: 2, color: 'white'}}/> Book Meeting Room
      </DialogTitle>
      <DialogContent sx={{ backgroundColor: '#EAFEF8', }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, textAlign: 'center', justifyContent: 'center', color: '#044E36' }}>
          Reserve your preferred meeting space
        </Typography>
        {selectedRoom && (
          <>
            <Typography variant="h6" color="#044E36" sx={{ mb: 1, textAlign: 'center', justifyContent: 'center', fontWeight: 600 }}>
              🏢 {selectedRoom.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PeopleIcon sx={{ color: '#044E36' }} />
              <Typography variant="body2">{selectedRoom.capacity} people</Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {selectedDate.toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric',
              })} • {startTime || '08:00'} - {endTime || '08:30'}
            </Typography>
          </>
        )}
        <TextField
          fullWidth
          label="Meeting Title"
          placeholder="Enter meeting title"
          value={meetingTitle}
          onChange={(e) => setMeetingTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Organizer"
          placeholder="Enter organizer's name"
          value={organizer}
          onChange={(e) => setOrganizer(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Select
          fullWidth
          value={selectedBookingType}
          onChange={handleBookingTypeChange}
          displayEmpty
          sx={{ mb: 2 }}
        >
          <MenuItem value="" disabled>Select a booking type</MenuItem>
          <MenuItem value="hourly">⏰ Hourly Booking</MenuItem>
          <MenuItem value="full-day">🌅 Full Day Booking</MenuItem>
          <MenuItem value="multi-day">📅 Multi-Day Booking</MenuItem>
          <MenuItem value="weekly">📆 Weekly Booking</MenuItem>
        </Select>
        <Select
          fullWidth
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          displayEmpty
          sx={{ mb: 2 }}
          renderValue={(value) => value || 'Select Duration'}
        >
          <MenuItem value="" disabled>Select Duration</MenuItem>
          {['15 minutes', '20 minutes', '30 minutes', '45 minutes', '1 hour',
            '1 hour 15 minutes', '1 hour 30 minutes', '2 hours', '3 hours', '4 hours']
            .map((dur) => (
              <MenuItem key={dur} value={dur}>⏱️ {dur}</MenuItem>
            ))}
        </Select>
        <Select
          fullWidth
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          displayEmpty
          sx={{ mb: 2 }}
          renderValue={(value) => value || 'Select Start Time'}
        >
          <MenuItem value="" disabled>Select Start Time</MenuItem>
          {timeOptions.map((time) => (
            <MenuItem key={time} value={time}>🕐 {time}</MenuItem>
          ))}
        </Select>
        <Select
          fullWidth
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          displayEmpty
          sx={{ mb: 2 }}
          renderValue={(value) => value || 'Select End Time'}
        >
          <MenuItem value="" disabled>Select End Time</MenuItem>
          {timeOptions.map((time) => (
            <MenuItem key={time} value={time}>🕐 {time}</MenuItem>
          ))}
        </Select>
        <TextField
          fullWidth
          label="Description (optional)"
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Number of Attendees"
          type="number"
          value={attendees}
          onChange={(e) => setAttendees(e.target.value)}
          inputProps={{ max: selectedRoom?.capacity || 8 }}
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions sx={{ backgroundColor: '#EAFEF8', display: 'flex', justifyContent: 'center', gap: 2, py: 2 }}>
        <Button 
          onClick={() => setOpenBookingForm(false)} 
          color="inherit" 
          variant="outlined"
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleBookingSubmit} 
          variant="contained"
          disabled={submitting}
          sx={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            }
          }}
        >
          {submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Confirm Booking'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // My Bookings Modal Component
  const MyBookingsModal = () => (
    <Dialog 
      open={showMyBookings} 
      onClose={() => setShowMyBookings(false)} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #044E36 0%, #065F46 100%)', 
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <BookmarkIcon /> My Bookings
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {myBookings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">
              No bookings yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Start by booking a meeting room!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {myBookings.map((booking: any) => (
              <Card key={booking.id} sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={600} color="#044E36">
                  {booking.purpose}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Room: {typeof booking.room === 'object' ? booking.room.name : booking.room_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Time: {new Date(booking.start_time).toLocaleString()} - {new Date(booking.end_time).toLocaleString()}
                </Typography>
                <Chip 
                  label={booking.status} 
                  size="small" 
                  color={
                    booking.status === 'approved' ? 'success' : 
                    booking.status === 'pending' ? 'warning' : 'default'
                  }
                  sx={{ mt: 1 }}
                />
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => setShowMyBookings(false)} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      height: '100%',
      backgroundColor: '#F3F4F6',
      display: 'flex', 
      flexDirection: 'column',
    }}>
      <Box sx={{ 
        width: '100%',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        px: 0, 
        py: 0
      }}>
        {/* Header */}
        <Header 
          roomsCount={rooms.length}
          todayBookingsCount={todayBookingsCount}
          availableRoomsCount={availableRoomsCount}
        />

        {/* Filter Bar */}
        <Box sx={{ 
          mb: 0, 
          px: 3,
          py: 1.5, 
          borderRadius: 0, 
          backgroundColor: '#FAFAFA',
          boxShadow: 'none',
          border: 'none',
          borderTop: '2px solid #E5E7EB',
          borderBottom: '1px solid #E5E7EB',
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5, 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, flexWrap: 'wrap' }}>
              <FilterIcon sx={{ color: '#6B7280', fontSize: 20 }} />
              
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  sx={{
                    fontSize: '0.875rem',
                    bgcolor: '#FFFFFF',
                    borderRadius: 0,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E5E7EB',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#9CA3AF',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6B7280',
                    },
                  }}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat} sx={{ fontSize: '0.875rem' }}>
                      {cat === 'all' ? 'All Rooms' : cat.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                <InputLabel sx={{ fontSize: '0.875rem' }}>Status</InputLabel>
                <Select
                  value={availabilityFilter}
                  label="Status"
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  sx={{
                    fontSize: '0.875rem',
                    bgcolor: '#FFFFFF',
                    borderRadius: 0,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#E5E7EB',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#9CA3AF',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6B7280',
                    },
                  }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.875rem' }}>All</MenuItem>
                  <MenuItem value="available" sx={{ fontSize: '0.875rem' }}>✓ Available</MenuItem>
                  <MenuItem value="limited" sx={{ fontSize: '0.875rem' }}>⚠ Limited</MenuItem>
                  <MenuItem value="busy" sx={{ fontSize: '0.875rem' }}>✕ Busy</MenuItem>
                </Select>
              </FormControl>
              
              {(categoryFilter !== 'all' || availabilityFilter !== 'all') && (
                <IconButton 
                  size="small"
                  onClick={() => {
                    setCategoryFilter('all');
                    setAvailabilityFilter('all');
                  }}
                  sx={{ 
                    color: '#9CA3AF',
                    '&:hover': {
                      color: '#6B7280',
                      bgcolor: '#F3F4F6',
                    }
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            <Button
              size="small"
              variant="contained"
              startIcon={<BookmarkIcon sx={{ fontSize: 18 }} />}
              onClick={() => {
                loadMyBookings();
                setShowMyBookings(true);
              }}
              sx={{
                backgroundColor: '#1F2937',
                color: 'white',
                fontWeight: 600,
                px: 2,
                py: 0.75,
                borderRadius: 0,
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontSize: '0.75rem',
                '&:hover': {
                  backgroundColor: '#111827',
                }
              }}
            >
              My Bookings
            </Button>
          </Box>
        </Box>

        {currentUser && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: '1fr 1fr', 
              lg: '1fr 1fr 1fr' 
            },
            gap: 0,
            mb: 0,
            alignItems: 'stretch',
          }}>
            
            
          </Box>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            py: 8,
          }}>
            <CircularProgress />
          </Box>
        )}
        {/* Error State */}
        {error && (
          <Alert 
            severity="warning" 
            onClose={() => setError(null)} 
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {/* Room Availability Section */}
        <Box sx={{ mt: 0, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
          <RoomAvailabilitySection 
            rooms={filteredRooms}
            onRoomClick={handleRoomSelection}
          />
        </Box>

        {/* Email Settings Modal */}
        {showEmailSettings && currentUser && (
          <EmailSettingsPanel
            user={currentUser as any}
            onSettingsUpdate={(settings: any) => {
              console.log('Email settings updated:', settings);
            }}
            onClose={() => setShowEmailSettings(false)}
          />
        )}

        {/* Room Schedule Dialog */}
        <RoomScheduleDialog
          open={openRoomSchedule}
          room={selectedRoom}
          selectedDate={selectedDate}
          bookings={roomDayBookings}
          onClose={() => setOpenRoomSchedule(false)}
          onProceedToBook={handleProceedToBook}
        />

        {/* Mobile Popups - Only show on smaller screens */}
        <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
          <BookingTypePopup />
          <BookingFormPopup />
        </Box>

        {/* My Bookings Modal */}
        <MyBookingsModal />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbar.severity}
            sx={{ 
              width: '100%',
              borderRadius: 2,
              boxShadow: 3
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Footer */}
        <Footer roomsCount={rooms.length} bookingsCount={bookings.length} />
      </Box>
    </Box>
  );
};

export default BookingBoard;
