import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Room, Booking } from '../context/AppContext';

interface DashboardProps {
  rooms: Room[];
  bookings: Booking[];
  onClose: () => void;
}

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

const Dashboard: React.FC<DashboardProps> = ({ rooms, bookings, onClose }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

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
    const typeStats: Record<string, { count: number; bookings: number }> = {};
    rooms.forEach(room => {
      const roomBookings = filteredBookings.filter(b => {
        const roomId = typeof b.room === 'number' ? b.room : b.room.id;
        return roomId === room.id;
      });
      const categoryName = room.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      if (!typeStats[categoryName]) {
        typeStats[categoryName] = { count: 0, bookings: 0 };
      }
      typeStats[categoryName].count += 1;
      typeStats[categoryName].bookings += roomBookings.length;
    });

    return Object.entries(typeStats).map(([type, stats]) => ({
      type,
      rooms: stats.count,
      bookings: stats.bookings
    }));
  }, [rooms, filteredBookings]);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Room Analytics Dashboard</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>
          
          <div className="flex gap-4 mb-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600">Total Rooms</h3>
              <p className="text-2xl font-bold text-blue-800">{totalRooms}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-600">Total Bookings</h3>
              <p className="text-2xl font-bold text-green-800">{totalBookings}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-600">Rooms Used</h3>
              <p className="text-2xl font-bold text-yellow-800">{uniqueBookedRooms}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-600">Utilization Rate</h3>
              <p className="text-2xl font-bold text-purple-800">{utilizationRate}%</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Room Usage Ranking</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roomUtilizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Room Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roomTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, bookings }) => `${type}: ${bookings}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="bookings"
                >
                  {roomTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Peak Hours Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="bookings" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Weekly Booking Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="bookings" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Capacity Utilization Efficiency</h3>
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
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Room Statistics Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Room Name</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-left p-2">Capacity</th>
                  <th className="text-left p-2">Bookings</th>
                  <th className="text-left p-2">Usage %</th>
                </tr>
              </thead>
              <tbody>
                {roomUtilizationData.map((room, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{room.name}</td>
                    <td className="p-2">{room.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                    <td className="p-2">{room.capacity}</td>
                    <td className="p-2">{room.bookings}</td>
                    <td className="p-2">{room.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
