import axios from 'axios';

const API_URL = 'http://127.0.0.1:5000/api';

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
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },
};

export const beats = {
  getAll: async () => {
    const response = await api.get('/beats');
    return response.data;
  },
  upload: async (formData: FormData) => {
    const response = await uploadApi.post('/beats', formData);
    return response.data;
  },
  like: async (beatId: number) => {
    const response = await api.post(`/beats/${beatId}/like`);
    return response.data;
  },
  comment: async (beatId: number, content: string) => {
    const response = await api.post(`/beats/${beatId}/comments`, { content });
    return response.data;
  },
};

export default api;
