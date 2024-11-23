import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  IconButton,
  Avatar,
  Button,
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
    <Box maxWidth="md" sx={{ mx: 'auto', p: 2 }}>
      {/* Record New Beat Button */}
      <Box sx={{ mb: 4 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<MicIcon />}
          onClick={() => setShowRecordDialog(true)} // Open RecordBeat dialog
          sx={{ 
            borderRadius: 8,
            py: 1.5,
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            }
          }}
        >
          Drop a Beat
        </Button>
      </Box>

      {/* Record Beat Dialog */}
      <RecordBeat
        open={showRecordDialog}
        onClose={() => setShowRecordDialog(false)}
        onUploadComplete={handleRecordComplete}
      />

      {/* Feed Tabs */}
      <Stack 
        direction="row" 
        spacing={2} 
        sx={{ 
          mb: 4,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        {['forYou', 'battles', 'following'].map((tab) => (
          <Button
            key={tab}
            color="inherit"
            sx={{
              px: 2,
              py: 1,
              minWidth: 100,
              color: activeTab === tab ? 'primary.main' : 'text.secondary',
              borderBottom: 2,
              borderColor: activeTab === tab ? 'primary.main' : 'transparent',
              '&:hover': {
                bgcolor: 'transparent',
                color: 'text.primary'
              }
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </Stack>

      <Stack spacing={2}>
        {posts.map((post) => (
          <BeatCard key={post.id} beat={post} onLike={handleLike} />
        ))}
      </Stack>
    </Box>
  );
};

export default BeatboxFeed;
