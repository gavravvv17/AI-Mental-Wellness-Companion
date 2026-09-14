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

  useEffect(() => {
    const handleExpired = () => {
      setSessionExpired(true);
      logout();
    };
    window.addEventListener('mindmate:session-expired', handleExpired);
    return () => window.removeEventListener('mindmate:session-expired', handleExpired);
  }, [logout]);

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
      const response = await API.post('/auth/signup', { username, email, password, fullName });
      return { success: true, message: response.data?.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed. Please try again.';
      return { success: false, error: message };
    }
  };

  const verifyOtp = async (email, otp, type = 'EMAIL_VERIFICATION') => {
    try {
      const response = await API.post('/auth/verify-otp', { email, otp, type });
      return { success: true, message: response.data?.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed. Invalid OTP.';
      return { success: false, error: message };
    }
  };

  const resendOtp = async (email, type = 'EMAIL_VERIFICATION') => {
    try {
      const response = await API.post('/auth/resend-otp', { email, type });
      return { success: true, message: response.data?.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP. Please try again.';
      return { success: false, error: message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await API.post('/auth/forgot-password', { email });
      return { success: true, message: response.data?.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to request password reset.';
      return { success: false, error: message };
    }
  };

  const verifyResetOtp = async (email, otp) => {
    try {
      const response = await API.post('/auth/verify-reset-otp', { email, otp, type: 'PASSWORD_RESET' });
      return { success: true, message: response.data?.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid reset code. Please check and try again.';
      return { success: false, error: message };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const response = await API.post('/auth/reset-password', { email, otp, newPassword });
      return { success: true, message: response.data?.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password. Please try again.';
      return { success: false, error: message };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      verifyOtp,
      resendOtp,
      forgotPassword,
      verifyResetOtp,
      resetPassword,
      logout,
      sessionExpired
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
