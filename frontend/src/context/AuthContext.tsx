import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

interface Business {
  id: number | null;
  name: string;
  type: string;
  health_score: number;
  health_recommendations: string[];
}

interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  business: Business;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (formData: FormData) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const data = await authService.getMe();
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch current user profile:", err);
      setUser(null);
      localStorage.removeItem('bizpilot_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('bizpilot_token');
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (formData: FormData) => {
    setLoading(true);
    try {
      const data = await authService.login(formData);
      localStorage.setItem('bizpilot_token', data.access_token);
      await refreshUser();
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signup = async (userData: any) => {
    setLoading(true);
    try {
      await authService.signup(userData);
      // Automatically log them in after signup
      const formData = new FormData();
      formData.append('username', userData.email);
      formData.append('password', userData.password);
      await login(formData);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('bizpilot_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
