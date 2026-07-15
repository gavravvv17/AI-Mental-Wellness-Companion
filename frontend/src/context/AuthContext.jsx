import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Listen for the session-expired event fired by api.js on 401
  useEffect(() => {
    const handleExpired = () => {
      setSessionExpired(true);
      logout();
    };
    window.addEventListener('mindmate:session-expired', handleExpired);
    return () => window.removeEventListener('mindmate:session-expired', handleExpired);
  }, [logout]);

  // Restore session from localStorage on boot
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await API.post('/auth/signin', { username, password });
      const { token, id, email, fullName } = response.data;
      const userData = { id, username, email, fullName };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setSessionExpired(false);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid credentials. Please try again.';
      return { success: false, error: message };
    }
  };

  const signup = async (username, email, password, fullName) => {
    try {
      await API.post('/auth/signup', { username, email, password, fullName });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed. Please try again.';
      return { success: false, error: message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, sessionExpired }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
