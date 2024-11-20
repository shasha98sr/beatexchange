import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Box,
  Avatar,
  Stack,
  Button,
} from '@mui/material';
import { Favorite, FavoriteBorder, Comment, Share, MoreHoriz } from '@mui/icons-material';
import AudioPlayer from './AudioPlayer';

interface BeatCardProps {
  beat: {
    id: number;
    title: string;
    description: string;
    audio_url: string;
    author: string;
    created_at: string;
    likes_count: number;
  };
  onLike: (beatId: number) => void;
  isLiked: boolean;
}

const BeatCard: React.FC<BeatCardProps> = ({ beat, onLike, isLiked }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Card 
      sx={{ 
        width: '100%', 
        mb: 2, 
        boxShadow: 'none', 
        border: '1px solid #282828',
        borderRadius: 1,
        backgroundColor: '#121212',
        '&:hover': {
          backgroundColor: '#181818'
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Avatar 
            sx={{ 
              width: 40, 
              height: 40, 
              bgcolor: '#1db954',
              fontSize: '1rem',
              boxShadow: 'none'
            }}
          >
            {beat.author[0].toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#b3b3b3',
                    fontWeight: 500 
                  }}
                >
                  {beat.author}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#ffffff',
                    fontWeight: 700 
                  }}
                >
                  {beat.title}
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                sx={{ color: '#b3b3b3' }}
              >
                {formatDate(beat.created_at)}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <AudioPlayer audioUrl={beat.audio_url} />
        
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#b3b3b3',
            mt: 1, 
            mb: 2 
          }}
        >
          {beat.description}
        </Typography>

        <Stack 
          direction="row" 
          spacing={1} 
          alignItems="center" 
          sx={{ 
            borderTop: '1px solid #282828',
            pt: 2
          }}
        >
          <IconButton 
            onClick={() => onLike(beat.id)}
            sx={{ 
              color: isLiked ? '#1db954' : '#b3b3b3',
              '&:hover': {
                color: isLiked ? '#1ed760' : '#ffffff'
              }
            }}
          >
            {isLiked ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
          <Typography 
            variant="body2" 
            sx={{ color: '#b3b3b3' }}
          >
            {beat.likes_count}
          </Typography>

          <IconButton sx={{ color: '#b3b3b3', '&:hover': { color: '#ffffff' } }}>
            <Comment />
          </IconButton>

          <IconButton sx={{ color: '#b3b3b3', '&:hover': { color: '#ffffff' } }}>
            <Share />
          </IconButton>

          <Box sx={{ flex: 1 }} />

          <IconButton sx={{ color: '#b3b3b3', '&:hover': { color: '#ffffff' } }}>
            <MoreHoriz />
          </IconButton>
        </Stack>
      </Box>
    </Card>
  );
};

export default BeatCard;
