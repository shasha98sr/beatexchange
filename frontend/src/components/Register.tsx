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
import { auth } from '../services/api';

interface RegisterProps {
  open: boolean;
  onClose: () => void;
  onRegister: (username: string, password: string) => Promise<void>;
}

const Register: React.FC<RegisterProps> = ({ open, onClose, onRegister }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await auth.register(username, email, password);
      await onRegister(username, password);
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Registration failed');
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
      <DialogTitle sx={{ color: '#ffffff' }}>Register</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: '#b3b3b3', mb: 2 }}>
          Create a new account to start sharing your beats.
        </DialogContentText>
        <form id="register-form" onSubmit={handleSubmit}>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            type="text"
            fullWidth
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            }}
          />
        </form>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
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
          onClick={handleSubmit}
          variant="contained"
          sx={{
            backgroundColor: '#1db954',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#1ed760',
            }
          }}
        >
          Register
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Register;
