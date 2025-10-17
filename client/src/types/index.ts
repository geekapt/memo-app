export interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface Memo {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  user: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface ApiResponse<T> {
  status: 'success' | 'fail' | 'error';
  message?: string;
  data?: T;
  results?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  username: string;
}

export interface MemoFormData {
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
}
