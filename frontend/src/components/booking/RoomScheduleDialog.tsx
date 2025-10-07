import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Divider,
  LinearProgress,
  IconButton,
  TextField,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Event as EventIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  People as PeopleIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Today as TodayIcon,
} from '@mui/icons-material';

interface RoomScheduleDialogProps {
  open: boolean;
  room: {
    id: number;
    name: string;
    capacity: number;
    category: string;
    availability: number;
  } | null;
  selectedDate: Date;
  bookings: any[];
  onClose: () => void;
  onProceedToBook: () => void;
}

const RoomScheduleDialog: React.FC<RoomScheduleDialogProps> = ({
  open,
  room,
  selectedDate,
  bookings,
  onClose,
  onProceedToBook,
}) => {
  const [viewingDate, setViewingDate] = useState<Date>(new Date());

  // Reset to today when dialog opens
  useEffect(() => {
    if (open) {
      setViewingDate(new Date());
    }
  }, [open]);

  if (!room) return null;

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const handlePreviousDay = () => {
    const newDate = new Date(viewingDate);
    newDate.setDate(newDate.getDate() - 1);
    setViewingDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(viewingDate);
    newDate.setDate(newDate.getDate() + 1);
    setViewingDate(newDate);
  };

  const handleToday = () => {
    setViewingDate(new Date());
  };

  const handleDateChange = (dateString: string) => {
    const newDate = new Date(dateString);
    if (!isNaN(newDate.getTime())) {
      setViewingDate(newDate);
    }
  };

  // Filter bookings for the viewing date
  const viewingDateStr = formatDate(viewingDate);
  const dayBookings = bookings.filter((b: any) => {
    // Backend returns start_date as separate field
    const bookingDate = b.start_date || (b.start_time ? b.start_time.split('T')[0] : (b.date || b.startDate));
    return bookingDate === viewingDateStr;
  });

  // Generate time slots for the day (8 AM to 6 PM)
  const generateTimeSlots = (): { time: string; hour: number }[] => {
    const slots: { time: string; hour: number }[] = [];
    for (let hour = 8; hour <= 18; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        hour: hour,
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Check if a time slot is booked
  const isTimeSlotBooked = (hour: number) => {
    return dayBookings.some((booking: any) => {
      // Backend returns separate time fields (HH:MM:SS format)
      const startHour = booking.start_time ? parseInt(booking.start_time.split(':')[0]) : 
                        (booking.start_time_combined ? new Date(booking.start_time_combined).getHours() : 0);
      const endHour = booking.end_time ? parseInt(booking.end_time.split(':')[0]) : 
                      (booking.end_time_combined ? new Date(booking.end_time_combined).getHours() : 0);
      return hour >= startHour && hour < endHour;
    });
  };

  // Get booking at specific hour
  const getBookingAtHour = (hour: number) => {
    return dayBookings.find((booking: any) => {
      const startHour = booking.start_time ? parseInt(booking.start_time.split(':')[0]) : 
                        (booking.start_time_combined ? new Date(booking.start_time_combined).getHours() : 0);
      return hour === startHour;
    });
  };

  const bookedSlotsCount = timeSlots.filter(slot => isTimeSlotBooked(slot.hour)).length;
  const availableSlotsCount = timeSlots.length - bookedSlotsCount;
  const availabilityPercentage = Math.round((availableSlotsCount / timeSlots.length) * 100);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0,
          border: '1px solid #E5E7EB',
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#044E36', 
        color: '#FFFFFF',
        py: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <EventIcon />
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem' }}>
            {room.name} - Daily Schedule
          </Typography>
        </Box>
        
        {/* Day Navigator */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              size="small"
              onClick={handlePreviousDay}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 0,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                }
              }}
            >
              <PrevIcon />
            </IconButton>
            
            <TextField
              type="date"
              value={formatDate(viewingDate)}
              onChange={(e) => handleDateChange(e.target.value)}
              size="small"
              sx={{
                '& .MuiInputBase-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  color: 'white',
                  borderRadius: 0,
                  minWidth: 160,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '& input': {
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }
              }}
            />
            
            <IconButton 
              size="small"
              onClick={handleNextDay}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 0,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                }
              }}
            >
              <NextIcon />
            </IconButton>
          </Box>
          
          <Button
            size="small"
            startIcon={<TodayIcon />}
            onClick={handleToday}
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: 0,
              textTransform: 'uppercase',
              fontSize: '0.7rem',
              letterSpacing: '0.5px',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
            variant="outlined"
          >
            Today
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Room Info Header */}
        <Box sx={{ 
          bgcolor: '#F9FAFB', 
          p: 3, 
          borderBottom: '2px solid #E5E7EB',
        }}>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={<PeopleIcon />}
                label={`Capacity: ${room.capacity}`}
                sx={{ 
                  bgcolor: '#FFFFFF',
                  borderRadius: 0,
                  border: '1px solid #E5E7EB',
                }}
              />
              <Chip 
                label={room.category.replace('_', ' ').toUpperCase()}
                sx={{ 
                  bgcolor: '#FFFFFF',
                  borderRadius: 0,
                  border: '1px solid #E5E7EB',
                }}
              />
            </Box>
            
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                Today's Availability
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={availabilityPercentage}
                  sx={{
                    width: 100,
                    height: 8,
                    borderRadius: 0,
                    bgcolor: '#E5E7EB',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: availabilityPercentage >= 70 ? '#10B981' : availabilityPercentage >= 40 ? '#F59E0B' : '#EF4444',
                      borderRadius: 0,
                    },
                  }}
                />
                <Typography variant="body2" fontWeight={700} color={availabilityPercentage >= 70 ? '#10B981' : availabilityPercentage >= 40 ? '#F59E0B' : '#EF4444'}>
                  {availabilityPercentage}%
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Time Slots Schedule */}
        <Box sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} color="#1F2937" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Hourly Schedule (8:00 AM - 6:00 PM)
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {timeSlots.map((slot, index) => {
              const isBooked = isTimeSlotBooked(slot.hour);
              const booking = getBookingAtHour(slot.hour);
              
              return (
                <Box 
                  key={slot.time}
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    py: 1.5,
                    px: 2,
                    bgcolor: isBooked ? '#FEF2F2' : '#F0FDF4',
                    borderBottom: index < timeSlots.length - 1 ? '1px solid #E5E7EB' : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isBooked ? '#FEE2E2' : '#DCFCE7',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 120 }}>
                    <TimeIcon sx={{ fontSize: 18, color: isBooked ? '#DC2626' : '#059669' }} />
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                      {slot.time}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1, ml: 3 }}>
                    {isBooked && booking ? (
                      <Box>
                        <Typography variant="body2" fontWeight={600} color="#1F2937" sx={{ fontSize: '0.875rem' }}>
                          {booking.purpose || 'Meeting'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {booking.start_time || '00:00'} - {booking.end_time || '00:00'}
                          {booking.expected_attendees && ` • ${booking.expected_attendees} attendees`}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="#059669" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        Available
                      </Typography>
                    )}
                  </Box>
                  
                  {isBooked ? (
                    <CancelIcon sx={{ fontSize: 20, color: '#DC2626' }} />
                  ) : (
                    <CheckIcon sx={{ fontSize: 20, color: '#059669' }} />
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Summary */}
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: '#F9FAFB',
            border: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 2,
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={700} color="#059669">
                {availableSlotsCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Available Slots
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={700} color="#DC2626">
                {bookedSlotsCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Booked Slots
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={700} color="#1F2937">
                {availabilityPercentage}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Availability
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 2, 
        bgcolor: '#F9FAFB',
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#D1D5DB',
            color: '#6B7280',
            borderRadius: 0,
            '&:hover': {
              borderColor: '#9CA3AF',
              bgcolor: '#F3F4F6',
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onProceedToBook}
          variant="contained"
          disabled={availabilityPercentage < 10}
          sx={{
            bgcolor: '#044E36',
            color: 'white',
            borderRadius: 0,
            fontWeight: 600,
            px: 3,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            '&:hover': {
              bgcolor: '#033027',
            },
            '&:disabled': {
              bgcolor: '#D1D5DB',
            }
          }}
        >
          Proceed to Book
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoomScheduleDialog;

