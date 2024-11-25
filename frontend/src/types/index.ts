export interface Beat {
  id: number;
  title: string;
  audio_url: string;
  author: string;
  author_photo: string | null;
  created_at: string;
  likes_count: number;
  liked_by_user: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  profile_photo: string | null;
}

export interface Comment {
  id: number;
  content: string;
  text: string;
  timestamp: number;
  username: string;
  created_at: string;
  user_photo: string | null;
}
