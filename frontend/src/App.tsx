import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AppProvider, useApp } from './context/AppContext';
import BookingBoard from './pages/BookingBoard';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProcurementPage from './pages/ProcurementPage';
import PageLoadingSpinner from './components/common/PageLoadingSpinner';
import { ReactNode, useEffect } from 'react';

// Create MUI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// Protected Route Component - redirects to login if not authenticated
interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useApp();
  const token = localStorage.getItem('access_token');
  
  // Development bypass - set this to true to skip authentication
  const DEV_BYPASS_AUTH = true;

  if (!DEV_BYPASS_AUTH && !user && !token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirects if authenticated)
interface PublicRouteProps {
  children: ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user } = useApp();
  const token = localStorage.getItem('access_token');
  
  // Development bypass - set this to true to skip authentication
  const DEV_BYPASS_AUTH = true;

  if (!DEV_BYPASS_AUTH && (user || token)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Main App Content
const AppContent: React.FC = () => {
  const { pageLoading, setPageLoading } = useApp();
  const location = useLocation();

  useEffect(() => {
    // Show loading spinner when location changes
    setPageLoading(true);

    // Hide spinner after a short delay to allow page to load
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 800);

    return () => {
      clearTimeout(timer);
      setPageLoading(false);
    };
  }, [location.pathname, setPageLoading]);

  return (
    <div className="App min-h-screen bg-gray-50 flex flex-col">
      <PageLoadingSpinner open={pageLoading} />
      <main className="flex-1">
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <BookingBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/procurement"
            element={
              <ProtectedRoute>
                <ProcurementPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <Router>
          <AppContent />
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
