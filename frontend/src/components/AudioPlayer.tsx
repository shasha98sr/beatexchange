import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Box, IconButton, Typography, TextField, Button, Stack, Alert } from '@mui/material';
import { PlayArrow, Pause, Comment, Delete } from '@mui/icons-material';

interface AudioPlayerProps {
  audioUrl: string;
  beatId: number;
  title: string;
  username: string;
}

interface Comment {
  id: number;
  text: string;
  timestamp: number;
  username: string;
  created_at: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, beatId, title, username }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [visibleComments, setVisibleComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!audioUrl) return;

    const initializeAudio = async () => {
      try {
        setError(null);
        setIsDestroyed(false);
        console.log('Loading audio from URL:', audioUrl);

        if (waveformRef.current && !wavesurfer.current) {
          const ws = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#b3b3b3',
            progressColor: '#1db954',
            cursorColor: '#1db954',
            barWidth: 2,
            barGap: 1,
            height: 48,
            normalize: true,
            backend: 'MediaElement',
            mediaControls: false,
            hideScrollbar: true,
            barRadius: 2,
            minPxPerSec: 1,
            interact: true,
            fillParent: true
          });

          wavesurfer.current = ws;

          ws.on('play', () => setIsPlaying(true));
          ws.on('pause', () => setIsPlaying(false));
          ws.on('ready', () => {
            if (!isDestroyed) {
              setError(null);
              setDuration(ws.getDuration());
              updateCommentMarkers();
            }
          });
          ws.on('audioprocess', () => {
            const time = ws.getCurrentTime();
            setCurrentTime(time);
            const nearbyComments = comments.filter(
              comment => Math.abs(comment.timestamp - time) <= 2
            );
            setVisibleComments(nearbyComments);
          });
          ws.on('timeupdate', () => {
            setCurrentTime(ws.getCurrentTime());
          });
          ws.on('error', (error) => {
            console.error('WaveSurfer error:', error);
            if (!isDestroyed) {
              setError('Error loading audio. Please try again later.');
            }
          });

          await ws.load(audioUrl);
        }
      } catch (err) {
        console.error('Error initializing audio:', err);
        if (!isDestroyed) {
          setError('Error loading audio. Please try again later.');
        }
      }
    };

    initializeAudio();

    return () => {
      setIsDestroyed(true);
      if (wavesurfer.current) {
        wavesurfer.current.pause();
        wavesurfer.current.unAll();
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, [audioUrl, comments, isDestroyed]);

  const handlePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  const updateCommentMarkers = useCallback(() => {
    if (!commentMarkersRef.current || !wavesurfer.current || !comments.length) return;

    // Clear existing markers
    commentMarkersRef.current.innerHTML = '';

    const duration = wavesurfer.current.getDuration();
    const containerWidth = waveformRef.current?.clientWidth || 0;

    comments.forEach(comment => {
      const marker = document.createElement('div');
      const position = (comment.timestamp / duration) * 100;
      
      marker.style.position = 'absolute';
      marker.style.left = `${position}%`;
      marker.style.top = '0';
      marker.style.width = '2px';
      marker.style.height = '100%';
      marker.style.backgroundColor = '#1db954';
      marker.style.opacity = '0.5';
      marker.style.pointerEvents = 'none';
      marker.style.zIndex = '1';
      
      commentMarkersRef.current?.appendChild(marker);
    });
  }, [comments]);

  useEffect(() => {
    if (!comments.length || !wavesurfer.current) return;
    updateCommentMarkers();
  }, [comments, updateCommentMarkers]);

  const fetchComments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await fetch(`http://127.0.0.1:5000/api/beats/${beatId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      setComments(data.map((comment: any) => ({
        id: comment.id,
        text: comment.content,
        timestamp: comment.timestamp,
        username: comment.username,
        created_at: comment.created_at
      })));
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    }
  }, [beatId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to comment');
        return;
      }

      const response = await fetch(`http://127.0.0.1:5000/api/beats/${beatId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment,
          timestamp: currentTime
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const newCommentData = await response.json();
      setComments(prevComments => [...prevComments, {
        id: newCommentData.id,
        text: newCommentData.content,
        timestamp: newCommentData.timestamp,
        username: newCommentData.username,
        created_at: newCommentData.created_at
      }]);

      setNewComment('');
      setShowCommentInput(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to delete comments');
        return;
      }

      const response = await fetch(`http://127.0.0.1:5000/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment');
    }
  };

  const commentMarkersRef = useRef<HTMLDivElement>(null);

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handlePlayPause} sx={{ mr: 1 }}>
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
        <Box>
          <Typography variant="subtitle1" component="div" sx={{ color: '#ffffff' }}>
            {title}
          </Typography>
          <Typography variant="body2" component="div" sx={{ color: '#b3b3b3' }}>
            {username}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ position: 'relative', width: '100%', mb: 2 }}>
        <Box ref={waveformRef} sx={{ width: '100%' }} />
        <Box 
          ref={commentMarkersRef}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      </Box>

      <Stack direction="row" spacing={2} alignItems="center">
        <IconButton onClick={() => setShowCommentInput(!showCommentInput)}>
          <Comment />
        </IconButton>
      </Stack>

      {showCommentInput && (
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddComment();
              }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography sx={{ color: '#b3b3b3', fontSize: '0.75rem' }}>
              Commenting at {formatTime(currentTime)}
            </Typography>
            <Button
              variant="contained"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              sx={{
                backgroundColor: '#1db954',
                '&:hover': {
                  backgroundColor: '#1ed760',
                },
                '&.Mui-disabled': {
                  backgroundColor: '#1db95466',
                },
              }}
            >
              Add Comment
            </Button>
          </Box>
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        {comments.map((comment) => (
          <Box 
            key={comment.id} 
            sx={{ 
              mt: 2,
              opacity: visibleComments.some(vc => vc.id === comment.id) ? 1 : 0.3,
              transition: 'opacity 0.3s ease-in-out',
              backgroundColor: visibleComments.some(vc => vc.id === comment.id) 
                ? 'rgba(29, 185, 84, 0.1)' 
                : 'transparent',
              padding: '8px',
              borderRadius: '4px'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: '#1db954',
                  fontWeight: 'bold',
                }}
              >
                {comment.username} • {formatTime(comment.timestamp)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleDeleteComment(comment.id)}
                sx={{
                  padding: '2px',
                  color: '#ff1744',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 23, 68, 0.1)',
                  }
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: '#ffffff',
                wordBreak: 'break-word',
              }}
            >
              {comment.text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default AudioPlayer;
