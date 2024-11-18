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
    mode: 'light',
    primary: {
      main: '#f97316', // orange-500
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
    <Box className="min-h-screen bg-gray-50">
      <AppBar position="static" sx={{ backgroundColor: 'white', boxShadow: 1 }}>
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              color: theme.palette.primary.main,
              fontWeight: 'bold'
            }}
          >
            BeatExchange
          </Typography>
          {isAuthenticated ? (
            <Button 
              color="inherit" 
              onClick={logout}
              sx={{ color: 'text.primary' }}
            >
              Logout
            </Button>
          ) : (
            <Stack direction="row" spacing={2}>
              <Button 
                color="inherit" 
                onClick={() => setLoginOpen(true)}
                sx={{ color: 'text.primary' }}
              >
                Login
              </Button>
              <Button 
                color="inherit" 
                onClick={() => setRegisterOpen(true)}
                sx={{ color: 'text.primary' }}
              >
                Register
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
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
