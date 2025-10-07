import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { useApp } from '../context/AppContext';
import apiService from '../services/api';
import { Room, Booking } from '../context/AppContext';

type TabType = 'overview' | 'analytics' | 'reports';
type TimeRangeType = 'week' | 'month';

interface RoomUtilizationData {
  name: string;
  bookings: number;
  percentage: number;
  capacity: number;
  category: string;
}

interface RoomTypeData {
  type: string;
  rooms: number;
  bookings: number;
  capacity: number;
  utilization: number;
  capacityShare: number;
  avgCapacity: number;
  color: string;
  icon: string;
}

interface PeakHoursData {
  hour: string;
  bookings: number;
}

interface WeeklyTrend {
  day: string;
  bookings: number;
}

interface CapacityUtilizationData {
  name: string;
  capacity: number;
  used: number;
  efficiency: number;
  bookings: number;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRangeType>('week');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsResponse, bookingsResponse] = await Promise.all([
          apiService.getRooms(),
          apiService.getBookings()
        ]);
        
        setRooms(roomsResponse.results || roomsResponse);
        setBookings(bookingsResponse.results || bookingsResponse);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredBookings = useMemo(() => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    if (timeRange === 'week') {
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
    } else {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    return bookings.filter(booking => {
      const bookingDate = new Date(booking.start_time);
      return isWithinInterval(bookingDate, { start: startDate, end: endDate });
    });
  }, [bookings, timeRange]);

  const totalRooms = rooms.length;
  const totalBookings = filteredBookings.length;
  const uniqueBookedRooms = new Set(
    filteredBookings.map(b => typeof b.room === 'number' ? b.room : b.room.id)
  ).size;
  const utilizationRate = totalRooms > 0 ? ((uniqueBookedRooms / totalRooms) * 100).toFixed(1) : '0';

  const roomUtilizationData: RoomUtilizationData[] = useMemo(() => {
    const roomStats = rooms.map(room => {
      const roomBookings = filteredBookings.filter(b => {
        const roomId = typeof b.room === 'number' ? b.room : b.room.id;
        return roomId === room.id;
      });
      const utilizationCount = roomBookings.length;
      const utilizationPercentage = totalBookings > 0 ? (utilizationCount / totalBookings * 100).toFixed(1) : '0';
      
      return {
        name: room.name.split(' - ')[0],
        bookings: utilizationCount,
        percentage: parseFloat(utilizationPercentage),
        capacity: room.capacity,
        category: room.category
      };
    });

    return roomStats.sort((a, b) => b.bookings - a.bookings);
  }, [rooms, filteredBookings, totalBookings]);

  const roomTypeData: RoomTypeData[] = useMemo(() => {
    const typeStats: Record<string, { 
      count: number; 
      bookings: number; 
      capacity: number;
      utilization: number;
      avgBookingSize: number;
    }> = {};
    let totalCapacity = 0;
    let totalBookingsCount = 0;
    
    rooms.forEach(room => {
      const roomBookings = filteredBookings.filter(b => {
        const roomId = typeof b.room === 'number' ? b.room : b.room.id;
        return roomId === room.id;
      });
      const categoryName = room.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      if (!typeStats[categoryName]) {
        typeStats[categoryName] = { 
          count: 0, 
          bookings: 0, 
          capacity: 0,
          utilization: 0,
          avgBookingSize: 0
        };
      }
      
      typeStats[categoryName].count += 1;
      typeStats[categoryName].bookings += roomBookings.length;
      typeStats[categoryName].capacity += room.capacity;
      totalCapacity += room.capacity;
      totalBookingsCount += roomBookings.length;
    });

    return Object.entries(typeStats).map(([type, stats], index) => {
      const utilizationRate = totalBookingsCount > 0 ? (stats.bookings / totalBookingsCount * 100) : 0;
      const capacityShare = (stats.capacity / totalCapacity * 100);
      
      return {
        type,
        rooms: stats.count,
        bookings: stats.bookings,
        capacity: stats.capacity,
        utilization: utilizationRate,
        capacityShare: capacityShare,
        avgCapacity: Math.round(stats.capacity / stats.count),
        color: COLORS[index % COLORS.length],
        icon: type.includes('Conference') ? '🏢' : 
              type.includes('Computer') ? '💻' : 
              type.includes('Special') ? '⭐' : '🏠'
      };
    });
  }, [rooms, filteredBookings, COLORS]);

  const peakHoursData: PeakHoursData[] = useMemo(() => {
    const hourStats: Record<string, number> = {};
    filteredBookings.forEach(booking => {
      const bookingTime = new Date(booking.start_time);
      const hour = bookingTime.getHours();
      const hourKey = `${hour}:00`;
      hourStats[hourKey] = (hourStats[hourKey] || 0) + 1;
    });

    const hours: PeakHoursData[] = [];
    for (let i = 8; i <= 18; i++) {
      const hourKey = `${i}:00`;
      hours.push({
        hour: hourKey,
        bookings: hourStats[hourKey] || 0
      });
    }

    return hours;
  }, [filteredBookings]);

  const weeklyTrends: WeeklyTrend[] = useMemo(() => {
    const weeklyData: Record<string, number> = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    filteredBookings.forEach(booking => {
      const date = new Date(booking.start_time);
      const dayName = dayNames[date.getDay()];
      weeklyData[dayName] = (weeklyData[dayName] || 0) + 1;
    });

    return dayNames.map(day => ({
      day,
      bookings: weeklyData[day] || 0
    }));
  }, [filteredBookings]);

  const capacityUtilization: CapacityUtilizationData[] = useMemo(() => {
    return rooms.map(room => {
      const roomBookings = filteredBookings.filter(b => {
        const roomId = typeof b.room === 'number' ? b.room : b.room.id;
        return roomId === room.id;
      });
      const totalCapacityUsed = roomBookings.reduce((sum, booking) => sum + (booking.attendees_count || 0), 0);
      const maxPossibleCapacity = roomBookings.length * room.capacity;
      const utilizationPercentage = maxPossibleCapacity > 0 ? (totalCapacityUsed / maxPossibleCapacity * 100).toFixed(1) : '0';

      return {
        name: room.name.split(' - ')[0],
        capacity: room.capacity,
        used: totalCapacityUsed,
        efficiency: parseFloat(utilizationPercentage),
        bookings: roomBookings.length
      };
    });
  }, [rooms, filteredBookings]);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: '#E3EBFF'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading dashboard data...
          </Typography>
        </Box>
      </Box>
    );
  }

  const renderOverviewTab = () => (
    <Box>
      {/* Key Metrics */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 3 
        }}>
          {[
            { icon: '🏢', label: 'Total Rooms', value: totalRooms, color: '#3B82F6' },
            { icon: '📅', label: 'Total Bookings', value: totalBookings, color: '#10B981' },
            { icon: '🎯', label: 'Rooms Used', value: uniqueBookedRooms, color: '#F59E0B' },
            { icon: '📊', label: 'Utilization Rate', value: `${utilizationRate}%`, color: '#8B5CF6' },
          ].map((stat, index) => (
            <Card key={index} sx={{ 
              borderLeft: 4, 
              borderColor: stat.color,
              transition: 'all 0.3s',
              '&:hover': { 
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h4" sx={{ mr: 1 }}>{stat.icon}</Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {stat.label}
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight={700} color={stat.color}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Room Usage Ranking */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          📊 Room Usage Ranking
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={roomUtilizationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="bookings" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Room Type Distribution */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              🎯 Room Type Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Booking patterns across room categories
            </Typography>
          </Box>
          <Chip label={`${totalBookings} Total Bookings`} color="primary" />
        </Box>

        <Box sx={{ display: 'flex', gap: 4, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          {/* Pie Chart */}
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roomTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="bookings"
                  onMouseEnter={(data, index) => setHoveredSegment(index)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  {roomTypeData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={hoveredSegment === index ? '#ffffff' : 'none'}
                      strokeWidth={hoveredSegment === index ? 3 : 0}
                      style={{
                        filter: hoveredSegment === index ? 'brightness(1.1)' : 'brightness(1)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => setSelectedRoomType(selectedRoomType === entry.type ? null : entry.type)}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          {/* Stats List */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {roomTypeData.map((item) => (
              <Card 
                key={item.type}
                sx={{ 
                  cursor: 'pointer',
                  borderLeft: 4,
                  borderColor: item.color,
                  bgcolor: selectedRoomType === item.type ? `${item.color}10` : 'background.paper',
                  transition: 'all 0.3s',
                  '&:hover': { boxShadow: 3, transform: 'translateX(4px)' }
                }}
                onClick={() => setSelectedRoomType(selectedRoomType === item.type ? null : item.type)}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">{item.icon}</Typography>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{item.type}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.rooms} rooms
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="h6" fontWeight={700} color={item.color}>
                      {item.bookings}
                    </Typography>
                  </Box>
                  <Box sx={{ width: '100%', height: 6, bgcolor: '#e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ 
                      width: `${item.utilization}%`, 
                      height: '100%', 
                      bgcolor: item.color,
                      transition: 'width 0.5s ease'
                    }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {item.utilization.toFixed(1)}% of total bookings
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );

  const renderAnalyticsTab = () => (
    <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Peak Hours Analysis
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={peakHoursData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="bookings" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Weekly Booking Trends
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="bookings" stroke="#F59E0B" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      <Paper sx={{ p: 3, gridColumn: { xs: '1', md: '1 / -1' } }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Capacity Utilization Efficiency
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={capacityUtilization}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value, name) => [
              name === 'efficiency' ? `${value}%` : value,
              name === 'efficiency' ? 'Efficiency' : 'Max Capacity'
            ]} />
            <Legend />
            <Bar dataKey="capacity" fill="#E5E7EB" />
            <Bar dataKey="efficiency" fill="#EF4444" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );

  const renderReportsTab = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Room Statistics Summary
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 700 }}>Room Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Capacity</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Bookings</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Usage %</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roomUtilizationData.map((room, index) => (
              <TableRow key={index} hover>
                <TableCell sx={{ fontWeight: 600 }}>{room.name}</TableCell>
                <TableCell>
                  <Chip 
                    label={room.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{room.capacity}</TableCell>
                <TableCell>{room.bookings}</TableCell>
                <TableCell>{room.percentage}%</TableCell>
                <TableCell>
                  <Chip 
                    label={room.bookings > 0 ? 'Active' : 'Inactive'}
                    size="small"
                    color={room.bookings > 0 ? 'success' : 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#E3EBFF' }}>
      <Box sx={{ 
        width: '100%',
        px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 }, 
        py: { xs: 2, sm: 3, md: 4 } 
      }}>
        {/* Header */}
        <Paper sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          mb: 4, 
          bgcolor: '#044E36',
          borderRadius: 2
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }}>
            <Box component="img" 
              src="/ICPAC_Website_Header_Logo.svg" 
              alt="ICPAC Logo" 
              sx={{ height: { xs: 40, sm: 55 } }} 
            />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={700} color="white" sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem' },
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: 'center'
              }}>
                <span>📊</span> ROOM ANALYTICS DASHBOARD
              </Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.9)">
                Real-time insights and statistics for ICPAC meeting rooms
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="outlined"
                onClick={() => navigate('/')}
                sx={{ 
                  color: 'white', 
                  borderColor: 'white',
                  '&:hover': { borderColor: '#D1FAE5', bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                ← Back
              </Button>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRangeType)}
                  sx={{ 
                    color: 'white', 
                    '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1FAE5' },
                    '.MuiSvgIcon-root': { color: 'white' }
                  }}
                >
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            centered
            sx={{
              '& .MuiTab-root': { fontWeight: 600, fontSize: '1rem' },
              '& .Mui-selected': { color: '#044E36' },
              '& .MuiTabs-indicator': { bgcolor: '#044E36' }
            }}
          >
            <Tab value="overview" label="📈 Overview" />
            <Tab value="analytics" label="📊 Analytics" />
            <Tab value="reports" label="📋 Reports" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
          {activeTab === 'reports' && renderReportsTab()}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardPage;
