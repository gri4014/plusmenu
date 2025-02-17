import axios, { InternalAxiosRequestConfig } from 'axios';
import { IRestaurant } from '../types/restaurant';

interface Developer {
  id: string;
  login: string;
  lastLogin: string | null;
}

// Extend AxiosRequestConfig to include our custom properties
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    retry?: number;
    retryDelay?: number;
  }
}

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3002') + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add token and session ID to requests if they exist
api.interceptors.request.use((config) => {
  // Check for developer token first
  let token = localStorage.getItem('token') || sessionStorage.getItem('token');
  let sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
  
  // If no developer token, check for restaurant token
  if (!token) {
    token = localStorage.getItem('restaurant_token') || sessionStorage.getItem('restaurant_token');
    sessionId = localStorage.getItem('restaurant_session_id') || sessionStorage.getItem('restaurant_session_id');
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }

  // Add retry configuration
  config.retry = 3;
  config.retryDelay = 1000;

  // Log request details in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Request:', {
      url: config.url,
      method: config.method,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? '[REDACTED]' : undefined
      }
    });
  }
  
  return config;
});

// Configure request timeout
api.defaults.timeout = 10000; // 10 seconds timeout

// Handle token expiration and errors
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Log error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        headers: {
          ...error.config?.headers,
          Authorization: error.config?.headers?.Authorization ? '[REDACTED]' : undefined
        },
        error: error.message,
        stack: error.stack
      });
    }

    // Network error
    if (!error.response) {
      throw new Error('Network Error: Unable to connect to the server');
    }

    // Unauthorized - token expired or invalid
    if (error.response.status === 401) {
      // Clear both developer and restaurant tokens
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('restaurant_token');
      sessionStorage.removeItem('restaurant_token');
      localStorage.removeItem('sessionId');
      sessionStorage.removeItem('sessionId');
      localStorage.removeItem('restaurant_session_id');
      sessionStorage.removeItem('restaurant_session_id');
      
      // Only redirect if we're not already on a login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = window.location.pathname.includes('/restaurant') 
          ? '/restaurant/login' 
          : '/login';
      }
      
      throw new Error('401: Unauthorized - Please log in again');
    }

    // Not Found error
    if (error.response.status === 404) {
      const path = error.config?.url || 'requested resource';
      throw new Error(`404: Not Found - The ${path} could not be found`);
    }

    // Server error
    if (error.response.status >= 500) {
      throw new Error(`${error.response.status}: Server Error - Please try again later`);
    }

    // Other client errors
    const message = error.response.data?.error || error.response.data?.message || error.response.statusText;
    const details = error.response.data?.details;
    const stack = error.stack;
    
    let errorMessage = message;
    if (details) {
      errorMessage += `\nDetails: ${typeof details === 'string' ? details : JSON.stringify(details, null, 2)}`;
    }
    if (stack && process.env.NODE_ENV === 'development') {
      errorMessage += `\nStack: ${stack}`;
    }
    
    throw new Error(errorMessage);
  }
);

interface LoginResponse {
  token: string;
  sessionId: string;
  developer: {
    id: string;
    login: string;
    lastLogin: string | null;
  };
}

interface LoginData {
  login: string;
  password: string;
}

// Auth API methods
const authApi = {
  login: async (data: LoginData): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/developer/auth/login', data);
      return response.data;
    } catch (error) {
      // Enhance error messages for specific cases
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Invalid credentials. Please check your login and password.');
        }
        if (error.message.includes('Network Error')) {
          throw new Error('Unable to connect to the server. Please check your internet connection.');
        }
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/developer/auth/logout');
    } finally {
      // Always clear storage even if the logout request fails
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    }
  },

  // Check if the current token is valid
  validateToken: async (): Promise<{ success: boolean; developer?: Developer }> => {
    try {
      const response = await api.get<{ developer: Developer }>('/developer/auth/validate');
      return {
        success: true,
        developer: response.data.developer
      };
    } catch {
      return {
        success: false
      };
    }
  },
};

// Dashboard API methods
const dashboardApi = {
  getActiveOrders: () => api.get('/orders?status=active'),
  getActiveTables: () => api.get('/tables/sessions/active'),
  getSystemHealth: () => api.get('/system/health')
};

// Restaurant API methods
const restaurantApi = {
  getRestaurants: async (params: {
    limit?: number;
    offset?: number;
    search?: string;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }) => {
    const response = await api.get<{ success: boolean; data: { data: IRestaurant[]; total: number } }>('/developer/restaurants', { params });
    return response.data;
  },
  
  getRestaurantById: (id: string) => 
    api.get<{ data: IRestaurant }>(`/developer/restaurants/${id}`),
  
  createRestaurant: async (data: {
    name: string;
    theme_colors?: {
      primary: string;
      secondary: string;
      accent: string;
    };
  }) => {
    try {
      const response = await api.post<{ success: boolean; data: IRestaurant; error?: string }>('/developer/restaurants', data);
      if (!response.data.success) {
        throw new Error(response.data.error);
      }
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      const err = error as { response?: { data?: { error?: string } } };
      if (err.response?.data?.error) {
        throw new Error(err.response.data.error);
      }
      throw new Error('Failed to create restaurant');
    }
  },
  
  updateRestaurant: async (id: string, data: Partial<{
    name: string;
    theme_colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  }>) => {
    const response = await api.patch<{ success: boolean; data: IRestaurant }>(`/developer/restaurants/${id}`, data);
    return response.data;
  },
  
  deleteRestaurant: (id: string) => 
    api.delete(`/developer/restaurants/${id}`)
};

export { api as default, restaurantApi, authApi, dashboardApi };
