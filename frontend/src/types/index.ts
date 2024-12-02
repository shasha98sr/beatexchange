export interface Beat {
  id: number;
  title: string;
  description: string;
  audio_url: string;
  author: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
  author_photo?: string;
  comments: Comment[];
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
  timestamp: number;
  username: string;
  created_at: string;
  user_photo?: string | null;
}

export interface PaginatedBeatsResponse {
  beats: Beat[];
  total: number;
  pages: number;
  current_page: number;
}
