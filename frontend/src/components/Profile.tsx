import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Container,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { beats as beatsService } from '../services/api';
import { Beat } from '../types';
import BeatCard from './BeatCard';

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [userBeats, setUserBeats] = useState<Beat[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<{ username: string; profile_photo?: string | null } | null>(null);

  const handleLike = async (beatId: number) => {
    try {
      const updatedBeat = await beatsService.like(beatId);
      const updatedBeats = userBeats.map(beat =>
        beat.id === beatId ? updatedBeat : beat
      );
      setUserBeats(updatedBeats);
    } catch (error) {
      console.error('Error liking beat:', error);
    }
  };

  const handleCommentAdd = (beatId: number, newComment: any) => {
    setCommentsMap(prev => ({
      ...prev,
      [beatId]: [...(prev[beatId] || []), newComment]
    }));
  };

  useEffect(() => {
    const fetchUserBeatsAndComments = async () => {
      if (!username) {
        setError('User not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching beats for username:', username);
        const response = await beatsService.getUserBeats(username);
        console.log('API Response:', response);
        setUserBeats(response);
        
        // Fetch comments for all beats
        const commentsData: Record<number, any[]> = {};
        await Promise.all(
          response.map(async (beat) => {
            const comments = await beatsService.getComments(beat.id);
            commentsData[beat.id] = comments.map((comment: any) => ({
              id: comment.id,
              text: comment.content,
              timestamp: comment.timestamp,
              username: comment.username,
              created_at: comment.created_at
            }));
          })
        );
        setCommentsMap(commentsData);
        
        // Set profile user info
        const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
        setProfileUser({
          username: cleanUsername,
          profile_photo: response.length > 0 ? response[0].author_photo : null,
        });
      } catch (error: any) {
        console.error('Error fetching user beats:', error);
        console.error('Error response:', error.response);
        setError(error.response?.data?.message || 'Could not find this user or their beats');
        setUserBeats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBeatsAndComments();
  }, [username]);

  if (!username) {
    return <Navigate to="/feed" />;
  }

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box mt={4}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box mt={4}>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              src={profileUser?.profile_photo || undefined}
              sx={{ width: 100, height: 100 }}
            >
              {profileUser?.username.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1">
                @{profileUser?.username}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {userBeats.length} {userBeats.length === 1 ? 'Beat' : 'Beats'}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {userBeats.length > 0 ? (
          <Box>
            {userBeats.map((beat) => (
              <BeatCard 
                key={beat.id} 
                beat={beat} 
                comments={commentsMap[beat.id] || []}
                onLike={() => handleLike(beat.id)}
                onCommentAdd={handleCommentAdd}
              />
            ))}
          </Box>
        ) : (
          <Box textAlign="center" mt={4}>
            <Typography variant="body1" color="text.secondary">
              No beats shared yet
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Profile;
