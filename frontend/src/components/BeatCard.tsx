import React from 'react';
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
    <div 
      className="w-full mb-2 sm:mb-4 border border-border rounded-none sm:rounded-lg bg-card hover:bg-card/90 transition-colors"
    >
      <div className="p-4">
        <AudioPlayer 
          audioUrl={beat.audio_url}
          beatId={beat.id}
          title={beat.title}
          username={beat.author}
        />
      </div>
    </div>
  );
};

export default BeatCard;
