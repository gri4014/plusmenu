import { BaseEntity } from './common';

/**
 * Interface for developer accounts
 */
export interface IDeveloper extends BaseEntity {
  login: string;
  password_hash: string;
  last_login?: Date;
}

/**
 * Interface for restaurant theme colors
 */
export interface IThemeColors {
  primary: string;
  secondary: string;
  accent: string;
}

/**
 * Interface for restaurant profiles
 */
export interface IRestaurant extends BaseEntity {
  name: string;
  logo_url?: string;
  theme_colors?: IThemeColors;
}

/**
 * Interface for restaurant administrators
 */
export interface IRestaurantAdmin extends BaseEntity {
  restaurant_id: string;
  login: string;
  password_hash: string;
  last_login?: Date;
  permissions: string[] | string; // Can be array in memory or JSON string in DB
  is_admin: boolean;
}

/**
 * Interface for authentication tokens
 */
export interface IAuthToken {
  token: string;
  expires_at: Date;
}

/**
 * Interface for login credentials
 */
export interface ILoginCredentials {
  login: string;
  password: string;
}

/**
 * Interface for authentication response
 */
export interface IAuthResponse {
  user: IDeveloper | IRestaurantAdmin;
  token: IAuthToken;
}
