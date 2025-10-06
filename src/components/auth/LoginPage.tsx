import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, IconButton, InputAdornment, LinearProgress, Paper, Container, Link } from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle, Cancel } from '@mui/icons-material';
import { useApp } from '../../context/AppContext';

// Import background images
import ConferenceRoom from '../../assets/imgs/ConferenceRoom.jpg';
import Lab1 from '../../assets/imgs/Lab1.jpg';
import Lab2 from '../../assets/imgs/Lab2.jpg';
import MainBoardroom from '../../assets/imgs/MainBoardroom.jpg';
import SmallBoardroom from '../../assets/imgs/SmallBoardroom.jpg';

type AuthMode = 'login' | 'signup' | 'forgot' | 'verify';

interface SignupData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface PasswordStrength {
  strength: 'weak' | 'fair' | 'good' | 'strong';
  color: string;
  message: string;
  score: number;
}

// Background images array
const backgroundImages = [
  ConferenceRoom,
  Lab1,
  Lab2,
  MainBoardroom,
  SmallBoardroom
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useApp();

  const [mode, setMode] = useState<AuthMode>('login');
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Login state
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Signup state
  const [signupData, setSignupData] = useState<SignupData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Password visibility state
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState<string>('');

  // OTP verification state
  const [otpCode, setOtpCode] = useState<string>('');
  const [verifyEmail] = useState<string>('');

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Background image rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Utility function to validate email domain
  const isValidEmailDomain = (email: string): boolean => {
  const allowedDomains = ['@icpac.net', '@igad.int'];
  return allowedDomains.some((domain) => email.endsWith(domain));
    };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isValidEmailDomain(email)) {
        setError('Only emails with @icpac.net or @igad.int domains are allowed.');
        return;
      }

      const DEV_MODE = true; 

      if (DEV_MODE) {
        const users = JSON.parse(localStorage.getItem("users") || "[]");

        const user = users.find(
          (u: any) => u.email === email && u.password === password
        );

        if (user) {
          localStorage.setItem("currentUser", JSON.stringify(user));
          localStorage.setItem("isLoggedIn", "true");
          setTimeout(() => navigate("/"), 500);
        } else {
          setError("Invalid email or password");
        }
      } else {
        await login(email, password); 
        navigate("/");
      }
    } catch (err: any) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isValidEmailDomain(signupData.email)) {
      setError('Only emails with @icpac.net or @igad.int domains are allowed.');
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const strength = getPasswordStrength(signupData.password);
    if (strength.strength === "weak") {
      setError("Password is too weak.");
      return;
    }

    setLoading(true);

    try {
      const DEV_MODE = true;

      if (DEV_MODE) {
        let users = JSON.parse(localStorage.getItem("users") || "[]");

        if (users.some((u: any) => u.email === signupData.email)) {
          setError("User already exists");
          return;
        }

        users.push({
          name: signupData.name,
          email: signupData.email,
          password: signupData.password,
        });

        localStorage.setItem("users", JSON.stringify(users));

        setSuccess("Account created successfully! You can now sign in.");
        setTimeout(() => setMode("login"), 1500);
      }
    } catch (err: any) {
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const DEV_MODE = true;

      if (DEV_MODE) {
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        const user = users.find((u: any) => u.email === forgotEmail);

        if (user) {
          setSuccess("A reset link (simulated) has been sent to your email.");
          setTimeout(() => {
            setMode("login");
            setForgotEmail("");
          }, 2000);
        } else {
          setError("No account found with that email.");
        }
      }
    } catch (err) {
      setError("Failed to process reset request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const DEV_MODE = true;

      if (DEV_MODE) {
        if (otpCode === "123456") {
          setSuccess("Email verified successfully! You can now sign in.");
          setTimeout(() => {
            setMode("login");
            setEmail(verifyEmail);
            setOtpCode("");
          }, 2000);
        } else {
          setError("Invalid verification code.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const DEV_MODE = true;

      if (DEV_MODE) {
        setSuccess("A new code has been 'sent' to your email. Use 123456 to verify.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value
    });
  };

  // Password strength checker
  const getPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    Object.values(checks).forEach(check => {
      if (check) score++;
    });

    if (score <= 2) return { strength: 'weak', color: '#ef4444', message: 'Weak password', score };
    if (score <= 3) return { strength: 'fair', color: '#f59e0b', message: 'Fair password', score };
    if (score <= 4) return { strength: 'good', color: '#10b981', message: 'Good password', score };
    return { strength: 'strong', color: '#059669', message: 'Strong password', score };
  };

  const passwordsMatch = signupData.password && signupData.confirmPassword &&
    signupData.password === signupData.confirmPassword;

  const passwordStrength = getPasswordStrength(signupData.password);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
      }}
    >
      {/* Background Image Slideshow */}
    {backgroundImages.map((image, index) => (
      <Box
        key={index}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: currentImageIndex === index ? 1 : 0,
          transition: 'opacity 1.5s ease-in-out',
          animation: currentImageIndex === index ? 'zoomIn 4s ease-out forwards' : 'none',
          '@keyframes zoomIn': {
            '0%': {
              transform: 'scale(1)',
            },
            '100%': {
              transform: 'scale(1.2)',
            },
          },
        }}
      />
    ))}

        {/* Dark Overlay */}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Adjusted for better contrast
        zIndex: 1,
      }}
    />

    {/* Form Section */}
    <Container
      maxWidth="lg"
      sx={{ position: 'relative', zIndex: 2 }}
    >
      <Paper
        elevation={8}
        sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' },
          overflow: 'hidden',
          borderRadius: 2,
          width: {xs: '100%', md: '90%'},
          maxWidth: '1200px',
          height: { xs: 'auto', md: '600px' },
        }}
        >
          {/* Branding Side */}
          <Box
            sx={{
              flex: 2.5,
              bgcolor: '#2E7D32',
              color: 'white',
              p: {xs: 6, md: 8},
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Box
              component="img"
              src="/ICPAC_Website_Header_Logo.svg"
              alt="ICPAC Logo"
              sx={{ width: 250, mb: 3 }}
            />
            <Typography variant="h5" fontWeight={600} gutterBottom>
              ICPAC INTERNAL BOOKING SYSTEM
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage rooms and meeting space
            </Typography>
          </Box>

          {/* Form Section */}
          <Box
            sx={{
              flex: 6,
              p: { xs: 6, md: 10 },
              bgcolor: 'background.paper', overflowY: 'auto',
            }}
          >
            {/* LOGIN MODE */}
            {mode === 'login' && (
              <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#044E36',
                height: '100%',
              }}
              >
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Sign in
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Enter your credentials to continue
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Box component="form" onSubmit={handleLogin} sx={{ width: '100%', maxWidth: 400 }}>
                  <TextField
                    fullWidth
                    placeholder="Email Address*"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    placeholder="Password*"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    sx={{ mb: 1 }}
                  />

                  <Box sx={{ textAlign: 'right', mb: 2 }}>
                    <Link
                      component="button"
                      type="button"
                      variant="body2"
                      onClick={() => switchMode('forgot')}
                      sx={{ cursor: 'pointer', color: '#044E36' }}
                    >
                      Forgot Password?
                    </Link>
                  </Box>

                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ mb: 2, bgcolor: '#044E36', '&:hover': { backgroundColor: '#1B5E20' } }}
                  >
                    {loading ? 'Signing in...' : 'SIGN IN'}
                  </Button>
                </Box>

                <Typography variant="body2" align="center" color="text.secondary">
                  Don't have an account?{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => switchMode('signup')}
                    sx={{ cursor: 'pointer' , color: '#2E7D32'}}
                  >
                    Sign up
                  </Link>
                </Typography>
              </Box>
            )}

            {/* SIGNUP MODE */}
            {mode === 'signup' && (
              <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#044E36', 
                height: '100%', 
              }}
              >
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Create Account
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Fill in your details to get started
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Box component="form" onSubmit={handleSignup} sx={{ width: '100%', maxWidth: 400 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={signupData.name}
                    onChange={handleSignupChange}
                    required
                    autoComplete="name"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    required
                    autoComplete="email"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={signupData.password}
                    onChange={handleSignupChange}
                    required
                    autoComplete="new-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 1 }}
                  />

                  {signupData.password && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(passwordStrength.score / 5) * 100}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          '& .MuiLinearProgress-bar': {
                            bgcolor: passwordStrength.color,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: passwordStrength.color, display: 'block', mt: 0.5 }}
                      >
                        {passwordStrength.message}
                      </Typography>
                    </Box>
                  )}

                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={signupData.confirmPassword}
                    onChange={handleSignupChange}
                    required
                    autoComplete="new-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 1 }}
                  />

                  {signupData.confirmPassword && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {passwordsMatch ? (
                        <>
                          <CheckCircle sx={{ color: 'success.main', fontSize: 18, mr: 1 }} />
                          <Typography variant="caption" color="success.main">
                            Passwords match
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Cancel sx={{ color: 'error.main', fontSize: 18, mr: 1 }} />
                          <Typography variant="caption" color="error.main">
                            Passwords don't match
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}

                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ mb: 2 , bgcolor: '#044E36', '&:hover': { backgroundColor: '#1B5E20' }}}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </Box>

                <Typography variant="body2" align="center" color="text.secondary">
                  Already have an account?{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => switchMode('login')}
                    sx={{ cursor: 'pointer' , color: '#044E36'}}
                  >
                    Sign in here
                  </Link>
                </Typography>
              </Box>
            )}

            {/* FORGOT PASSWORD MODE */}
            {mode === 'forgot' && (
              <Box>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Forgot Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 , color: '#044E36'}}>
                  Enter your email to receive reset instructions
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 , color: '#044E36'}}>{success}</Alert>}

                <Box component="form" onSubmit={handleForgotPassword}>
                  <TextField
                    fullWidth
                    label="Email Address*"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoComplete="email"
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => switchMode('login')}
                    >
                      Back to Login
                    </Button>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      disabled={loading}
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </Box>
                </Box>

                <Typography variant="body2" align="center" color="text.secondary">
                  Remember your password?{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => switchMode('login')}
                    sx={{ cursor: 'pointer' , color: '#044E36' }}
                  >
                    Sign in here
                  </Link>
                </Typography>
              </Box>
            )}

            {/* VERIFY OTP MODE */}
            {mode === 'verify' && (
              <Box>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Verify Email
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Enter the verification code sent to {verifyEmail}
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                <Box component="form" onSubmit={handleVerifyOTP}>
                  <TextField
                    fullWidth
                    label="Verification Code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleResendOTP}
                      disabled={loading}
                    >
                      Resend Code
                    </Button>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      disabled={loading}
                    >
                      {loading ? 'Verifying...' : 'Verify'}
                    </Button>
                  </Box>
                </Box>

                <Typography variant="body2" align="center" color="text.secondary">
                  Already verified?{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => switchMode('login')}
                    sx={{ cursor: 'pointer' }}
                  >
                    Sign in here
                  </Link>
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
