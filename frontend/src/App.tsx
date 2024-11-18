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
  CircularProgress,
  Stack,
} from '@mui/material';
import BeatCard from './components/BeatCard';
import RecordBeat from './components/RecordBeat';
import Login from './components/Login';
import Register from './components/Register';
import { AuthProvider, useAuth } from './context/AuthContext';
import * as beatService from './services/api';

interface Beat {
  id: number;
  title: string;
  description: string;
  audio_url: string;
  author: string;
  created_at: string;
  likes_count: number;
}

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const AppContent = () => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const { isAuthenticated, logout, login } = useAuth();

  const loadBeats = async () => {
    try {
      const data = await beatService.beats.getAll();
      setBeats(data);
    } catch (error) {
      console.error('Error loading beats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeats();
  }, []);

  const handleLike = async (beatId: number) => {
    try {
      await beatService.beats.like(beatId);
      loadBeats();
    } catch (error) {
      console.error('Error liking beat:', error);
    }
  };

  const handleRegisterSuccess = async (username: string, password: string) => {
    try {
      await login(username, password);
    } catch (error) {
      console.error('Error logging in after registration:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BeatExchange
          </Typography>
          {isAuthenticated ? (
            <Button color="inherit" onClick={logout}>
              Logout
            </Button>
          ) : (
            <Stack direction="row" spacing={2}>
              <Button color="inherit" onClick={() => setLoginOpen(true)}>
                Login
              </Button>
              <Button color="inherit" onClick={() => setRegisterOpen(true)}>
                Register
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Routes>
          <Route
            path="/"
            element={
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {loading ? (
                  <CircularProgress sx={{ mt: 4 }} />
                ) : (
                  beats.map((beat) => (
                    <BeatCard
                      key={beat.id}
                      beat={beat}
                      onLike={handleLike}
                      isLiked={false}
                    />
                  ))
                )}
              </Box>
            }
          />
        </Routes>
      </Container>

      {isAuthenticated && <RecordBeat onUploadComplete={loadBeats} />}
      <Login open={loginOpen} onClose={() => setLoginOpen(false)} />
      <Register
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => {
          setLoginOpen(true);
        }}
      />
    </Box>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
