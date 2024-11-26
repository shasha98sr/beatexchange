import axios from 'axios';
import { Beat, User, Comment } from '../types';

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
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (username: string, email: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },
  googleLogin: async (credential: string): Promise<{ token: string; user: User }> => {
    const response = await api.post('/auth/google', { credential });
    return response.data;
  },
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const beats = {
  getAll: async (): Promise<Beat[]> => {
    const response = await api.get('/beats');
    return response.data;
  },
  upload: async (formData: FormData): Promise<Beat> => {
    const response = await uploadApi.post('/beats', formData);
    return response.data;
  },
  like: async (beatId: number): Promise<Beat> => {
    const response = await api.post(`/beats/${beatId}/like`);
    return response.data;
  },
  comment: async (beatId: number, content: string): Promise<Comment> => {
    const response = await api.post(`/beats/${beatId}/comments`, { content });
    return response.data;
  },
  getComments: async (beatId: number): Promise<Comment[]> => {
    const response = await api.get(`/beats/${beatId}/comments`);
    return response.data;
  },
  addComment: async (beatId: number, content: string, timestamp: number): Promise<Comment> => {
    const response = await api.post(`/beats/${beatId}/comments`, { content, timestamp });
    return response.data;
  }
};

export default api;
