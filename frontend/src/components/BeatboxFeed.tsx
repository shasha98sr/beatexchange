import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Fab,
  CircularProgress,
  Alert,
} from '@mui/material';
import InfiniteScroll from 'react-infinite-scroll-component';
import BeatCard from './BeatCard';
import { beats as beatsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Beat } from '../types';

const BeatboxFeed: React.FC = () => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBeats = useCallback(async (pageNum: number) => {
    if (loading) return;
    try {
      setLoading(true);
      setError(null);  // Clear any previous errors
      const response = await beatsService.getAll(pageNum, 6);
      
      setBeats(prev => {
        const newBeats = [...prev];
        response.beats.forEach(beat => {
          if (!newBeats.some(b => b.id === beat.id)) {
            newBeats.push(beat);
          }
        });
        return newBeats;
      });
      
      setHasMore(pageNum < response.pages);
      setPage(pageNum);

      // Update comments map with the comments from the response
      setCommentsMap(prevMap => {
        const newMap = { ...prevMap };
        response.beats.forEach(beat => {
          if (!newMap[beat.id]) {
            newMap[beat.id] = beat.comments.map(comment => ({
              id: comment.id,
              text: comment.content, // Keep text for backward compatibility
              content: comment.content,
              timestamp: comment.timestamp,
              username: comment.username,
              created_at: comment.created_at
            }));
          }
        });
        return newMap;
      });
    } catch (error) {
      console.error('Error fetching beats:', error);
      setError('Failed to load content. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchBeats(page + 1);
    }
  }, [loading, hasMore, page, fetchBeats]);

  const handleLike = useCallback((beat: Beat) => {
    setBeats(prev => prev.map(b => 
      b.id === beat.id 
        ? { ...b, liked_by_user: !b.liked_by_user, likes_count: b.likes_count + (b.liked_by_user ? -1 : 1) }
        : b
    ));
  }, []);

  const handleCommentAdd = useCallback((beatId: number, comment: any) => {
    beatsService.getComments(beatId).then(comments => {
      setCommentsMap(prev => ({
        ...prev,
        [beatId]: comments.map(c => ({
          id: c.id,
          text: c.content,
          timestamp: c.timestamp,
          username: c.username,
          created_at: c.created_at
        }))
      }));
    });
  }, []);

  useEffect(() => {
    fetchBeats(1);
    console.log('Beats fetched my print');
  }, []);

  if (!beats.length && loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '800px', ml: 0, mr: 'auto' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <InfiniteScroll
        dataLength={beats.length}
        next={loadMore}
        hasMore={hasMore}
        loader={
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        }
        style={{ overflow: 'visible' }}
      >
        {beats.map(beat => (
          <BeatCard
            key={`beat-${beat.id}`}
            beat={beat}
            comments={commentsMap[beat.id] || []}
            onCommentAdd={handleCommentAdd}
            onLike={() => handleLike(beat)}
          />
        ))}
      </InfiniteScroll>
    </Box>
  );
};

export default React.memo(BeatboxFeed);