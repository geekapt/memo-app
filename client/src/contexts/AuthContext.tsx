import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:5000/api/v1';


interface User {
  id: string;
  username: string;
  email: string;
  profilePhoto?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    axios.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setUser(res.data.data.user); // Fixed: access the user object
    }).catch(() => {
      localStorage.removeItem('token');
    }).finally(() => {
      setLoading(false);
    });
  } else {
    setLoading(false);
  }
}, []);

const login = async (email: string, password: string) => {
  const { data } = await axios.post('/auth/login', { email, password });
  localStorage.setItem('token', data.token);
  setUser({
    id: data.data.user._id,
    username: data.data.user.username,
    email: data.data.user.email
  });
};

const register = async (username: string, email: string, password: string) => {
  const { data } = await axios.post('/auth/register', { username, email, password });
  localStorage.setItem('token', data.token);
  setUser({
    id: data.data.user._id,
    username: data.data.user.username,
    email: data.data.user.email
  });
};

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
