import React from 'react';
import AudioPlayer from './AudioPlayer';
import { Beat } from '../types';

interface BeatCardProps {
  beat: Beat;
  comments: any[];
  onLike: (beatId: number) => void;
  onCommentAdd?: (beatId: number, comment: any) => void;
}

const BeatCard: React.FC<BeatCardProps> = React.memo(({ beat, comments, onLike, onCommentAdd }) => {
  return (
    <div 
      className="w-full hover:bg-card/90 transition-colors"
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}
    >
      <AudioPlayer 
        audioUrl={beat.audio_url}
        beatId={beat.id}
        title={beat.title}
        username={beat.author}
        profilePicture={beat.author_photo}
        comments={comments}
        onCommentAdd={onCommentAdd}
      />
    </div>
  );
});

BeatCard.displayName = 'BeatCard';

export default BeatCard;
