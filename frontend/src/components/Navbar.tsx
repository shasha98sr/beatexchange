import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Menu,
  MenuItem,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { FaSun, FaMoon } from 'react-icons/fa';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../context/AuthContext';
import Login from './Login';
import Register from './Register';
import { GoogleLogin } from '@react-oauth/google';

interface NavbarProps {
  onToggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleTheme }) => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { isAuthenticated, logout, login, googleLogin, user } = useAuth();

  const handleRegisterSuccess = async (username: string, password: string): Promise<void> => {
    try {
      await login(username, password);
      setRegisterOpen(false);
      setLoginOpen(true);
    } catch (error) {
      console.error('Error logging in after registration:', error);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      await googleLogin(credentialResponse);
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(error instanceof Error ? error.message : 'Google sign-in failed');
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in failed');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
          component={RouterLink}
          to="/"
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
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Tooltip title="Account">
                  <IconButton
                    onClick={handleMenuOpen}
                    aria-label="account"
                    aria-controls="account-menu"
                    aria-haspopup="true"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {user?.profile_photo ? (
                        <img
                          src={user.profile_photo}
                          alt="Profile"
                          referrerPolicy="no-referrer"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            marginRight: '8px',
                          }}
                        />
                      ) : (
                        <AccountCircle sx={{ width: 32, height: 32, marginRight: 1 }} />
                      )}
                      <Typography
                        variant="body1"
                        sx={{
                          marginLeft: 1,
                          color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
                        }}
                      >
                        {user?.username || 'User'}
                      </Typography>
                    </Box>
                  </IconButton>
                </Tooltip>
                <Menu
                  id="account-menu"
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  MenuListProps={{
                    'aria-labelledby': 'basic-button',
                  }}
                >
                  <MenuItem onClick={onToggleTheme}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {isDarkMode ? (
                        <FaSun style={{ color: '#ffd700', fontSize: '1.2rem', marginRight: '8px' }} />
                      ) : (
                        <FaMoon style={{ fontSize: '1.2rem', marginRight: '8px' }} />
                      )}
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </Box>
                  </MenuItem>
                  <MenuItem onClick={logout}>Logout</MenuItem>
                </Menu>
              </Box>

            </>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <GoogleLogin
                  theme={isDarkMode ? 'filled_black' : 'outline'}
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  context="signin"
                  type="standard"
                  cancel_on_tap_outside={false}
                />
                {error && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                    {error}
                  </Typography>
                )}
              </Box>
            </>
          )}

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
