import React from 'react';
import { 
  Box, 
  Paper 
} from '@mui/material';
import AudioPlayer from './AudioPlayer';

interface Beat {
  id: number;
  title: string;
  audio_url: string;
  author: string;
  created_at: string;
  likes_count: number;
  liked_by_user: boolean;
}

interface BeatCardProps {
  beat: Beat;
  onLike: (beatId: number) => void;
}

const BeatCard: React.FC<BeatCardProps> = ({ beat, onLike }) => {
  return (
    <Paper 
      sx={{ 
        width: '100%', 
        mb: { xs: 1, sm: 2 }, 
        boxShadow: 'none', 
        border: '1px solid #282828',
        borderRadius: { xs: 0, sm: 1 },
        backgroundColor: '#121212',
        '&:hover': {
          backgroundColor: '#181818'
        }
      }}
    >
      <Box>
        <AudioPlayer 
          audioUrl={beat.audio_url}
          beatId={beat.id}
          title={beat.title}
          username={beat.author}
        />
      </Box>
    </Paper>
  );
};

export default BeatCard;
