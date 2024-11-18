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
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Login</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          <Button type="submit" variant="contained">
            Login
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default Login;
