import axios from 'axios';
import { Memo, MemoFormData, LoginCredentials, RegisterData } from '../types';

const API_URL = 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },
  register: async (userData: RegisterData) => {
    const { data } = await api.post('/auth/signup', userData);
    return data;
  },
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },
};

// Memos API
export const memoAPI = {
  getMemos: async (params = {}) => {
    const { data } = await api.get('/memos', { params });
    return data;
  },
  getMemo: async (id: string) => {
    const { data } = await api.get(`/memos/${id}`);
    return data;
  },
  createMemo: async (memoData: Omit<MemoFormData, 'id'>) => {
    const { data } = await api.post('/memos', memoData);
    return data;
  },
  updateMemo: async (id: string, memoData: Partial<MemoFormData>) => {
    const { data } = await api.patch(`/memos/${id}`, memoData);
    return data;
  },
  deleteMemo: async (id: string) => {
    await api.delete(`/memos/${id}`);
  },
  searchMemos: async (query: string) => {
    const { data } = await api.get('/memos/search', { params: { query } });
    return data;
  },
};

export default api;
