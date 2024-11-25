import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Box, IconButton, Typography, TextField, Button, Stack, Alert, useTheme, Avatar } from '@mui/material';
import { PlayArrow, Pause, Comment, Send } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { beats } from '../services/api';

interface AudioPlayerProps {
  audioUrl: string;
  beatId: number;
  title: string;
  username: string;
  profilePicture?: string | null;
}

interface Comment {
  id: number;
  text: string;
  timestamp: number;
  username: string;
  created_at: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, beatId, title, username, profilePicture }) => {
  const { token } = useAuth();
  const theme = useTheme();
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!audioUrl || !token) {
      setError('Please sign in to play audio');
      return;
    }

    const initializeAudio = async () => {
      try {
        setError(null);
        setIsDestroyed(false);
        
        // Append token to URL
        const authenticatedUrl = `${audioUrl}${audioUrl.includes('?') ? '&' : '?'}token=${token}`;
        console.log('Loading audio from URL:', authenticatedUrl);

        if (waveformRef.current && !wavesurfer.current) {
          const ws = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: theme.palette.secondary.light,
            progressColor: theme.palette.primary.main,
            cursorColor: theme.palette.secondary.main,
            cursorWidth: 1,
            barWidth: 3,
            barGap: 0.5,
            height: 50,
            normalize: true,
            mediaControls: false,
            hideScrollbar: true,
            barRadius: 0,
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
            
            // Find the comment closest to current time within the visibility window
            let closestComment: Comment | null = null;
            let minTimeDiff = 1; // Maximum time difference to show a comment

            comments.forEach(comment => {
              const timeDiff = Math.abs(comment.timestamp - time);
              if (timeDiff <= minTimeDiff && (!closestComment || timeDiff < Math.abs(closestComment.timestamp - time))) {
                closestComment = comment;
              }
            });

            // Update comment visibility
            const commentElements = commentMarkersRef.current?.querySelectorAll('.comment-bubble');
            commentElements?.forEach(element => {
              const htmlElement = element as HTMLDivElement;
              const commentId = htmlElement.dataset.commentId;
              const isVisible = closestComment && commentId === closestComment.id.toString();
              
              // Smooth transition
              htmlElement.style.transition = 'opacity 0.5s ease-in-out';
              htmlElement.style.opacity = isVisible ? '1' : '0';
              htmlElement.style.transform = isVisible ? 'none' : 'none';
            });
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

          try {
            await ws.load(authenticatedUrl);
          } catch (error) {
            console.error('Error loading audio:', error);
            if (!isDestroyed) {
              setError('Error loading audio. Please try again later.');
            }
          }
        }
      } catch (err) {
        console.error('Error initializing audio:', err);
        setError('Error loading audio');
      }
    };

    initializeAudio();

    return () => {
      setIsDestroyed(true);
      if (wavesurfer.current) {
        wavesurfer.current.unAll();
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, [audioUrl, comments, isDestroyed, token]);

  const handlePlayPause = () => {
    if (!wavesurfer.current) return;
    
    if (isPlaying) {
      wavesurfer.current.pause();
    } else {
      wavesurfer.current.play();
      setHasPlayed(true);
    }
    setIsPlaying(!isPlaying);
  };

  const updateCommentMarkers = useCallback(() => {
    if (!commentMarkersRef.current || !wavesurfer.current || !comments.length) return;

    // Clear existing markers
    commentMarkersRef.current.innerHTML = '';

    const duration = wavesurfer.current.getDuration();

    // Group comments by rounded timestamp and keep only the oldest
    const commentsByTimestamp = comments.reduce((acc, comment) => {
      const roundedTimestamp = Math.round(comment.timestamp * 2) / 2;
      const existingComment = acc.get(roundedTimestamp);
      if (!existingComment || new Date(comment.created_at) < new Date(existingComment.created_at)) {
        acc.set(roundedTimestamp, comment);
      }
      return acc;
    }, new Map());

    // Create markers only for the oldest comments
    Array.from(commentsByTimestamp.values()).forEach(comment => {
      const marker = document.createElement('div');
      const position = (comment.timestamp / duration) * 100;
      
      marker.style.position = 'absolute';
      marker.style.left = `${position}%`;
      marker.style.bottom = '0';
      marker.style.width = '7px';
      marker.style.height = '7px';
      marker.style.backgroundColor = '#1db954';
      marker.style.opacity = '0.6';
      marker.style.pointerEvents = 'none';
      marker.style.zIndex = '1';

      const commentElement = document.createElement('div');
      commentElement.className = 'comment-bubble';
      commentElement.style.position = 'absolute';
      if (position > 50) {
        commentElement.style.right = `${100 - position}%`;
        commentElement.style.left = 'auto';
      } else {
        commentElement.style.left = `calc(${position}%)`;
        commentElement.style.right = 'auto';
      }
      commentElement.style.top = '100%';
      commentElement.style.transform = 'none';
      commentElement.style.padding = '0 0 4px 0';
      commentElement.style.borderRadius = '4px';
      commentElement.style.whiteSpace = 'nowrap';
      commentElement.style.opacity = '0';
      commentElement.style.transition = 'all 0.3s ease-in-out';
      commentElement.style.pointerEvents = 'none';
      commentElement.style.zIndex = '2';
      commentElement.style.marginTop = '1px';
      commentElement.innerHTML = position > 50 
        ? `<span style="color: ${theme.palette.text.primary}">${comment.text}</span> <span style="color: #1db954">${comment.username}</span>`
        : `<span style="color: #1db954">${comment.username} </span><span style="color: ${theme.palette.text.primary}">${comment.text}</span>`;
      
      marker.dataset.commentId = comment.id.toString();
      commentElement.dataset.commentId = comment.id.toString();
      
      if (position > 50) {
        commentMarkersRef.current?.appendChild(commentElement);
        commentMarkersRef.current?.appendChild(marker);
      } else {
        commentMarkersRef.current?.appendChild(marker);
        commentMarkersRef.current?.appendChild(commentElement);
      }
    });
  }, [comments, theme]);

  useEffect(() => {
    if (!comments.length || !wavesurfer.current) return;
    updateCommentMarkers();
  }, [comments, updateCommentMarkers]);

  const fetchComments = useCallback(async () => {
    try {
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const data = await beats.getComments(beatId);
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
  }, [beatId, token]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      if (!token) {
        setError('Please log in to comment');
        return;
      }

      const newCommentData = await beats.addComment(beatId, newComment, currentTime);
      setComments(prevComments => [...prevComments, {
        id: newCommentData.id,
        text: newCommentData.content,
        timestamp: newCommentData.timestamp,
        username: newCommentData.username,
        created_at: newCommentData.created_at
      }]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    }
  };

  const commentMarkersRef = useRef<HTMLDivElement>(null);

  return (
    <Box sx={{ 
      width: '100%', 
      padding: '20px', 
      borderRadius: 0, 
      backgroundColor: theme.palette.background.default,
      border: '1px solid',
      borderColor: 'divider'
    }}>
      {error && (
        <Alert severity="error" sx={{ marginBottom: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar 
            src={profilePicture || undefined} 
            alt={username}
            sx={{ 
              width: 30, 
              height: 30,
              bgcolor: theme.palette.primary.main
            }}
          >
            {username[0].toUpperCase()}
          </Avatar>
          <Stack spacing={0} alignItems="left">
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: -0.5 }}>
              {'@' + username}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
              {title}
            </Typography>
          </Stack>
        </Stack>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </Typography>
      </Stack>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', marginY: 2 }}>
        <IconButton 
          onClick={handlePlayPause} 
          sx={{
            color: theme.palette.primary.main,
            borderRadius: '50%',
            border: '1px solid',
            borderColor: theme.palette.primary.main,
          }}
        >
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
        
        <Box sx={{ position: 'relative', width: '100%' }}>
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
              zIndex: 10
            }}
          />
        </Box>
      </Box>

      {hasPlayed && (
        <Box sx={{ marginTop: 4 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              variant="standard"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              size="small"
              InputProps={{
                disableUnderline: true
              }}
              sx={{
                '& .MuiInputBase-root': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  borderRadius: '9999px',
                  padding: '0.5rem 1rem'
                },
                '& .MuiInputBase-input': {
                  color: theme.palette.text.primary
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              sx={{
                width: '40px',
                height: '40px',
                minWidth: '40px',
                padding: 0,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark
                }
              }}
            >
              <Send sx={{ width: 20, height: 20 }} />
            </Button>
          </Box>
          {newComment.trim() && (
            <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem', marginTop: 0.5 }}>
              Commenting at {formatTime(currentTime)}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AudioPlayer;
