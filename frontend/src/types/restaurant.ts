export interface IThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface IRestaurant {
  id: string;
  name: string;
  logo_url?: string;
  theme_colors?: IThemeColors;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
}

export interface QueryFilters {
  limit?: number;
  offset?: number;
  order_by?: string;
  order_direction?: 'ASC' | 'DESC';
  is_active?: boolean;
}
