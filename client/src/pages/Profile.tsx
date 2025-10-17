import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profilePhoto || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjY0IiBjeT0iNjQiIHI9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjY0IiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik05NiAxMDhDMTA4IDk2IDEyMCA4NCA5NiA4NEM3MiA4NCA2NCA5NiA2NCAxMjA4QzY0IDEwOCA3MiA5NiA5NiA5NiI+PC9wYXRoPgo8L3N2Zz4=');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      console.log('Uploading profile photo...');
      const response = await axios.patch('/users/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Upload response:', response.data);

      // Handle different response formats
      const userData = response.data?.data?.user || response.data?.user;
      if (userData) {
        updateUser(userData);
        // Update preview URL with the new profile photo URL
        setPreviewUrl(userData.profilePhoto || '');
        setMessage('Profile photo updated successfully');
        setError('');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      console.error('Error response:', err.response?.data);

      // Handle authentication errors
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        // Trigger logout
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      setError(`Error uploading photo: ${err.response?.data?.error || err.message}`);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors p-2 -m-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5 mr-2 sm:mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
          <div className="w-16 sm:w-20"></div> {/* Spacer for centering */}
        </div>

        {message && (
          <div className="mb-4 sm:mb-6 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-6 lg:space-x-8">
            <div className="flex-shrink-0">
              <img
                className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover mx-auto sm:mx-0"
                src={previewUrl}
                alt="Profile"
              />
            </div>
            <div className="w-full text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">{user?.username}</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">{user?.email}</p>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Change profile photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-gray-700 file:text-primary-700 dark:file:text-primary-600 hover:file:bg-primary-100 dark:hover:file:bg-gray-600"
                  />
                </div>
                {file && (
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    Save Changes
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

};

export default Profile;
