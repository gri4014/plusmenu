import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '@/services/api';

interface RestaurantAdmin {
  id: string;
  login: string;
  restaurantId: string;
  lastLogin: string | null;
}

interface RestaurantAuthContextType {
  isAuthenticated: boolean;
  admin: RestaurantAdmin | null;
  login: (login: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  isLoading: boolean;
}

const RestaurantAuthContext = createContext<RestaurantAuthContextType | undefined>(undefined);

interface RestaurantAuthProviderProps {
  children: React.ReactNode;
}

export const RestaurantAuthProvider: React.FC<RestaurantAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<RestaurantAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate token and restore session on mount
  useEffect(() => {
    const validateSession = async () => {
      // First check sessionStorage (temporary session)
      let token = sessionStorage.getItem('restaurant_token');
      let isRemembered = false;

      // If no token in sessionStorage, check localStorage (remembered session)
      if (!token) {
        token = localStorage.getItem('restaurant_token');
        isRemembered = true;
      }
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/restaurant/auth/validate');
        if (!response.data?.admin) {
          // Token is invalid, clean up
          localStorage.removeItem('restaurant_token');
          localStorage.removeItem('restaurant_session_id');
          sessionStorage.removeItem('restaurant_token');
          sessionStorage.removeItem('restaurant_session_id');
          setAdmin(null);
        } else {
          setAdmin(response.data.admin);
        }
      } catch (error) {
        console.error('Restaurant session validation error:', error);
        // Clean up on validation error
        localStorage.removeItem('restaurant_token');
        localStorage.removeItem('restaurant_session_id');
        sessionStorage.removeItem('restaurant_token');
        sessionStorage.removeItem('restaurant_session_id');
        setAdmin(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = useCallback(async (login: string, password: string, rememberMe: boolean) => {
    try {
      // Clean up any existing tokens before login
      localStorage.removeItem('restaurant_token');
      sessionStorage.removeItem('restaurant_token');

      const response = await api.post('/restaurant/auth/login', { login, password });
      const { token, sessionId, admin } = response.data;
      
      // Store token and session ID based on remember me preference
      if (rememberMe) {
        localStorage.setItem('restaurant_token', token);
        localStorage.setItem('restaurant_session_id', sessionId);
      } else {
        sessionStorage.setItem('restaurant_token', token);
        sessionStorage.setItem('restaurant_session_id', sessionId);
      }
      
      setAdmin(admin);
    } catch (error) {
      console.error('Restaurant login error:', error);
      // Clean up any tokens on login error
      localStorage.removeItem('restaurant_token');
      sessionStorage.removeItem('restaurant_token');
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.post('/restaurant/auth/logout');
    } catch (error) {
      console.error('Restaurant logout error:', error);
    } finally {
      // Always clean up local state
      localStorage.removeItem('restaurant_token');
      localStorage.removeItem('restaurant_session_id');
      sessionStorage.removeItem('restaurant_token');
      sessionStorage.removeItem('restaurant_session_id');
      setAdmin(null);
      setIsLoading(false);
    }
  }, []);

  // Force logout (used for session expiration or token invalidation)
  const forceLogout = useCallback(() => {
    localStorage.removeItem('restaurant_token');
    localStorage.removeItem('restaurant_session_id');
    sessionStorage.removeItem('restaurant_token');
    sessionStorage.removeItem('restaurant_session_id');
    setAdmin(null);
  }, []);

  const value = {
    isAuthenticated: !!admin,
    admin,
    login,
    logout,
    forceLogout,
    isLoading,
  };

  return <RestaurantAuthContext.Provider value={value}>{children}</RestaurantAuthContext.Provider>;
};

export const useRestaurantAuth = () => {
  const context = useContext(RestaurantAuthContext);
  if (context === undefined) {
    throw new Error('useRestaurantAuth must be used within a RestaurantAuthProvider');
  }
  return context;
};
