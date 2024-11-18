import React, { useState } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
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
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Register</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Register
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default Register;
