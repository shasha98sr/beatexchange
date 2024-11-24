import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  IconButton,
  Avatar,
  Button,
  useTheme
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Comment as CommentIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon,
  Mic as MicIcon,
  Repeat as RepeatIcon
} from '@mui/icons-material';
import AudioPlayer from './AudioPlayer';
import RecordBeat from './RecordBeat'; // Import RecordBeat component
import BeatCard from './BeatCard';
import { beats } from '../services/api';

interface Post {
  id: number;
  title: string;
  audio_url: string;
  author: string;
  created_at: string;
  likes_count: number;
  liked_by_user: boolean;
}

const BeatboxFeed: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('forYou');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecordDialog, setShowRecordDialog] = useState(false); // Add state for RecordBeat dialog

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await beats.getAll();
      setPosts(response); // The response is directly the array of beats
    } catch (error) {
      console.error('Error fetching beats:', error);
      setError('Failed to load beats. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return { ...post, liked_by_user: !post.liked_by_user, likes_count: post.likes_count + (post.liked_by_user ? -1 : 1) };
      }
      return post;
    });
    setPosts(updatedPosts);
  };

  const handleRecordComplete = () => {
    fetchPosts(); // Refresh the feed after new beat is uploaded
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box maxWidth="md" sx={{ 
        mx: 'auto', 
        p: 2,
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        mb: 4,
        color: theme.palette.text.primary,
        transition: 'color 0.3s ease'
      }}>
      {/* Hero Section */}
      <Box sx={{ 
        p: 4, 
        maxWidth: 800,
        color: theme.palette.text.primary
      }}>
        <Typography 
          variant="h1" 
          component="h1" 
          sx={{ 
            fontSize: { xs: '3.5rem', md: '5rem' },
            fontWeight: 700,
            lineHeight: 1,
            mb: 1,
            '& .green-text': {
              display: 'block',
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 20%, #2E7D32 40%, #1B5E20 60%, #45a049 80%, #4CAF50 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              animation: 'gradient 3s ease infinite',
              mb: 0.5
            },
            '& .white-text': {
              display: 'block',
              color: theme.palette.text.primary,
              fontSize: { xs: '3.5rem', md: '5rem' },
              mb: 0.5
            },
            '@keyframes gradient': {
              '0%': {
                backgroundPosition: '0% 50%'
              },
              '50%': {
                backgroundPosition: '100% 50%'
              },
              '100%': {
                backgroundPosition: '0% 50%'
              }
            }
          }}
        >
          <span className="green-text">Your beats,</span>
          <span className="white-text">your space,</span>
          <span className="white-text">no limits.</span>
        </Typography>
        <Typography 
          sx={{ 
            fontSize: '1.25rem',
            my: 4,
            opacity: 0.9,
            maxWidth: 600,
            mx: 'auto',
            color: theme.palette.text.secondary
          }}
        >
          Spit.box is like Twitter, but for beatboxers. Drop your routines, share your sound, and skip the noise.
        </Typography>

        {/* Record New Beat Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<MicIcon />}
          onClick={() => setShowRecordDialog(true)}
          sx={{ 
            mt: 4,
            borderRadius: 2,
            py: 2,
            px: 3,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            color: theme.palette.text.primary,
            textTransform: 'none',
            fontSize: '1.1rem',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.15)',
            }
          }}
        >
          Drop a Beat
        </Button>
      </Box>

      {/* RecordBeat Dialog */}
      <RecordBeat
        open={showRecordDialog}
        onClose={() => setShowRecordDialog(false)}
        onUploadComplete={handleRecordComplete}
      />

      {/* Feed Content */}
      <Stack spacing={2} sx={{ width: '100%', mt: 6, color: theme.palette.text.primary }}>
        {posts.map((post) => (
          <BeatCard key={post.id} beat={post} onLike={handleLike} />
        ))}
      </Stack>
    </Box>
  );
};

export default BeatboxFeed;
