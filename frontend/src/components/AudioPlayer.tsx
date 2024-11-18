import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Box, IconButton, Typography, Stack, Alert } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let ws: WaveSurfer | null = null;

    const initializeWaveSurfer = async () => {
      if (waveformRef.current && !wavesurfer.current) {
        try {
          setIsLoading(true);
          setError(null);

          // First, check if the audio file exists and can be loaded
          const response = await fetch(audioUrl, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to load audio file');
          }

          // Create blob URL from the audio file
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          blobUrlRef.current = blobUrl;

          ws = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#8c8c8c',
            progressColor: '#f50',
            cursorColor: '#f50',
            barWidth: 2,
            barGap: 1,
            height: 80,
            normalize: true,
            backend: 'WebAudio',
            hideScrollbar: true,
            barRadius: 2,
            minPxPerSec: 50,
            mediaControls: true
          });

          wavesurfer.current = ws;

          ws.on('play', () => setIsPlaying(true));
          ws.on('pause', () => setIsPlaying(false));
          ws.on('audioprocess', () => {
            if (ws) {
              setCurrentTime(formatTime(ws.getCurrentTime()));
            }
          });
          ws.on('ready', () => {
            if (ws) {
              setDuration(formatTime(ws.getDuration()));
              setIsLoading(false);
            }
          });
          ws.on('error', (error) => {
            console.error('WaveSurfer error:', error);
            setError('Error loading audio');
            setIsLoading(false);
          });

          await ws.load(blobUrl);
        } catch (error) {
          console.error('Error initializing WaveSurfer:', error);
          setError('Error loading audio file');
          setIsLoading(false);
        }
      }
    };

    initializeWaveSurfer();

    return () => {
      if (ws) {
        ws.destroy();
        wavesurfer.current = null;
      }
      // Clean up blob URL if it exists
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [audioUrl]);

  const handlePlayPause = () => {
    if (wavesurfer.current && !isLoading && !error) {
      wavesurfer.current.playPause();
    }
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 1 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', my: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <IconButton 
          onClick={handlePlayPause}
          disabled={isLoading || !!error}
          sx={{ 
            bgcolor: '#f50',
            color: 'white',
            '&:hover': { bgcolor: '#f30' },
            '&.Mui-disabled': {
              bgcolor: '#ffcccc',
              color: 'white'
            },
            width: 45,
            height: 45
          }}
        >
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
        <Stack direction="row" spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {currentTime}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            /
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {duration}
          </Typography>
        </Stack>
      </Stack>
      <div 
        ref={waveformRef} 
        style={{ 
          width: '100%',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          padding: '10px',
          opacity: isLoading ? 0.5 : 1,
          transition: 'opacity 0.3s ease'
        }} 
      />
    </Box>
  );
};

export default AudioPlayer;
