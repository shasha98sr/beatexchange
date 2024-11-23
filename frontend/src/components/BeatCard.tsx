import React from 'react';
import {
  Box,
  Stack,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Comment as CommentIcon,
  Share as ShareIcon,
  MoreHoriz
} from '@mui/icons-material';
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
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        <AudioPlayer 
          audioUrl={beat.audio_url}
          beatId={beat.id}
          title={beat.title}
          username={beat.author}
        />

        <Stack 
          direction="row" 
          spacing={1} 
          alignItems="center" 
          sx={{ mt: 2 }}
        >
          <IconButton 
            onClick={() => onLike(beat.id)}
            sx={{ color: beat.liked_by_user ? '#1db954' : '#b3b3b3' }}
          >
            {beat.liked_by_user ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
          <IconButton sx={{ color: '#b3b3b3' }}>
            <CommentIcon />
          </IconButton>
          <IconButton sx={{ color: '#b3b3b3' }}>
            <ShareIcon />
          </IconButton>
          <Box sx={{ flex: 1 }} />
          <IconButton size="small" sx={{ color: '#b3b3b3' }}>
            <MoreHoriz />
          </IconButton>
        </Stack>
      </Box>
    </Paper>
  );
};

export default BeatCard;
