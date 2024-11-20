import React, { useState } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Typography,
} from '@mui/material';

interface LoginProps {
  open: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ open, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onLogin(email, password);
      onClose();
    } catch (error) {
      setError('Invalid email or password');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: '#181818',
          borderRadius: 2,
          border: '1px solid #282828',
        }
      }}
    >
      <DialogTitle sx={{ color: '#ffffff' }}>Login</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: '#b3b3b3', mb: 2 }}>
          Please enter your credentials to login.
        </DialogContentText>
        <form onSubmit={handleSubmit}>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#282828',
                },
                '&:hover fieldset': {
                  borderColor: '#404040',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1db954',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#b3b3b3',
              },
              '& .MuiOutlinedInput-input': {
                color: '#ffffff',
              },
            }}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
            helperText={error}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#282828',
                },
                '&:hover fieldset': {
                  borderColor: '#404040',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#1db954',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#b3b3b3',
              },
              '& .MuiOutlinedInput-input': {
                color: '#ffffff',
              },
              '& .MuiFormHelperText-root': {
                color: '#ff4444',
              },
            }}
          />
        </form>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: '#b3b3b3',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          form="login-form"
          variant="contained"
          sx={{
            backgroundColor: '#1db954',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#1ed760',
            }
          }}
        >
          Login
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Login;
