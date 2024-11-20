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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [error, setError] = useState<string | null>(null);
  const [useNativePlayer, setUseNativePlayer] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        setError(null);
        console.log('Loading audio from URL:', audioUrl);

        // First try native audio to check if the file is valid
        const audio = new Audio();
        audio.src = audioUrl;
        
        await new Promise((resolve, reject) => {
          audio.addEventListener('loadedmetadata', resolve);
          audio.addEventListener('error', () => reject(new Error('Failed to load audio')));
          audio.load();
        });

        // If we're here, the audio loaded successfully in the native player
        audioRef.current = audio;

        // Now try to initialize WaveSurfer
        if (waveformRef.current && !wavesurfer.current) {
          const ws = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#4a4a4a',
            progressColor: '#1db954',
            cursorColor: 'transparent',
            barWidth: 1,
            barGap: 2,
            height: 48,
            normalize: true,
            backend: 'MediaElement',
            mediaControls: false,
            hideScrollbar: true,
            barRadius: 0,
            minPxPerSec: 50,
            interact: true,
            fillParent: true
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
              console.log('WaveSurfer initialized successfully');
            }
          });
          ws.on('error', (error) => {
            console.error('WaveSurfer error:', error);
            // If WaveSurfer fails, fall back to native audio player
            setUseNativePlayer(true);
          });

          try {
            await ws.load(audioUrl);
          } catch (error) {
            console.error('WaveSurfer load error:', error);
            setUseNativePlayer(true);
          }
        }
      } catch (error) {
        console.error('Audio initialization error:', error);
        setError('Error loading audio file');
      }
    };

    initializeAudio();

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (useNativePlayer && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', padding: '8px 0' }}>
      {useNativePlayer ? (
        <Box>
          <audio
            ref={audioRef}
            controls
            style={{ width: '100%' }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src={audioUrl} />
            Your browser does not support the audio element.
          </audio>
        </Box>
      ) : (
        <>
          <Box 
            ref={waveformRef} 
            sx={{ 
              backgroundColor: 'transparent',
              '& wave': {
                border: 'none',
                outline: 'none'
              }
            }} 
          />
          <Stack 
            direction="row" 
            spacing={1} 
            alignItems="center" 
            sx={{ mt: 1 }}
          >
            <IconButton 
              onClick={togglePlayPause} 
              size="small"
              sx={{ 
                color: '#1db954',
                padding: '4px',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#1ed760'
                }
              }}
            >
              {isPlaying ? <Pause sx={{ fontSize: 20 }} /> : <PlayArrow sx={{ fontSize: 20 }} />}
            </IconButton>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#b3b3b3',
                fontSize: '0.75rem',
                userSelect: 'none'
              }}
            >
              {currentTime} / {duration}
            </Typography>
          </Stack>
        </>
      )}
    </Box>
  );
};

export default AudioPlayer;
