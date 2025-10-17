import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FiPlus, FiSearch, FiMoon, FiSun, FiTrash2, FiEdit2, FiLogOut, FiUser, FiMenu, FiX } from 'react-icons/fi';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import './App.css';
import axios, { AxiosError } from 'axios';

// Type guard to check if error is an AxiosError
const isAxiosError = (error: unknown): error is AxiosError => {
  return (error as AxiosError).isAxiosError !== undefined;
};

// Type guard to check if error is a standard Error
const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

interface Memo {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Simple Icon component to handle consistent sizing
const Icon = ({ 
  children, 
  size = 20, 
  className = '' 
}: { 
  children: React.ReactNode; 
  size?: number; 
  className?: string;
}) => (
  <span 
    className={className}
    style={{ 
      display: 'inline-flex', 
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size
    }}
  >
    {children}
  </span>
);

const MemoApp = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [activeMemo, setActiveMemo] = useState<Memo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

useEffect(() => {
const loadMemos = async () => {
  try {
    const response = await axios.get('/memos');
    console.log('API Response:', response.data); // Debug the response

    // Handle different response formats
    let memosData = [];

    if (response.data?.data?.memos) {
      memosData = Array.isArray(response.data.data.memos) ? response.data.data.memos : [];
    } else if (response.data?.memos) {
      memosData = Array.isArray(response.data.memos) ? response.data.memos : [];
    } else if (Array.isArray(response.data)) {
      memosData = response.data;
    }

    console.log('Processed memos data:', memosData); // Debug the processed data

    setMemos(memosData.map((memo: any) => ({
      ...memo,
      id: memo._id || memo.id,
      createdAt: memo.createdAt ? new Date(memo.createdAt) : new Date(),
      updatedAt: memo.updatedAt ? new Date(memo.updatedAt) : new Date()
    })));
  } catch (error: unknown) {
    console.error('Error loading memos:', error);
    const errorMessage = isAxiosError(error) && error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data
      ? (error.response.data as { message: string }).message || 'Failed to load memos. Please try again.'
      : isError(error)
        ? error.message
        : 'An unknown error occurred';
    setError(errorMessage);
  }
};

  if (user) {
    loadMemos();
  }
}, [user]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const filteredMemos = memos.filter(memo => 
    memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    memo.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000/api/v1';

// Configure axios to include the auth token in requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle common errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const loadMemos = async () => {
  try {
    const response = await axios.get('/memos');
    console.log('API Response:', response.data); // Debug the response

    // Handle different response formats
    let memosData = [];

    if (response.data?.data?.memos) {
      memosData = Array.isArray(response.data.data.memos) ? response.data.data.memos : [];
    } else if (response.data?.memos) {
      memosData = Array.isArray(response.data.memos) ? response.data.memos : [];
    } else if (Array.isArray(response.data)) {
      memosData = response.data;
    }

    console.log('Processed memos data:', memosData); // Debug the processed data

    setMemos(memosData.map((memo: any) => ({
      ...memo,
      id: memo._id || memo.id,
      createdAt: memo.createdAt ? new Date(memo.createdAt) : new Date(),
      updatedAt: memo.updatedAt ? new Date(memo.updatedAt) : new Date()
    })));
  } catch (error: unknown) {
    console.error('Error loading memos:', error);
    const errorMessage = isAxiosError(error) && error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data
      ? (error.response.data as { message: string }).message || 'Failed to load memos. Please try again.'
      : isError(error)
        ? error.message
        : 'An unknown error occurred';
    setError(errorMessage);
  }
};

const handleNewMemo = async () => {
  try {
    const response = await axios.post('/memos', {
      title: 'Untitled Note',
      content: 'Start writing your note here...'
    });

    // The backend returns { status: 'success', data: { memo: {...} } }
    const newMemo = {
      ...response.data.data.memo,
      id: response.data.data.memo._id || response.data.data.memo.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setMemos(prevMemos => [newMemo, ...prevMemos]);
    setActiveMemo(newMemo);
  } catch (error: unknown) {
    console.error('Error creating memo:', error);
    const errorMessage = isAxiosError(error) && error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data
      ? (error.response.data as { message: string }).message || 'Failed to create memo. Please try again.'
      : isError(error)
        ? error.message
        : 'An unknown error occurred';
    setError(errorMessage);
  }
};

const handleDelete = async (id: string) => {
  if (!id) return;

  try {
    await axios.delete(`/memos/${id}`);
    setMemos(prevMemos => prevMemos.filter(memo => memo.id !== id));
    if (activeMemo?.id === id) {
      setActiveMemo(null);
    }
  } catch (error: unknown) {
    console.error('Error deleting memo:', error);
    const errorMessage = isAxiosError(error) && error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data
      ? (error.response.data as { message: string }).message || 'Failed to delete memo. Please try again.'
      : isError(error)
        ? error.message
        : 'An unknown error occurred';
    setError(errorMessage);
  }
};

const handleSave = useCallback(async (updatedMemo: Memo) => {
  if (!updatedMemo?.id) return;
  
  try {
    const response = await axios.patch(`/memos/${updatedMemo.id}`, {
      title: updatedMemo.title,
      content: updatedMemo.content
    });
    
    // Handle different response formats
    const memoData = response.data?.data?.memo || response.data?.memo || response.data;
    
    if (!memoData) {
      throw new Error('Invalid response format from server');
    }
    
    const savedMemo = {
      ...memoData,
      id: memoData._id || memoData.id,
      updatedAt: new Date()
    };
    
    setMemos(prevMemos => 
      prevMemos.map(memo => 
        memo.id === updatedMemo.id ? { ...memo, ...savedMemo } : memo
      )
    );
    return savedMemo;
  } catch (error: unknown) {
    console.error('Error saving memo:', error);
    const errorMessage = (error as any)?.response?.data?.message || 'Failed to save memo. Please try again.';
    setError(errorMessage);
    throw error;
  }
}, []);

// Update the auth check in the component with proper dependencies
useEffect(() => {
  const checkAuth = async () => {
    try {
      // Try the auth endpoint with error handling for 404
      try {
        await axios.get('/auth/me');
      } catch (authError: unknown) {
        if (isAxiosError(authError) && authError.response?.status === 404) {
          console.log('Auth endpoint not found, continuing with memo load...');
        } else {
          throw authError;
        }
      }

      // Load memos after auth check
      await loadMemos();
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        console.error('Auth check failed:', error);
        const errorMessage = isError(error) ? error.message : 'Failed to authenticate. Please try logging in again.';
        setError(errorMessage);
      }
    }
  };

  if (user) {
    checkAuth();
  }
}, [user, logout, navigate]);

// Demo function to create a test memo
const createDemoMemo = async () => {
  try {
    const response = await axios.post('/memos', {
      title: 'Demo Note - Getting Started',
      content: 'This is a demo note to test the memo app functionality.\n\nYou can:\n• Create new notes\n• Edit existing notes\n• Delete notes\n• Search through notes\n\nThe app automatically saves your changes!'
    });

    const newMemo = {
      ...response.data.data.memo,
      id: response.data.data.memo._id || response.data.data.memo.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setMemos(prevMemos => [newMemo, ...prevMemos]);
    setActiveMemo(newMemo);
    setError(null); // Clear any previous errors
  } catch (error: unknown) {
    console.error('Error creating demo memo:', error);
    const errorMessage = isAxiosError(error) && error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data
      ? (error.response.data as { message: string }).message || 'Failed to create demo memo. Please try again.'
      : isError(error)
        ? error.message
        : 'An unknown error occurred';
    setError(errorMessage);
  }
};

// Debounce function to prevent excessive API calls
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Debounced save function
const debouncedSave = useCallback(
  debounce(async (memo: Memo) => {
    try {
      await handleSave(memo);
    } catch (error) {
      console.error('Failed to save memo:', error);
    }
  }, 1000), // Save after 1 second of inactivity
  []
);

// Add error display in the UI
if (error) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          OK
        </button>
      </div>
    </div>
  );
}

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Memo App</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/profile')}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Profile"
              >
                <Icon>
                  <FiUser size={20} />
                </Icon>
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                <Icon>
                  {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
                </Icon>
              </button>
              <button
                onClick={handleLogout}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Logout"
              >
                <Icon>
                  <FiLogOut size={20} />
                </Icon>
              </button>
            </div>
          </div>

          <button
            onClick={handleNewMemo}
            className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Icon className="mr-2"><FiPlus size={18} /></Icon> New Note
          </button>

          <button
            onClick={createDemoMemo}
            className="mt-2 w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Icon className="mr-2"><FiPlus size={18} /></Icon> Create Demo Note
          </button>

          <div className="mt-4 relative">
            <Icon className="absolute left-3 top-2.5 text-gray-400">
              <FiSearch size={18} />
            </Icon>
            <input
              type="text"
              placeholder="Search notes..."
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredMemos.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notes found
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMemos.map(memo => (
                <div
                  key={memo.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    activeMemo?.id === memo.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                  onClick={() => {
                    setActiveMemo(memo);
                    setSidebarOpen(false); // Close sidebar on mobile when selecting a memo
                  }}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium truncate">{memo.title}</h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle edit
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <Icon><FiEdit2 size={16} /></Icon>
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this note?')) {
                            await handleDelete(memo.id);
                          }
                        }}
                        className="p-1 text-red-400 hover:text-red-600"
                        title="Delete note"
                      >
                        <Icon><FiTrash2 size={16} /></Icon>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                    {memo.content.substring(0, 60)}...
                  </p>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(memo.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Hamburger Menu */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Open menu"
          >
            <Icon>
              <FiMenu size={24} />
            </Icon>
          </button>
          <h1 className="text-lg font-semibold">Memo App</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {activeMemo ? (
          <div className="flex-1 flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
              <input
                type="text"
                className="text-xl font-semibold bg-transparent border-none focus:outline-none w-full dark:bg-gray-900"
                value={activeMemo.title}
                onChange={async (e) => {
                  const updatedMemo = { ...activeMemo, title: e.target.value, updatedAt: new Date() };
                  setActiveMemo(updatedMemo);
                  setMemos(memos.map(m => m.id === activeMemo.id ? updatedMemo : m));

                  // Auto-save after a short delay
                  try {
                    await debouncedSave(updatedMemo);
                  } catch (error) {
                    console.error('Failed to save title change:', error);
                  }
                }}
                placeholder="Note Title"
              />
            </div>
            <div className="flex-1 p-4">
              <textarea
                className="w-full h-full p-2 bg-transparent border-none focus:outline-none resize-none dark:bg-gray-900"
                value={activeMemo.content}
                onChange={async (e) => {
                  const updatedMemo = { ...activeMemo, content: e.target.value, updatedAt: new Date() };
                  setActiveMemo(updatedMemo);
                  setMemos(memos.map(m => m.id === activeMemo.id ? updatedMemo : m));

                  // Auto-save after a short delay
                  try {
                    await debouncedSave(updatedMemo);
                  } catch (error) {
                    console.error('Failed to save content change:', error);
                  }
                }}
                placeholder="Start writing your note here..."
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Icon size={48} className="mx-auto mb-4 opacity-30">
                <FiPlus size={48} />
              </Icon>
              <p>Select a note or create a new one</p>
              <button
                onClick={handleNewMemo}
                className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Create New Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <MemoApp />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;