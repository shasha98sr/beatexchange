import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  Button,
  Stack,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onToggleTheme: () => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleTheme, onLoginClick, onRegisterClick }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { isAuthenticated, logout } = useAuth();

  return (
    <AppBar position="static">
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
        
        <Stack direction="row" spacing={2} alignItems="center">
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
            <>
              <Button 
                color="primary"
                onClick={onLoginClick}
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
                onClick={onRegisterClick}
                sx={{ 
                  '&:hover': {
                    backgroundColor: 'rgba(29, 185, 84, 0.1)'
                  }
                }}
              >
                Register
              </Button>
            </>
          )}
          <IconButton
            onClick={onToggleTheme}
            color="inherit"
            sx={{
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
              },
            }}
          >
            {isDarkMode ? (
              <FaSun style={{ color: '#ffd700' }} />
            ) : (
              <FaMoon style={{ color: '#718096' }} />
            )}
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
