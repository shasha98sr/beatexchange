import React, { useState } from 'react';
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
import Navbar from './components/Navbar';
import './App.css';

function AppContent() {
  const { isAuthenticated, logout, login } = useAuth();
  const [mode, setMode] = useState<'light' | 'dark'>(localStorage.getItem('theme') === 'light' ? 'light' : 'dark');
  const [themeObj, setThemeObj] = useState(createTheme({
    palette: {
      mode: mode,
      primary: {
        main: '#1db954', // Spotify green
      },
    secondary: {
      main: '#b3b3b3', // Gray for secondary elements
    },
    background: {
      default: mode === 'light' ? '#ffffff' : '#121212',
      paper: mode === 'light' ? '#f5f5f5' : '#181818',
    },
    text: {
      primary: mode === 'light' ? '#000000' : '#ffffff',
      secondary: '#b3b3b3',
    },
    divider: mode === 'light' ? '#dadada' : '#282828',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#ffffff' : '#181818',
          borderBottom: mode === 'light' ? '1px solid #dadada' : '1px solid #282828',
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
          backgroundColor: mode === 'light' ? '#f5f5f5' : '#181818',
          borderRadius: 8,
        },
      },
    },
  },
}));
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme', newMode);
    setThemeObj(createTheme({
      ...themeObj,
      palette: {
        ...themeObj.palette,
        mode: newMode,
        background: {
          default: newMode === 'light' ? '#ffffff' : '#121212',
          paper: newMode === 'light' ? '#f5f5f5' : '#282828',
        },
        text: {
          primary: newMode === 'light' ? '#000000' : '#ffffff',
          secondary: '#b3b3b3',
        },
        divider: newMode === 'light' ? '#dadada' : '#282828',
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundColor: newMode === 'light' ? '#ffffff' : '#181818',
              borderBottom: newMode === 'light' ? '1px solid #dadada' : '1px solid #282828',
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
              backgroundColor: newMode === 'light' ? '#f5f5f5' : '#181818',
              borderRadius: 8,
            },
          },
        },
      },
    }));
  };

  const handleRegisterSuccess = async (username: string, password: string) => {
    try {
      await login(username, password);
    } catch (error) {
      console.error('Error logging in after registration:', error);
    }
  };

  return (
    <ThemeProvider theme={themeObj}>
      <CssBaseline />
      <Router>
        <Navbar 
          onToggleTheme={toggleTheme}
          onLoginClick={() => setLoginOpen(true)}
          onRegisterClick={() => setRegisterOpen(true)}
        />
        <Container maxWidth="lg">
          <Box sx={{ mt: 4, pb: 4 }}>
            <BeatboxFeed />
          </Box>
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
      </Router>
    </ThemeProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
