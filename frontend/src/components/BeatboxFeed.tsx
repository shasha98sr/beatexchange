import React, { useState, useEffect } from 'react';
import { Mic, MoreHorizontal, MessageCircle, Share2, Heart, Repeat2, Medal } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { useAuth } from '../context/AuthContext';
import { beats } from '../services/api';
import RecordBeat from './RecordBeat';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Avatar,
  Stack,
  IconButton,
  Chip,
  Paper,
} from '@mui/material';

interface Post {
  id: string;
  title: string;
  description: string;
  audio_url: string;
  author: string;
  created_at: string;
  likes_count: number;
}

const BeatboxPost: React.FC<{ post: Post; onLike: (id: string) => void }> = ({ post, onLike }) => {
  const [isRecordingResponse, setIsRecordingResponse] = useState(false);
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count);

  const handleLike = async () => {
    if (!isAuthenticated) {
      // TODO: Show login prompt
      return;
    }
    try {
      await beats.like(Number(post.id));
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      onLike(post.id);
    } catch (error) {
      console.error('Error liking beat:', error);
    }
  };

  const handleComment = () => {
    if (!isAuthenticated) {
      // TODO: Show login prompt
      return;
    }
    // TODO: Open comment dialog
  };

  const handleRemix = () => {
    if (!isAuthenticated) {
      // TODO: Show login prompt
      return;
    }
    // TODO: Open remix dialog
  };

  return (
    <Card sx={{ 
      mb: 2, 
      borderRadius: 1,
      boxShadow: 'none',
      border: '1px solid #282828',
      backgroundColor: '#121212'
    }}>
      <CardContent>
        {/* Post Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Stack direction="row" spacing={2}>
            <Avatar alt={post.author} />
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#ffffff' }}>
                  {post.author}
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ color: '#b3b3b3' }}>
                {new Date(post.created_at).toLocaleString()}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small">
            <MoreHorizontal />
          </IconButton>
        </Box>

        {/* Caption */}
        {post.description && (
          <Typography variant="body1" sx={{ mb: 2, color: '#b3b3b3' }}>
            {post.description}
          </Typography>
        )}

        {/* Audio Player */}
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2,
            mb: 2,
            backgroundColor: '#181818',
            boxShadow: 'none',
            border: '1px solid #282828',
            borderRadius: 1
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: '#ffffff' }}>
            {post.title}
          </Typography>
          <AudioPlayer audioUrl={post.audio_url} />
        </Paper>

        {/* Action Buttons */}
        <Stack 
          direction="row" 
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<Heart />}
              size="small"
              color="primary"
              sx={{ color: isLiked ? 'error.main' : 'inherit' }}
              onClick={handleLike}
            >
              {likeCount}
            </Button>
            <Button
              startIcon={<MessageCircle />}
              size="small"
              onClick={handleComment}
            >
              0
            </Button>
            <Button
              startIcon={<Repeat2 />}
              size="small"
              onClick={handleRemix}
            >
              0
            </Button>
            <IconButton size="small">
              <Share2 />
            </IconButton>
          </Stack>

          <Button
            startIcon={<Mic />}
            variant={isRecordingResponse ? "contained" : "outlined"}
            color={isRecordingResponse ? "error" : "primary"}
            size="small"
            onClick={() => setIsRecordingResponse(!isRecordingResponse)}
          >
            {isRecordingResponse ? "Recording..." : "Record Response"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

const BeatboxFeed: React.FC = () => {
  const [activeTab, setActiveTab] = useState('forYou');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);

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

  const handleLike = async (postId: string) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return { ...post };
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
    <Container maxWidth="md">
      {isAuthenticated && (
        <>
          <Box sx={{ mb: 4 }}>
            {/* Record New Beat Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Mic />}
              onClick={() => setRecordDialogOpen(true)}
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

          <RecordBeat 
            open={recordDialogOpen} 
            onClose={() => setRecordDialogOpen(false)} 
            onUploadComplete={handleRecordComplete} 
          />
        </>
      )}

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
          <BeatboxPost key={post.id} post={post} onLike={handleLike} />
        ))}
      </Stack>
    </Container>
  );
};

export default BeatboxFeed;
