import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Button,
} from '@mui/material';
import {
  Home as HomeIcon,
  Mic as MicIcon,
  MoreHoriz as MoreIcon,
  Logout as LogoutIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import RecordBeat from './RecordBeat';

interface SidebarProps {
  onToggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggleTheme }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [showRecordDialog, setShowRecordDialog] = React.useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleMenuClose();
  };

  const handleRecordComplete = () => {
    setShowRecordDialog(false);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            fontWeight: 'bold',
            textDecoration: 'none',
            color: theme.palette.primary.main,
          }}
        >
          Spit.box
        </Typography>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flex: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/feed"
            sx={{ borderRadius: 28 }}
          >
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            component={Link}
            to="/profile"
            sx={{ borderRadius: 28 }}
          >
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="My Bars" />
          </ListItemButton>
        </ListItem>

        {/* Post Button */}
        <ListItem sx={{ mt: 2 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<MicIcon />}
            onClick={() => setShowRecordDialog(true)}
            sx={{
              borderRadius: 28,
              py: 1.5,
              textTransform: 'none',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              bgcolor: 'primary.main',
              color: '#fff',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            Post
          </Button>
        </ListItem>
      </List>

      {/* User Profile Section */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 1,
            borderRadius: 2,
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Avatar
            src={user?.profile_photo || undefined}
            alt={user?.username}
          >
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {user?.username}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleMenuClick}
            aria-label="user menu"
          >
            <MoreIcon />
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={onToggleTheme}>
            {theme.palette.mode === 'dark' ? (
              <>
                <LightModeIcon sx={{ mr: 1 }} />
                Light Mode
              </>
            ) : (
              <>
                <DarkModeIcon sx={{ mr: 1 }} />
                Dark Mode
              </>
            )}
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </Box>

      {/* Record Beat Dialog */}
      <RecordBeat
        open={showRecordDialog}
        onClose={() => setShowRecordDialog(false)}
        onUploadComplete={handleRecordComplete}
      />
    </Box>
  );
};

export default Sidebar;
