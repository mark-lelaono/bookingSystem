import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
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
} from '@mui/material'; //
import Grid from '@mui/material/Grid';
import {
  CalendarMonth as CalendarIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import BallotOutlinedIcon from '@mui/icons-material/BallotOutlined';
import FreeCancellationOutlinedIcon from '@mui/icons-material/FreeCancellationOutlined';
import { styled } from '@mui/material/styles';
import { useApp } from '../context/AppContext';
import { User, Room, Booking } from '../context/AppContext';
import apiService from '../services/api';
import EmailSettingsPanel from './EmailSettingsPanel';
import RoomAvailabilitySection from './RoomAvailabilitySection';
import './BookingBoard.css';

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
  const [openBookingTypePopup, setOpenBookingTypePopup] = useState(false);
  const [openBookingForm, setOpenBookingForm] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [duration, setDuration] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [attendees, setAttendees] = useState('');

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
    setOpenBookingTypePopup(true);
  };

  const handleBookingTypeChange = (event: any) => {
    setSelectedBookingType(event.target.value as BookingType);
  };

  const handleConfirmBookingType = () => {
    setOpenBookingTypePopup(false);
    setOpenBookingForm(true);
  };

  const handleBookingSubmit = () => {
    console.log('Booking submitted:', {
      selectedRoom,
      selectedBookingType,
      selectedDate,
      meetingTitle,
      organizer,
      duration,
      startTime,
      endTime,
      description,
      attendees,
    });
    setOpenBookingForm(false);
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
      <Card sx={{ borderRadius: 2, boxShadow: 3, backgroundColor: '#EAFEF8' }}>
        <CardContent>
          {/* Select Date */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
            <Typography variant="subtitle1" color="#044E36" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.15rem' }, display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ mr: 1, color: '#F97316', fontSize: { xs: 18, sm: 20 } }} /> Select Date
            </Typography>
          </Box>

          {/* Date Picker */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Choose a date:
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
              sx={{ '& .MuiInputBase-input': { padding: '8px' } }}
            />
          </Box>

          {/* Weekly Calendar */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Week
            </Typography>
            <Box sx={{
              display: 'flex',
              gap: { xs: 0.5, sm: 1 },
              justifyContent: 'space-between',
              overflowX: { xs: 'auto', sm: 'visible' },
              pb: { xs: 1, sm: 0 }
            }}>
              {weekDays.map((weekDay) => (
                <Box key={`${weekDay.day}-${weekDay.date}`} sx={{
                  flex: { xs: '0 0 auto', sm: 1 },
                  minWidth: { xs: '60px', sm: 'auto' }
                }}>
                  <Card
                    role="button"
                    tabIndex={0}
                    sx={{
                      p: { xs: 0.5, sm: 1 },
                      textAlign: 'center',
                      cursor: 'pointer',
                      bgcolor: weekDay.isSelected ? '#F97316' : '#FFFFFF',
                      color: weekDay.isSelected ? '#FFFFFF' : '#044E36',
                      border: '1px solid #E0E0E0',
                      borderRadius: 1,
                      '&:hover': { boxShadow: 2 },
                      width: '100%',
                      minHeight: { xs: '50px', sm: 'auto' }
                    }}
                    onClick={() => setSelectedDate(weekDay.fullDate)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedDate(weekDay.fullDate)}
                  >
                    <Typography
                      variant="caption"
                      display="block"
                      fontWeight={600}
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {weekDay.day}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      {weekDay.date}
                    </Typography>
                  </Card>
                </Box>
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
    <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3, backgroundColor: '#EAFEF8' }}>
      <CardContent>
        {selectedRoom ? (
          <Box
            display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          sx={{
            mt: 3, // optional: space from top
            p: 2,  // padding inside box
            textAlign: 'center',
            gap: 2, // space between items (Typography and Button)
            }} >
              <Typography
            variant="h6"
            color="#044E36"
            fontWeight={600}
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
            <CheckCircleOutlinedIcon sx={{ mr: 1, color: '#F97316' }} />
            Selected Space
            </Typography>
        
          <Typography variant="h6" color="#044E36" fontWeight={600}>
            {selectedRoom.name}
          </Typography>
        
          <Button
            variant="outlined"
            sx={{
              mt: 2, // small space above button (extra spacing beyond gap)
              color: '#044E36',
              borderColor: '#044E36',
            }}
            onClick={() => setSelectedRoom(null)}
          >
            Change Selection
          </Button>
        </Box>
        
        ) : (
          <Box sx={{ textAlign: 'center'}}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArticleOutlinedIcon sx={{ mr: 1, color: '#F97316' }} />
              <Typography variant="h6" color="#044E36" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.15rem' } }}>
                Select Meeting Space
              </Typography>
            </Box>
  
            <Box sx={{ flexGrow: 1, mt: 2 }}>
              <Grid container spacing={{ xs: 2, sm: 3, md: 3 }} justifyContent="center" alignContent={"center"}>
                {rooms.slice(0, 6).map((room :Room) => (
                  <Grid key={room.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <RoomItem onClick={() => handleRoomSelection(room)}
                      sx={{
                        height: 100, // fixed height for equal box sizes
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: '1px solid #E0E0E0',
                        borderRadius: 2,
                        boxShadow: '0 2px 4px rgb(37,99,77)',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        },
                      }}>
                      <Typography variant="body2" sx={{ color: '#044E36', fontWeight: 500 }}>
                        {room.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Capacity: {room.capacity}
                      </Typography>
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
        <Button onClick={() => setOpenBookingForm(false)} color="inherit" variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleBookingSubmit} color="success" variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#E3EBFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box
          sx={{
            mb: 4,
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            background: '#044E36',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 2, sm: 0 },
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
            gap: { xs: 1, sm: 2 },
            justifyContent: { xs: 'center', sm: 'flex-end' }
          }}>
            <Card sx={{
              px: { xs: 1, sm: 2 },
              py: 1,
              textAlign: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              minWidth: { xs: '60px', sm: 'auto' }
            }}>
              <Typography
                variant="h6"
                fontWeight={700}
                color="#FFFFFF"
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                {rooms.length}
              </Typography>
              <Typography variant="caption" color="#FFFFFF">
                Rooms
              </Typography>
            </Card>
            <Card sx={{
              px: { xs: 1, sm: 2 },
              py: 1,
              textAlign: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              minWidth: { xs: '60px', sm: 'auto' }
            }}>
              <Typography
                variant="h6"
                fontWeight={700}
                color="#FFFFFF"
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                {todayBookingsCount}
              </Typography>
              <Typography variant="caption" color="#FFFFFF">
                Today
              </Typography>
            </Card>
            <Card sx={{
              px: { xs: 1, sm: 2 },
              py: 1,
              textAlign: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              minWidth: { xs: '60px', sm: 'auto' }
            }}>
              <Typography
                variant="h6"
                fontWeight={700}
                color="#FFFFFF"
                sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
              >
                {availableRoomsCount}
              </Typography>
              <Typography variant="caption" color="#FFFFFF">
                Available
              </Typography>
            </Card>
          </Box>
        </Box>

        {currentUser && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' },
            gap: { xs: 2, sm: 3 },
            mb: 4
          }}>
            {/* Left Column: Date Selection */}
            <DatePickerCard />

            {/* Middle Column: Meeting Spaces */}
            <MeetingSpacesCard
              rooms={rooms}
              selectedRoom={selectedRoom}
              setSelectedRoom={setSelectedRoom}
              handleRoomSelection={handleRoomSelection}
            />

            {/* Right Column: Room Details - Only show on larger screens when room is selected */}
            <Box sx={{ display: { xs: 'none', lg: selectedRoom ? 'block' : 'none', backgroundColor: '#EAFEF8' } }}>
              {selectedRoom && (
                <Card sx={{ height: '100%', transition: 'all 0.3s', '&:hover': { boxShadow: 6 }, backgroundColor: '#EAFEF8' }}>
                  <CardContent>
                    <Typography
                      variant="h6"
                      mt={3}
                      fontWeight={600}
                      gutterBottom
                      color="#044E36"
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem', textAlign: 'center', justifyContent: 'center', } }}
                    >
                      {selectedRoom.name}
                    </Typography>
                    <Box sx={{
                      display: 'flex',
                      gap: { xs: 0.5, sm: 1 },
                      mb: 3,
                      flexWrap: 'wrap'
                    }}>
                      <Chip
                        icon={<PeopleIcon />}
                        label={`${selectedRoom.capacity} people`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={selectedRoom.category}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 0.5,
                      mb: 2
                    }}>
                      {selectedRoom.amenities.map((amenity) => (
                        <Chip key={amenity} label={amenity} size="small" variant="outlined" />
                      ))}
                    </Box>
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      sx={{
                        mt: 3,
                        py: 0.5,
                        backgroundColor: 'transparent',
                        border: '0.2px solid #044E36',
                        color: '#044E36',
                        '&:hover': { backgroundColor: '' },
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                      onClick={() => console.log('View availability:', selectedRoom.id)}
                    >
                      View Availability
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Box>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}
        {/* Error State */}
        {error && (
          <Alert severity="warning" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Room Availability Section */}
        <RoomAvailabilitySection />

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

        {/* Mobile Popups - Only show on smaller screens */}
        <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
          <BookingTypePopup />
          <BookingFormPopup />
        </Box>

        {/* Footer */}
        <Box component="footer" sx={{ mt: 6, py: 1, borderTop: 1, borderColor: 'divider' }}>
          <Container maxWidth="xl" sx={{ textAlign: 'center', bgcolor: '#044E36', borderRadius: 4, overflow: 'hidden' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, p: 3 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box component="img" src="/ICPAC_Website_Header_Logo.svg" alt="ICPAC Logo" sx={{ height: 32 }} />
                  <Typography variant="h6" fontWeight={600} color="#D1FAE5">
                    ICPAC Booking System
                  </Typography>
                </Box>
                <Typography variant="body2" color="#FFFFFF">
                  Streamlining meeting room reservations
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} color="#D1FAE5" gutterBottom>
                  Quick Links
                </Typography>
                <Typography variant="body2" color="#FFFFFF">
                  Dashboard
                </Typography>
                <Typography variant="body2" color="#FFFFFF">
                  Settings
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} color="#D1FAE5" gutterBottom>
                  Contact Info
                </Typography>
                <Typography variant="body2" color="#FFFFFF">
                  Email: info@icpac.net
                </Typography>
                <Typography variant="body2" color="#FFFFFF">
                  Phone: +254 20 7095000
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} color="#D1FAE5" gutterBottom>
                  System Stats
                </Typography>
                <Typography variant="body2" color="#FFFFFF">
                  Total Rooms: {rooms.length}
                </Typography>
                <Typography variant="body2" color="#FFFFFF">
                  Active Bookings: {bookings.length}
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                bgcolor: '#000000',
                color: '#FFFFFF',
                py: 2,
                textAlign: 'center',
                borderRadius: '0 0 8px 8px',
                mt: 6,
                width: 'calc(100% + 48px)',
                mx: '-24px',
              }}
            >
              <Typography variant="body2">
                © 2025 ICPAC. All rights reserved. | Boardroom Booking System v1.0
              </Typography>
            </Box>
          </Container>
        </Box>
      </Container>
    </Box>
  );
};

export default BookingBoard;
