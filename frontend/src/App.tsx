import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Stack,
} from '@mui/material';
import BeatboxFeed from './components/BeatboxFeed';
import RecordBeat from './components/RecordBeat';
import Login from './components/Login';
import Register from './components/Register';
import { AuthProvider, useAuth } from './context/AuthContext';
import * as beatService from './services/api';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1db954', // Spotify green
    },
    secondary: {
      main: '#b3b3b3', // Gray for secondary elements
    },
    background: {
      default: '#121212',
      paper: '#181818',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
    divider: '#282828',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#181818',
          borderBottom: '1px solid #282828',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#181818',
          borderRadius: 8,
        },
      },
    },
  },
});

const AppContent = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const { isAuthenticated, logout, login } = useAuth();

  const handleRegisterSuccess = async (username: string, password: string) => {
    try {
      await login(username, password);
    } catch (error) {
      console.error('Error logging in after registration:', error);
    }
  };

  return (
    <Box className="min-h-screen" sx={{ backgroundColor: '#121212' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              color: '#1db954',
              fontWeight: 'bold'
            }}
          >
            BeatExchange
          </Typography>
          {isAuthenticated ? (
            <Button 
              color="primary"
              onClick={logout}
              sx={{ 
                '&:hover': {
                  backgroundColor: 'rgba(29, 185, 84, 0.1)'
                }
              }}
            >
              Logout
            </Button>
          ) : (
            <Stack direction="row" spacing={2}>
              <Button 
                color="primary"
                onClick={() => setLoginOpen(true)}
                sx={{ 
                  '&:hover': {
                    backgroundColor: 'rgba(29, 185, 84, 0.1)'
                  }
                }}
              >
                Login
              </Button>
              <Button 
                color="primary"
                onClick={() => setRegisterOpen(true)}
                sx={{ 
                  '&:hover': {
                    backgroundColor: 'rgba(29, 185, 84, 0.1)'
                  }
                }}
              >
                Register
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, pb: 4 }}>
        <BeatboxFeed />
      </Container>

      <Login 
        open={loginOpen} 
        onClose={() => setLoginOpen(false)} 
        onLogin={login} 
      />
      <Register
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegister={handleRegisterSuccess}
      />
    </Box>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
