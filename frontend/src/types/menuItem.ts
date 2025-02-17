import { DataType } from './common';

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_ids: string[];
  image_url?: string; // Primary image (backward compatibility)
  image_urls?: string[]; // All images
  is_active: boolean;
  parameters: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface CreateMenuItemData {
  name: string;
  description?: string;
  price: number;
  category_ids: string[];
  parameters: Record<string, any>;
  is_active: boolean;
  restaurant_id: string;
  image_urls?: string[];
}

export interface UpdateMenuItemData {
  name?: string;
  description?: string;
  price?: number;
  category_ids?: string[];
  parameters?: Record<string, any>;
  is_active?: boolean;
  restaurant_id: string;
}

export interface MenuItemFilters {
  category_id?: string;
  is_active?: boolean;
  search?: string;
}

export interface MenuItemResponse {
  success: boolean;
  data?: MenuItem;
  error?: string;
  message?: string;
}

export interface MenuItemsResponse {
  success: boolean;
  data?: MenuItem[];
  error?: string;
  message?: string;
}

export interface MenuItemsWithCategoriesResponse {
  success: boolean;
  data?: {
    items: MenuItem[];
    categories: Array<{
      id: string;
      name: string;
    }>;
  };
  error?: string;
  message?: string;
}

export interface MenuItemParameter {
  id: string;
  name: string;
  type: DataType;
  min_value?: number;
  max_value?: number;
  required?: boolean;
}

export interface ParameterValidation {
  type: DataType;
  min?: number;
  max?: number;
  required?: boolean;
}
