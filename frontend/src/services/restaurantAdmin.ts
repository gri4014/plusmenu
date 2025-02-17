import api from './api';

interface IRestaurantAdmin {
  id: string;
  restaurant_id: string;
  login: string;
  last_login: string | null;
  is_active: boolean;
  created_at: string;
}

interface CreateAdminData {
  login: string;
  password: string;
  permissions: string[];
  is_admin: boolean;
}

interface UpdateAdminData {
  login?: string;
  password?: string;
  is_active?: boolean;
}

export const restaurantAdminApi = {
  // Get all admins for a restaurant
  list: async (restaurantId: string) => {
    const response = await api.get<{ success: boolean; data: IRestaurantAdmin[] }>(
      `/developer/restaurants/${restaurantId}/admins`
    );
    return response.data;
  },

  // Create a new admin
  create: async (restaurantId: string, data: CreateAdminData) => {
    const requestId = Math.random().toString(36).substring(7);
    try {
      console.log(`[restaurantAdminApi][${requestId}] Creating admin:`, {
        restaurantId,
        login: data.login,
        permissions: data.permissions,
        is_admin: data.is_admin,
        timestamp: new Date().toISOString()
      });

      const response = await api.post<{ 
        success: boolean; 
        data: IRestaurantAdmin; 
        error?: string;
        stage?: string;
        details?: any;
      }>(
        `/developer/restaurants/${restaurantId}/admins`,
        data
      );

      console.log(`[restaurantAdminApi][${requestId}] Success:`, {
        success: response.data.success,
        adminId: response.data.data?.id,
        timestamp: new Date().toISOString()
      });

      return response.data;
    } catch (error: any) {
      const errorInfo = {
        requestId,
        message: error.message,
        code: error.response?.status,
        data: error.response?.data,
        stage: error.response?.data?.stage,
        details: error.response?.data?.details,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: `/developer/restaurants/${restaurantId}/admins`,
        method: 'POST'
      };

      console.error('[restaurantAdminApi] Error creating admin:', errorInfo);

      if (error.response?.data) {
        const errorData = error.response.data;
        let errorMessage = errorData.error || 'Failed to create admin';
        
        // Add context based on the stage
        switch (errorData.stage) {
          case 'schema_validation':
            errorMessage = `Validation error: ${errorData.details?.join(', ') || errorMessage}`;
            break;
          case 'permissions_format':
            errorMessage = `Permission format error: Permissions must be provided as an array`;
            break;
          case 'permissions_empty':
            errorMessage = `Permission selection error: At least one permission must be selected`;
            break;
          case 'permissions_values':
            errorMessage = `Invalid permission values: ${errorData.details?.invalidPermissions?.join(', ') || 'Unknown invalid permissions'}`;
            break;
          case 'database_creation':
            errorMessage = `Database error: ${errorMessage}. Please try again or contact support if the issue persists.`;
            break;
          case 'network':
            errorMessage = `Network error: Unable to connect to the server. Please check your connection and try again.`;
            break;
        }

        return {
          success: false,
          error: errorMessage,
          stage: errorData.stage || 'unknown',
          details: errorData.details
        };
      }

      // Handle network or unexpected errors
      const isNetworkError = !error.response && error.message.includes('Network Error');
      return {
        success: false,
        error: isNetworkError 
          ? 'Unable to connect to the server. Please check your internet connection.'
          : 'An unexpected error occurred. Please try again or contact support.',
        stage: isNetworkError ? 'network' : 'unexpected',
        details: errorInfo
      };
    }
  },

  // Update an existing admin
  update: async (restaurantId: string, adminId: string, data: UpdateAdminData) => {
    const response = await api.patch<{ success: boolean; data: IRestaurantAdmin }>(
      `/developer/restaurants/${restaurantId}/admins/${adminId}`,
      data
    );
    return response.data;
  },

  // Delete (deactivate) an admin
  delete: async (restaurantId: string, adminId: string) => {
    const response = await api.delete<{ success: boolean }>(
      `/developer/restaurants/${restaurantId}/admins/${adminId}`
    );
    return response.data;
  }
};

export type { IRestaurantAdmin, CreateAdminData, UpdateAdminData };
