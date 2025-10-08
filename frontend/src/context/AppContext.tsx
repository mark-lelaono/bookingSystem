import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

// -------------------------
// Type definitions
// -------------------------
export type BookingStatus = "pending" | "approved" | "cancelled" | "rejected";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  category: string;
  amenities: string[];
  description?: string;
  image?: string;
}

export interface Booking {
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

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

interface StoredUser extends User {
  password: string; // only in localStorage for demo
}

interface AppContextType {
  // Data
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  pageLoading: boolean;
  setPageLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;

  // Auth
  login: (email: string, password: string) => Promise<User>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;

  // Bookings
  fetchRooms: () => Promise<void>;
  fetchBookings: () => Promise<void>;
  createBooking: (bookingData: Partial<Booking>) => Promise<Booking>;
  updateBooking: (id: number, bookingData: Partial<Booking>) => Promise<Booking>;
  cancelBooking: (id: number) => Promise<void>;

  // LocalStorage
  saveBookingsToStorage: (bookingsData: Booking[]) => void;
  loadBookingsFromStorage: () => Booking[] | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // AUTH
  // -------------------------
  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      // Import apiService dynamically to avoid circular dependency
      const apiService = (await import('../services/api')).default;
      
      const response = await apiService.login(email, password);
      setUser(response.user);
      return response.user;
    } catch (error: any) {
      throw new Error(error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setLoading(true);
    try {
      // Import apiService dynamically to avoid circular dependency
      const apiService = (await import('../services/api')).default;
      
      await apiService.register(userData);
      // Don't set user yet - they need to verify email first
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setRooms([]);
    setBookings([]);
  };

  // -------------------------
  // DATA FETCH
  // -------------------------
  const loadFallbackData = useCallback((): void => {
    const fallbackRooms: Room[] = [
      {
        id: 1,
        name: "Conference Room - Ground Floor",
        capacity: 200,
        category: "conference",
        amenities: ["Projector", "Whiteboard", "Video Conferencing", "Audio System"],
      },
      {
        id: 2,
        name: "Boardroom - First Floor",
        capacity: 25,
        category: "conference",
        amenities: ["Projector", "Whiteboard", "Video Conferencing"],
      },
    ];
    setRooms(fallbackRooms);
  }, []);

  const fetchRooms = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      loadFallbackData(); // no backend yet
    } catch (err: any) {
      setError(err.message);
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  }, [loadFallbackData]);

  const fetchBookings = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const saved = loadBookingsFromStorage();
      if (saved) setBookings(saved);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBooking = async (bookingData: Partial<Booking>): Promise<Booking> => {
    setLoading(true);
    try {
      const newBooking: Booking = {
        id: Date.now(),
        room: bookingData.room!,
        start_time: bookingData.start_time || new Date().toISOString(),
        end_time: bookingData.end_time || new Date().toISOString(),
        purpose: bookingData.purpose || "General",
        status: "pending",
        user: user || undefined,
      };
      const updated = [...bookings, newBooking];
      setBookings(updated);
      saveBookingsToStorage(updated);
      return newBooking;
    } finally {
      setLoading(false);
    }
  };

  const updateBooking = async (
    id: number,
    bookingData: Partial<Booking>
  ): Promise<Booking> => {
    setLoading(true);
    try {
      const updatedBooking = { ...bookingData, id } as Booking;
      const updated = bookings.map((b) => (b.id === id ? updatedBooking : b));
      setBookings(updated);
      saveBookingsToStorage(updated);
      return updatedBooking;
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (id: number): Promise<void> => {
    setLoading(true);
    try {
      const updated = bookings.map((b) =>
        b.id === id ? { ...b, status: "cancelled" as BookingStatus } : b
      );
      setBookings(updated);
      saveBookingsToStorage(updated);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // LOCALSTORAGE
  // -------------------------
  const saveBookingsToStorage = (bookingsData: Booking[]): void => {
    localStorage.setItem("icpac_bookings", JSON.stringify(bookingsData));
  };

  const loadBookingsFromStorage = (): Booking[] | null => {
    const saved = localStorage.getItem("icpac_bookings");
    if (!saved) return null;
    const parsed: Booking[] = JSON.parse(saved);
    return parsed.map((b) => ({
      ...b,
      status: b.status as BookingStatus,
    }));
  };

  // -------------------------
  // INIT
  // -------------------------
  useEffect(() => {
    // Check for user in new format (from API) or old format (localStorage)
    const savedUser = localStorage.getItem("user") || localStorage.getItem("currentUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchRooms();
    fetchBookings();
  }, [fetchRooms, fetchBookings]);

  const value: AppContextType = {
    rooms,
    setRooms,
    bookings,
    setBookings,
    user,
    setUser,
    loading,
    pageLoading,
    setPageLoading,
    error,
    setError,
    login,
    register,
    logout,
    fetchRooms,
    fetchBookings,
    createBooking,
    updateBooking,
    cancelBooking,
    saveBookingsToStorage,
    loadBookingsFromStorage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
