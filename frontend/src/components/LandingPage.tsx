import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  useTheme,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, googleLogin } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      await googleLogin(credentialResponse);
      navigate('/feed');
    } catch (error) {
      setError('Google sign-in failed');
    }
  };
  
  const handleGoogleError = () => {
    setError('Google sign-in failed');
  };

  const handleGetStarted = () => {
    navigate('/feed');
  };

  return (
    <Box maxWidth="md" sx={{ 
      mx: 'auto', 
      p: 2,
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      mb: 4,
      color: theme.palette.text.primary,
      transition: 'color 0.3s ease'
    }}>
      {/* Hero Section */}
      <Box sx={{ 
        p: 4, 
        maxWidth: 800,
        color: theme.palette.text.primary
      }}>
        <Typography 
          variant="h1" 
          component="h1" 
          sx={{ 
            fontSize: { xs: '3.5rem', md: '5rem' },
            fontWeight: 700,
            lineHeight: 1,
            mb: 1,
            '& .green-text': {
              display: 'block',
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 20%, #2E7D32 40%, #1B5E20 60%, #45a049 80%, #4CAF50 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              animation: 'gradient 3s ease infinite',
              mb: 0.5
            },
            '& .white-text': {
              display: 'block',
              color: theme.palette.text.primary,
              fontSize: { xs: '3.5rem', md: '5rem' },
              mb: 0.5
            },
            '@keyframes gradient': {
              '0%': {
                backgroundPosition: '0% 50%'
              },
              '50%': {
                backgroundPosition: '100% 50%'
              },
              '100%': {
                backgroundPosition: '0% 50%'
              }
            }
          }}
        >
          <span className="green-text">Your beats,</span>
          <span className="white-text">your stage,</span>
          <span className="white-text">no limits.</span>
        </Typography>
        <Typography 
          sx={{ 
            fontSize: '1.25rem',
            my: 4,
            opacity: 0.9,
            maxWidth: 600,
            mx: 'auto',
            color: theme.palette.text.secondary
          }}
        >
          Spit.box is like Twitter, but for beatboxers. Drop your routines, share your sound, and skip the noise.
        </Typography>

        {/* Call to Action */}
        {isAuthenticated ? (
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            sx={{ 
              mt: 4,
              borderRadius: 2,
              py: 2,
              px: 3,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              color: theme.palette.text.primary,
              textTransform: 'none',
              fontSize: '1.1rem',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.15)',
              }
            }}
          >
            Go to Feed
          </Button>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2, alignItems: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LandingPage;
