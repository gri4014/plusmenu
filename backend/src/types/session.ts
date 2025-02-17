import { z } from 'zod';
import { RoleType } from './rbac';
import { IDeveloper, IRestaurantAdmin } from '../models/interfaces/auth';
import { ICustomer } from '../models/interfaces/customer';

/**
 * Interface for session data
 */
export interface Session {
  /** Unique session identifier */
  id: string;
  /** ID of the user who owns this session */
  userId: string;
  /** User's role in the system */
  role: RoleType;
  /** User entity data */
  entity?: IDeveloper | IRestaurantAdmin | ICustomer;
  /** When the session was created */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivity: Date;
  /** JWT token associated with this session */
  token: string;
}

/**
 * Parameters for creating a new session
 */
export interface SessionCreateParams {
  /** ID of the user to create session for */
  userId: string;
  /** User's role in the system */
  role: RoleType;
  /** User entity data */
  entity?: IDeveloper | IRestaurantAdmin | ICustomer;
}

/**
 * Session validation schema
 */
export const sessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['developer', 'restaurant_admin', 'customer']),
  entity: z.any().optional(),
  createdAt: z.date(),
  lastActivity: z.date(),
  token: z.string()
});

/**
 * Session creation parameters schema
 */
export const sessionCreateParamsSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['developer', 'restaurant_admin', 'customer']),
  entity: z.any().optional()
});

/**
 * Type for session validation result
 */
export type SessionValidationResult = {
  valid: true;
  session: Session;
} | {
  valid: false;
  error: string;
};
