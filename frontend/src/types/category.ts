export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithItemCount extends Category {
  item_count: number;
}

export interface CreateCategoryData {
  name: string;
  is_active?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface CategoryResponse {
  success: boolean;
  data?: Category;
  error?: string;
  message?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data?: Category[];
  error?: string;
  message?: string;
}

export interface CategoriesWithItemCountResponse {
  success: boolean;
  data?: CategoryWithItemCount[];
  error?: string;
  message?: string;
}
