import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Container,
  Box,
} from '@mui/material';
import BeatboxFeed from './components/BeatboxFeed';
import RecordPage from './components/RecordPage';
import LandingPage from './components/LandingPage';
import Profile from './components/Profile';
import { AuthProvider, useAuth } from './context/AuthContext';
import * as beatService from './services/api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import './App.css';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<'light' | 'dark'>(
    localStorage.getItem('theme') === 'light' ? 'light' : 'dark'
  );

  const createAppTheme = useCallback((mode: 'light' | 'dark') => {
    return createTheme({
      palette: {
        mode,
        primary: {
          main: mode === 'light' ? '#2E7D32' : '#4CAF50',
          light: mode === 'light' ? '#4CAF50' : '#45a049',
          dark: mode === 'light' ? '#1B5E20' : '#2E7D32',
        },
        secondary: {
          main: mode === 'light' ? '#45a049' : '#45a049',
          light: mode === 'light' ? '#b3b3b3' : '#b3b3b3',
          dark: mode === 'light' ? '#1B5E20' : '#1B5E20',
          

        },
        background: {
          default: mode === 'light' ? '#ffffff' : '#000000',
          paper: mode === 'light' ? '#f5f5f5' : '#121212',
        },
        text: {
          primary: mode === 'light' ? '#000000' : '#ffffff',
          secondary: mode === 'light' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        },
        divider: mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)',
      },
      typography: {
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      components: {
        MuiAppBar: {
          styleOverrides: {
            root: {
              background: mode === 'light'
                ? '#ffffff'
                : '#000000',
              borderBottom: `1px solid ${mode === 'light' 
                ? 'rgba(0, 0, 0, 0.12)' 
                : 'rgba(255, 255, 255, 0.12)'}`,
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
            },
            contained: {
              backgroundColor: mode === 'light' 
                ? 'rgba(0, 0, 0, 0.05)'
                : 'rgba(255, 255, 255, 0.1)',
              color: mode === 'light' ? '#000000' : '#ffffff',
              '&:hover': {
                backgroundColor: mode === 'light'
                  ? 'rgba(0, 0, 0, 0.1)'
                  : 'rgba(255, 255, 255, 0.15)',
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundColor: mode === 'light'
                ? 'rgba(0, 0, 0, 0.02)'
                : 'rgba(255, 255, 255, 0.05)',
              borderRadius: 8,
              backdropFilter: 'blur(10px)',
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              background: mode === 'light'
                ? '#ffffff'
                : '#000000',
              borderRadius: 16,
            },
          },
        },
      },
    });
  }, []);

  const [themeObj, setThemeObj] = useState(createAppTheme(mode));

  const toggleTheme = useCallback(() => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    setThemeObj(createAppTheme(newMode));
    localStorage.setItem('theme', newMode);
    document.documentElement.setAttribute('data-theme', newMode);
  }, [mode, createAppTheme]);

  return (
    <ThemeProvider theme={themeObj}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex',
          minHeight: '100vh',
          position: 'relative',
        }}>
          {/* Left Sidebar */}
          <Box
            sx={{
              width: 275,
              position: 'sticky',
              top: 0,
              height: '100vh',
              borderRight: 1,
              borderColor: 'divider',
              display: { xs: 'none', md: 'block' },
            }}
          >
            <Sidebar onToggleTheme={toggleTheme} />
          </Box>

          {/* Main Content */}
          <Box sx={{ flex: 1, ml: { md: 2 }, mt: 4, pb: 4 }}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/feed" element={<BeatboxFeed />} />
              <Route path="/record" element={<RecordPage />} />
              <Route path="/:username" element={<Profile />} />
            </Routes>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
