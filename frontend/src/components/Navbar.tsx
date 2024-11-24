import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
  IconButton,
  useTheme,
  Box,
  Tooltip,
  Container,
  Link,
} from '@mui/material';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import Register from './Register';

interface NavbarProps {
  onToggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleTheme }) => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { isAuthenticated, logout, login } = useAuth();

  const handleRegisterSuccess = async (username: string, password: string): Promise<void> => {
    try {
      await login(username, password);
      setRegisterOpen(false);
      setLoginOpen(true);
    } catch (error) {
      console.error('Error logging in after registration:', error);
    }
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
        boxShadow: 'none',
        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography 
          variant="h6" 
          component="div" 
          className="gradient-text"
          sx={{ 
            fontWeight: 'bold',
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
          }}
        >
          Spit.box
        </Typography>
        
        <Stack 
          direction="row" 
          spacing={{ xs: 1, sm: 2 }} 
          alignItems="center"
        >
          {isAuthenticated ? (
            <Button 
              color="inherit"
              onClick={logout}
              sx={{ 
                display: { xs: 'none', sm: 'flex' },
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
                },
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                transition: 'color 0.3s ease, background-color 0.3s ease'
              }}
            >
              Logout
            </Button>
          ) : (
            <>
              <Button 
                color="inherit"
                onClick={() => setLoginOpen(true)}
                sx={{ 
                  display: { xs: 'none', sm: 'flex' },
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
                  },
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                  transition: 'color 0.3s ease, background-color 0.3s ease'
                }}
              >
                Login
              </Button>
              <Button 
                color="inherit"
                onClick={() => setRegisterOpen(true)}
                sx={{ 
                  display: { xs: 'none', sm: 'flex' },
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
                  },
                  color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                  transition: 'color 0.3s ease, background-color 0.3s ease'
                }}
              >
                Register
              </Button>
            </>
          )}
          
          <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
            <IconButton
              onClick={onToggleTheme}
              sx={{
                p: { xs: 1, sm: 1.5 },
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                transition: 'color 0.3s ease',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  transform: 'scale(1.1)',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.1)',
                },
                '@media (prefers-reduced-motion: reduce)': {
                  transition: 'none',
                  '&:hover': {
                    transform: 'none',
                  },
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  animation: 'fadeIn 0.3s ease-in-out',
                  '@keyframes fadeIn': {
                    '0%': {
                      opacity: 0,
                      transform: 'rotate(-45deg)',
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'rotate(0)',
                    },
                  },
                }}
              >
                {isDarkMode ? (
                  <FaSun style={{ color: '#ffd700', fontSize: '1.2rem' }} />
                ) : (
                  <FaMoon style={{ color: '#718096', fontSize: '1.2rem' }} />
                )}
              </Box>
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>

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
    </AppBar>
  );
};

export default Navbar;
