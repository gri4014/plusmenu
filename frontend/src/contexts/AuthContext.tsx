import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '@/services/api';

interface Developer {
  id: string;
  login: string;
  lastLogin: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  developer: Developer | null;
  login: (login: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate token and restore session on mount
  useEffect(() => {
    const validateSession = async () => {
      // First check sessionStorage (temporary session)
      let token = sessionStorage.getItem('token');
      let isRemembered = false;

      // If no token in sessionStorage, check localStorage (remembered session)
      if (!token) {
        token = localStorage.getItem('token');
        isRemembered = true;
      }
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.validateToken();
        if (!response.success || !response.developer) {
          // Token is invalid, clean up
          localStorage.removeItem('token');
          localStorage.removeItem('sessionId');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('sessionId');
          setDeveloper(null);
        } else {
          setDeveloper(response.developer);
        }
      } catch (error) {
        console.error('Session validation error:', error);
        // Clean up on validation error
        localStorage.removeItem('token');
        localStorage.removeItem('sessionId');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('sessionId');
        setDeveloper(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = useCallback(async (login: string, password: string, rememberMe: boolean) => {
    try {
      // Clean up any existing tokens before login
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');

      const response = await authApi.login({ login, password });
      const { token, sessionId, developer } = response;
      
      // Store token and session ID based on remember me preference
      if (rememberMe) {
        localStorage.setItem('token', token);
        localStorage.setItem('sessionId', sessionId);
      } else {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('sessionId', sessionId);
      }
      
      setDeveloper(developer);
    } catch (error) {
      console.error('Login error:', error);
      // Clean up any tokens on login error
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clean up local state
      localStorage.removeItem('token');
      localStorage.removeItem('sessionId');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('sessionId');
      setDeveloper(null);
      setIsLoading(false);
    }
  }, []);

  // Force logout (used for session expiration or token invalidation)
  const forceLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('sessionId');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('sessionId');
    setDeveloper(null);
  }, []);

  const value = {
    isAuthenticated: !!developer,
    developer,
    login,
    logout,
    forceLogout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
