import api from './api';
import { DataType } from '../types/common';
import {
  MenuItem,
  CreateMenuItemData,
  UpdateMenuItemData,
  MenuItemFilters,
  MenuItemResponse,
  MenuItemsResponse,
  MenuItemsWithCategoriesResponse,
  ParameterValidation
} from '../types/menuItem';

const MAX_IMAGES = 8;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates parameter value based on its type and constraints
 */
const validateParameter = (
  value: any,
  validation: ParameterValidation
): boolean => {
  const { type, min, max, required } = validation;

  if (required && (value === undefined || value === null)) {
    return false;
  }

  if (value === undefined || value === null) {
    return true; // Optional parameter can be undefined/null
  }

  switch (type) {
    case DataType.BOOLEAN:
      return typeof value === 'boolean';
    case DataType.INTEGER:
      return Number.isInteger(value) && 
        (!min || value >= min) && 
        (!max || value <= max);
    case DataType.FLOAT:
      return typeof value === 'number' && 
        (!min || value >= min) && 
        (!max || value <= max);
    case DataType.SCALE:
      return typeof value === 'number' && 
        value >= 0 && value <= 100;
    case DataType.TEXT:
      return typeof value === 'string';
    default:
      return false;
  }
};

/**
 * Validates image files for upload
 */
const validateImages = (files: File[]): { valid: boolean; error?: string } => {
  if (files.length > MAX_IMAGES) {
    return {
      valid: false,
      error: `Maximum ${MAX_IMAGES} images allowed`
    };
  }

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
      };
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return {
        valid: false,
        error: `File ${file.name} exceeds maximum size of 10MB`
      };
    }
  }

  return { valid: true };
};

/**
 * Menu item service for handling CRUD operations
 */
const menuItemService = {
  /**
   * Get menu items with optional filtering
   */
  getMenuItems: async (filters?: MenuItemFilters): Promise<MenuItemsResponse> => {
    try {
      const response = await api.get('/restaurant/menu/items', {
        params: filters
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch menu items',
        data: []
      };
    }
  },

  /**
   * Get menu items with category details
   */
  getMenuItemsWithCategories: async (): Promise<MenuItemsWithCategoriesResponse> => {
    try {
      const response = await api.get('/restaurant/menu/items/with-categories');
      return response.data;
    } catch (error) {
      console.error('Error creating menu item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create menu item'
      };
    }
  },

  /**
   * Create new menu item
   */
  createMenuItem: async (
    data: CreateMenuItemData,
    images: File[]
  ): Promise<MenuItemResponse> => {
    try {
      const imageValidation = validateImages(images);
      if (!imageValidation.valid) {
        throw new Error(imageValidation.error);
      }

      const formData = new FormData();
      images.forEach(image => formData.append('images', image));
      
      // Helper function to append field to FormData
      const appendField = (key: string, value: any) => {
        if (value === undefined || value === null) return;

        if (Array.isArray(value)) {
          // Handle arrays (like category_ids)
          value.forEach(v => formData.append(`${key}[]`, String(v)));
        } else if (key === 'parameters') {
          // Handle parameters object
          formData.append(key, JSON.stringify(value));
        } else if (key === 'price') {
          // Handle price
          const priceValue = parseFloat(String(value));
          if (isNaN(priceValue) || priceValue <= 0) {
            throw new Error('Price must be a valid number greater than 0');
          }
          formData.append(key, priceValue.toFixed(2));
        } else if (key === 'is_active') {
          // Handle boolean is_active field
          formData.append(key, value === true ? 'true' : 'false');
        } else if (typeof value === 'object') {
          // Handle other objects
          formData.append(key, JSON.stringify(value));
        } else {
          // Handle primitive values
          formData.append(key, String(value));
        }
      };

      // Append each field
      Object.entries(data).forEach(([key, value]) => appendField(key, value));

      const response = await api.post('/restaurant/menu/items', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error updating menu item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update menu item'
      };
    }
  },

  /**
   * Update existing menu item
   */
  updateMenuItem: async (
    itemId: string,
    data: UpdateMenuItemData,
    newImages?: File[]
  ): Promise<MenuItemResponse> => {
    try {
      if (newImages) {
        const imageValidation = validateImages(newImages);
        if (!imageValidation.valid) {
          throw new Error(imageValidation.error);
        }
      }

      const formData = new FormData();
      if (newImages) {
        newImages.forEach(image => formData.append('images', image));
      }

      // Helper function to append field to FormData
      const appendField = (key: string, value: any) => {
        if (value === undefined || value === null) return;

        if (Array.isArray(value)) {
          // Handle arrays (like category_ids)
          value.forEach(v => formData.append(`${key}[]`, String(v)));
        } else if (key === 'parameters') {
          // Handle parameters object
          formData.append(key, JSON.stringify(value));
        } else if (key === 'price') {
          // Handle price
          const priceValue = parseFloat(String(value));
          if (isNaN(priceValue) || priceValue <= 0) {
            throw new Error('Price must be a valid number greater than 0');
          }
          formData.append(key, priceValue.toFixed(2));
        } else if (key === 'is_active') {
          // Handle boolean is_active field
          formData.append(key, value === true ? 'true' : 'false');
        } else if (typeof value === 'object') {
          // Handle other objects
          formData.append(key, JSON.stringify(value));
        } else {
          // Handle primitive values
          formData.append(key, String(value));
        }
      };

      // Append each field
      Object.entries(data).forEach(([key, value]) => appendField(key, value));

      const response = await api.patch(
        `/restaurant/menu/items/${itemId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete menu item'
      };
    }
  },

  /**
   * Delete menu item
   */
  deleteMenuItem: async (itemId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.delete(`/restaurant/menu/items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete menu item'
      };
    }
  },

  /**
   * Validate menu item parameters against their definitions
   */
  validateParameters: (
    parameters: Record<string, any>,
    validations: Record<string, ParameterValidation>
  ): { valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    for (const [key, validation] of Object.entries(validations)) {
      const value = parameters[key];
      if (!validateParameter(value, validation)) {
        errors[key] = `Invalid value for parameter ${key}`;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default menuItemService;
