import React from 'react';
import AudioPlayer from './AudioPlayer';
import { Beat } from '../types';

interface BeatCardProps {
  beat: Beat;
  onLike: (beatId: number) => void;
}

const BeatCard: React.FC<BeatCardProps> = ({ beat, onLike }) => {
  return (
    <div className="w-full hover:bg-card/90 transition-colors">
      <AudioPlayer 
        audioUrl={beat.audio_url}
        beatId={beat.id}
        title={beat.title}
        username={beat.author}
        profilePicture={beat.author_photo}
      />
    </div>
  );
};

export default BeatCard;
