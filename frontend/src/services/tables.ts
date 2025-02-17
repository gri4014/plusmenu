import api from './api';
import { ITable } from '../types/table';
import { AxiosError } from 'axios';

interface ErrorDetails {
  message: string;
  details?: string;
  code?: string | number;
  stack?: string;
}

const handleError = (error: unknown): never => {
  const errorDetails: ErrorDetails = {
    message: 'An unexpected error occurred'
  };

  if (error instanceof AxiosError) {
    if (error.response) {
      // Server responded with error
      errorDetails.message = error.response.data?.error || `Server error: ${error.response.status}`;
      errorDetails.code = error.response.status;
      errorDetails.details = JSON.stringify(error.response.data, null, 2);
    } else if (error.request) {
      // Request made but no response
      errorDetails.message = 'No response from server. Please check your connection.';
      errorDetails.details = 'Request was made but no response was received';
      errorDetails.code = 'NETWORK_ERROR';
    } else {
      // Request setup error
      errorDetails.message = `Request failed: ${error.message}`;
      errorDetails.details = error.stack;
      errorDetails.code = 'REQUEST_SETUP_ERROR';
    }
  } else if (error instanceof Error) {
    errorDetails.message = error.message;
    errorDetails.details = error.stack;
    errorDetails.code = 'UNKNOWN_ERROR';
  }

  // Log error details for debugging
  console.error('Table service error:', {
    ...errorDetails,
    originalError: error
  });

  const error_message = `${errorDetails.message}${errorDetails.details ? `\nDetails: ${errorDetails.details}` : ''}${errorDetails.code ? `\nCode: ${errorDetails.code}` : ''}`;
  throw new Error(error_message);
};

interface ApiResponse<T> {
  data: T;
}

export const tablesService = {
  listTables: async (restaurantId: string): Promise<ITable[]> => {
    try {
      const response = await api.get<ApiResponse<ITable[]>>(`/restaurant/${restaurantId}/tables`);
      return response.data.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createTable: async (restaurantId: string, count: number): Promise<ITable[]> => {
    try {
      const response = await api.post<ApiResponse<ITable[]>>(`/restaurant/${restaurantId}/tables`, { table_number: count });
      return response.data.data;
    } catch (error) {
      return handleError(error);
    }
  },

  deleteTable: async (restaurantId: string, tableId: string): Promise<void> => {
    try {
      await api.delete(`/restaurant/${restaurantId}/tables/${tableId}`);
    } catch (error) {
      handleError(error);
    }
  }
};
