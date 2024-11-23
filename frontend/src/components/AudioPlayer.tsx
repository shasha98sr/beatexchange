import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Box, IconButton, Typography, TextField, Button, Stack, Alert } from '@mui/material';
import { PlayArrow, Pause, Comment } from '@mui/icons-material';

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
            barWidth: 3,
            barGap: 2,
            height: 120,
            normalize: true,
            backend: 'MediaElement',
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
      marker.style.opacity = '0.5';
      marker.style.pointerEvents = 'none';
      marker.style.zIndex = '1';

      const commentElement = document.createElement('div');
      commentElement.className = 'comment-bubble';
      commentElement.style.position = 'absolute';
      commentElement.style.left = `calc(${position}% + 0px)`;
      commentElement.style.top = '100%';
      commentElement.style.transform = 'none';
      commentElement.style.padding = '4px 8px';
      commentElement.style.borderRadius = '4px';
      commentElement.style.whiteSpace = 'nowrap';
      commentElement.style.opacity = '0';
      commentElement.style.transition = 'all 0.3s ease-in-out';
      commentElement.style.pointerEvents = 'none';
      commentElement.style.zIndex = '2';
      commentElement.style.marginTop = '1px';
      commentElement.innerHTML = `<span style="color: #1db954">${comment.username} </span><span style="color: #ffffff">${comment.text}</span>`;
      
      marker.dataset.commentId = comment.id.toString();
      commentElement.dataset.commentId = comment.id.toString();
      
      commentMarkersRef.current?.appendChild(marker);
      commentMarkersRef.current?.appendChild(commentElement);
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
          <Typography variant="body2" component="div" sx={{ color: '#b3b3b3' }}>
            {username}
          </Typography>
          <Typography variant="subtitle1" component="div" sx={{ color: '#ffffff' }}>
            {title}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ position: 'relative', width: '100%', mb: 4 }}>
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
    </Box>
  );
};

export default AudioPlayer;
