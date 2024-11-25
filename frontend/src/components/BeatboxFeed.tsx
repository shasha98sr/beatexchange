import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Fab,
} from '@mui/material';
import {
  Mic as MicIcon,
} from '@mui/icons-material';
import RecordBeat from './RecordBeat';
import BeatCard from './BeatCard';
import { beats as beatsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Beat } from '../types';

const BeatboxFeed: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [beatsList, setBeatsList] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecordDialog, setShowRecordDialog] = useState(false);

  useEffect(() => {
    fetchBeats();
  }, []);

  const fetchBeats = async () => {
    try {
      setLoading(true);
      const response = await beatsService.getAll();
      console.log('Beats response:', response);
      setBeatsList(response);
    } catch (error) {
      console.error('Error fetching beats:', error);
      setError('Failed to load beats. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (beatId: number) => {
    const updatedBeats = beatsList.map(beat => {
      if (beat.id === beatId) {
        return { ...beat, liked_by_user: !beat.liked_by_user, likes_count: beat.likes_count + (beat.liked_by_user ? -1 : 1) };
      }
      return beat;
    });
    setBeatsList(updatedBeats);
  };

  const handleRecordComplete = () => {
    fetchBeats();
    setShowRecordDialog(false);
  };

  if (loading) {
    return <Box>Loading...</Box>;
  }

  if (error) {
    return <Box color="error">{error}</Box>;
  }

  return (
    <Box sx={{ 
      maxWidth: "md", 
      mx: "auto",  
      position: 'relative',
      borderLeft: '1px solid',
      borderRight: '1px solid',
      borderColor: 'divider',
    }}>
      {beatsList.map((beat) => (
        <BeatCard
          key={beat.id}
          beat={beat}
          onLike={() => handleLike(beat.id)}
        />
      ))}
      
      {isAuthenticated && (
        <Fab
          color="primary"
          aria-label="record"
          onClick={() => setShowRecordDialog(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <MicIcon />
        </Fab>
      )}

      {/* Record Beat Dialog */}
      <RecordBeat
        open={showRecordDialog}
        onClose={() => setShowRecordDialog(false)}
        onUploadComplete={handleRecordComplete}
      />
    </Box>
  );
};

export default BeatboxFeed;