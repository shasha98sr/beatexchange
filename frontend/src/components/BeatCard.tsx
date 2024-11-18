import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Box,
} from '@mui/material';
import { Favorite, FavoriteBorder, Comment } from '@mui/icons-material';
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
  return (
    <Card sx={{ maxWidth: 600, width: '100%', mb: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div">
          {beat.title}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          by {beat.author}
        </Typography>
        <Typography variant="body2">{beat.description}</Typography>
        
        <AudioPlayer audioUrl={beat.audio_url} />
      </CardContent>
      
      <CardActions disableSpacing>
        <IconButton 
          aria-label="like"
          onClick={() => onLike(beat.id)}
        >
          {isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {beat.likes_count}
        </Typography>
        
        <IconButton aria-label="comment">
          <Comment />
        </IconButton>
        
        <Box sx={{ ml: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            {new Date(beat.created_at).toLocaleDateString()}
          </Typography>
        </Box>
      </CardActions>
    </Card>
  );
};

export default BeatCard;
