import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, CircularProgress, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useApp } from '../../context/AppContext';

interface LoginFormProps {
  onSuccess?: () => void;
}

interface FormData {
  email: string;
  password: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, loading, error } = useApp();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleDemoLogin = async () => {
    try {
      await login('admin@icpac.net', 'admin123');
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        py: 12,
        px: { xs: 2, sm: 3, lg: 4 },
      }}
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 480,
          width: '100%',
          p: 4,
          borderRadius: 2,
        }}
      >
        {/* Logo and Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Box
              component="img"
              src="/ICPAC_Website_Header_Logo.svg"
              alt="ICPAC Logo"
              sx={{
                height: 60,
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Sign in to your account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Access the ICPAC Boardroom Booking System
          </Typography>
        </Box>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Email Field */}
            <TextField
              id="email"
              name="email"
              label="Email Address"
              type="email"
              autoComplete="email"
              required
              fullWidth
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              variant="outlined"
            />

            {/* Password Field */}
            <TextField
              id="password"
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              fullWidth
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Buttons */}
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            <Button
              type="button"
              variant="outlined"
              size="large"
              fullWidth
              onClick={handleDemoLogin}
              disabled={loading}
            >
              Demo Login (admin@icpac.net)
            </Button>
          </Box>
        </form>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            ICPAC Boardroom Booking System v1.0
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm;
