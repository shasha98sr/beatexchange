import axios from 'axios';
import { Beat, User, Comment, PaginatedBeatsResponse } from '../types';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
const API_URL = `${BASE_URL}/api`;

// Create two axios instances: one for JSON and one for multipart
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const uploadApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Add token to requests if available
const addAuthHeader = (config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(addAuthHeader);
uploadApi.interceptors.request.use(addAuthHeader);

export const auth = {
  login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('API error logging in:', error);
      throw error;
    }
  },
  register: async (username: string, email: string, password: string): Promise<{ token: string; user: User }> => {
    try {
      const response = await api.post('/auth/register', { username, email, password });
      return response.data;
    } catch (error) {
      console.error('API error registering:', error);
      throw error;
    }
  },
  googleLogin: async (credential: string): Promise<{ token: string; user: User }> => {
    try {
      const response = await api.post('/auth/google', { credential });
      return response.data;
    } catch (error) {
      console.error('API error logging in with Google:', error);
      throw error;
    }
  },
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('API error getting current user:', error);
      throw error;
    }
  },
};

export const beats = {
  getAll: async (page = 1, perPage = 10): Promise<PaginatedBeatsResponse> => {
    try {
      const response = await api.get(`/beats?page=${page}&per_page=${perPage}`);
      return response.data;
    } catch (error) {
      console.error('API error getting all beats:', error);
      throw error;
    }
  },
  getMyBeats: async (): Promise<Beat[]> => {
    try {
      const response = await api.get('/users/me/beats');
      return response.data;
    } catch (error) {
      console.error('API error getting my beats:', error);
      throw error;
    }
  },
  getUserBeats: async (username: string): Promise<Beat[]> => {
    try {
      // Remove @ if it exists in the username
      const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
      const response = await api.get(`/users/${cleanUsername}/beats`);
      return response.data;
    } catch (error) {
      console.error('API error getting user beats:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return []; // Return empty array for non-existent users
      }
      throw error;
    }
  },
  upload: async (formData: FormData): Promise<Beat> => {
    try {
      const response = await uploadApi.post('/beats', formData);
      return response.data;
    } catch (error) {
      console.error('API error uploading beat:', error);
      throw error;
    }
  },
  like: async (beatId: number): Promise<Beat> => {
    try {
      const response = await api.post(`/beats/${beatId}/like`);
      return response.data;
    } catch (error) {
      console.error('API error liking beat:', error);
      throw error;
    }
  },
  comment: async (beatId: number, content: string): Promise<Comment> => {
    try {
      const response = await api.post(`/beats/${beatId}/comments`, { content });
      return response.data;
    } catch (error) {
      console.error('API error commenting on beat:', error);
      throw error;
    }
  },
  getComments: async (beatId: number): Promise<Comment[]> => {
    try {
      const response = await api.get(`/beats/${beatId}/comments`);
      return response.data;
    } catch (error) {
      console.error('API error getting comments for beat:', error);
      throw error;
    }
  },
  addComment: async (beatId: number, content: string, timestamp: number): Promise<Comment> => {
    try {
      const response = await api.post(`/beats/${beatId}/comments`, { content, timestamp });
      return response.data;
    } catch (error) {
      console.error('API error adding comment to beat:', error);
      throw error;
    }
  }
};

export default api;
