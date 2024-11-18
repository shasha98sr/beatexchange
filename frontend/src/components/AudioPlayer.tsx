import React, { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Box, IconButton } from '@mui/material';
import { PlayArrow, Pause } from '@mui/icons-material';

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4a9eff',
        progressColor: '#1976d2',
        cursorColor: '#1976d2',
        barWidth: 2,
        barGap: 3,
        height: 100,
        normalize: true,
        backend: 'WebAudio',
        hideScrollbar: true,
      });

      wavesurfer.current.load(audioUrl);

      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));
    }

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [audioUrl]);

  const handlePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  return (
    <Box sx={{ width: '100%', my: 2 }}>
      <div ref={waveformRef} style={{ width: '100%' }} />
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
        <IconButton onClick={handlePlayPause} size="large">
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default AudioPlayer;
