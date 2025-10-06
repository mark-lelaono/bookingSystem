const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9041/api';

// Set to true to bypass backend calls and use mock data (for frontend-only development)
const DEV_MODE = true;

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

interface Room {
  id: number;
  name: string;
  capacity: number;
  category: string;
  amenities: string[];
  description?: string;
  image?: string;
}

type BookingStatus = "pending" | "approved" | "cancelled" | "rejected";

interface Booking {
  id: number;
  room: number | Room;
  room_name?: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: BookingStatus;
  user?: number | User;
  attendees_count?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface RoomsResponse {
  results: Room[];
}

interface BookingsResponse {
  results: Booking[];
}

interface DashboardStats {
  total_bookings: number;
  pending_bookings: number;
  approved_bookings: number;
  rejected_bookings: number;
  total_rooms: number;
  available_rooms: number;
}

interface AvailabilityCheck {
  available: boolean;
  message?: string;
}

class APIService {
  private token: string | null;

  constructor() {
    this.token = localStorage.getItem('access_token');
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.logout();
      throw new Error('Authentication required');
    }

    return response;
  }

  // Authentication
  async login(email: string, password: string): Promise<LoginResponse> {
    if (DEV_MODE) {
      // Mock login response for frontend development
      const mockData: LoginResponse = {
        access: 'mock_access_token_' + Date.now(),
        refresh: 'mock_refresh_token_' + Date.now(),
        user: {
          id: 1,
          username: email.split('@')[0],
          email: email,
          first_name: 'John',
          last_name: 'Doe',
          is_staff: true,
          is_superuser: false,
        }
      };
      
      localStorage.setItem('access_token', mockData.access);
      localStorage.setItem('refresh_token', mockData.refresh);
      localStorage.setItem('user', JSON.stringify(mockData.user));
      this.token = mockData.access;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return mockData;
    }

    const response = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data: LoginResponse = await response.json();
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      this.token = data.access;
      return data;
    }

    throw new Error('Login failed');
  }

  async register(userData: RegisterData): Promise<User> {
    const response = await this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      return await response.json();
    }

    const errorData = await response.json();

    // Handle Django field validation errors
    if (typeof errorData === 'object' && !errorData.message) {
      const errorMessages: string[] = [];
      for (const [field, errors] of Object.entries(errorData)) {
        if (Array.isArray(errors)) {
          errorMessages.push(`${field}: ${errors.join(', ')}`);
        } else {
          errorMessages.push(`${field}: ${errors}`);
        }
      }
      throw new Error(errorMessages.join('; '));
    }

    throw new Error(errorData.message || 'Registration failed');
  }

  async verifyEmail(email: string, otpCode: string): Promise<any> {
    const response = await this.request('/auth/verify-email/', {
      method: 'POST',
      body: JSON.stringify({ email, otp_code: otpCode }),
    });

    if (response.ok) {
      return await response.json();
    }

    const errorData = await response.json();
    throw new Error(errorData.message || 'Verification failed');
  }

  async resendOTP(email: string): Promise<any> {
    const response = await this.request('/auth/resend-otp/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      return await response.json();
    }

    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to resend OTP');
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.token = null;
    window.location.href = '/login';
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Rooms
  async getRooms(): Promise<RoomsResponse> {
    if (DEV_MODE) {
      // Mock rooms data for frontend development
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        results: [
          { id: 1, name: 'Conference Room - Ground Floor', capacity: 200, category: 'conference', amenities: ['Projector', 'Whiteboard', 'Video Conferencing', 'Audio System'] },
          { id: 2, name: 'Boardroom - First Floor', capacity: 25, category: 'conference', amenities: ['Projector', 'Whiteboard', 'Video Conferencing'] },
          { id: 3, name: 'Small Boardroom - 1st Floor', capacity: 12, category: 'conference', amenities: ['TV Screen', 'Whiteboard'] },
          { id: 4, name: 'Situation Room', capacity: 8, category: 'special', amenities: ['Screen'] },
          { id: 5, name: 'Computer Lab 1 - Ground Floor', capacity: 20, category: 'computer_lab', amenities: ['Computers', 'Projector', 'Whiteboard'] },
          { id: 6, name: 'Computer Lab 2 - First Floor', capacity: 20, category: 'computer_lab', amenities: ['Computers', 'Projector', 'Whiteboard'] },
        ]
      };
    }

    const response = await this.request('/rooms/');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch rooms');
  }

  async getRoom(id: number): Promise<Room> {
    const response = await this.request(`/rooms/${id}/`);
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch room');
  }

  async createRoom(roomData: Partial<Room>): Promise<Room> {
    const response = await this.request('/rooms/', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to create room');
  }

  async updateRoom(id: number, roomData: Partial<Room>): Promise<Room> {
    const response = await this.request(`/rooms/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(roomData),
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to update room');
  }

  async deleteRoom(id: number): Promise<void> {
    const response = await this.request(`/rooms/${id}/`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete room');
    }
  }

  // Bookings
  async getBookings(): Promise<BookingsResponse> {
    if (DEV_MODE) {
      // Mock bookings data for frontend development
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        results: []
      };
    }

    const response = await this.request('/bookings/');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch bookings');
  }

  async getMyBookings(): Promise<BookingsResponse> {
    if (DEV_MODE) {
      // Mock user bookings data
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        results: []
      };
    }

    const response = await this.request('/bookings/my/');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch my bookings');
  }

  async createBooking(bookingData: Partial<Booking>): Promise<Booking> {
    const response = await this.request('/bookings/', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });

    if (response.ok) {
      return await response.json();
    }
    
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create booking');
  }

  async updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking> {
    const response = await this.request(`/bookings/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(bookingData),
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to update booking');
  }

  async cancelBooking(id: number): Promise<Booking> {
    const response = await this.request(`/bookings/${id}/cancel/`, {
      method: 'POST',
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to cancel booking');
  }

  async approveBooking(id: number): Promise<Booking> {
    const response = await this.request(`/bookings/${id}/approve/`, {
      method: 'POST',
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to approve booking');
  }

  async rejectBooking(id: number, reason: string): Promise<Booking> {
    const response = await this.request(`/bookings/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to reject booking');
  }

  // Check room availability
  async checkAvailability(roomId: number, date: string, startTime: string, endTime: string): Promise<AvailabilityCheck> {
    const response = await this.request(`/rooms/${roomId}/availability/`, {
      method: 'POST',
      body: JSON.stringify({
        date,
        start_time: startTime,
        end_time: endTime,
      }),
    });

    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to check availability');
  }

  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    if (DEV_MODE) {
      // Mock dashboard stats
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        total_bookings: 0,
        pending_bookings: 0,
        approved_bookings: 0,
        rejected_bookings: 0,
        total_rooms: 6,
        available_rooms: 6
      };
    }

    const response = await this.request('/bookings/stats/');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch dashboard stats');
  }
}

const apiService = new APIService();
export default apiService;
