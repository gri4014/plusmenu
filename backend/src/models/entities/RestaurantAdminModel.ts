import { BaseModel } from '../base/BaseModel';
import { IRestaurantAdmin, ILoginCredentials } from '../interfaces/auth';
import { DbResponse } from '../interfaces/database';
import { baseEntitySchema } from '../schemas/common';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { logger } from '../../utils/logger';
import { DbError, ErrorType } from '../../utils/errors';

/**
 * Model for managing restaurant administrator accounts
 */
export class RestaurantAdminModel extends BaseModel<IRestaurantAdmin> {
  protected tableName = 'restaurant_admins';
  protected schema = z.object({
    ...baseEntitySchema.shape,
    restaurant_id: z.string().uuid(),
    login: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
    password_hash: z.string().min(60).max(255),
    last_login: z.date().optional(),
    permissions: z.union([
      z.array(z.enum(['MENU', 'ORDER', 'TABLE', 'ADMIN', 'THEME'])),
      z.string()
    ]).transform((val) => {
      if (Array.isArray(val)) {
        return JSON.stringify(val);
      }
      // Validate JSON string format
      try {
        const parsed = JSON.parse(val);
        if (!Array.isArray(parsed)) {
          throw new Error('Permissions must be an array');
        }
        const validPermissions = ['MENU', 'ORDER', 'TABLE', 'ADMIN', 'THEME'];
        const invalidPerms = parsed.filter((p: string) => !validPermissions.includes(p));
        if (invalidPerms.length > 0) {
          throw new Error(`Invalid permissions: ${invalidPerms.join(', ')}`);
        }
        return val;
      } catch (error) {
        throw new Error(`Invalid permissions format: ${error.message}`);
      }
    }),
    is_admin: z.boolean()
  });

  /**
   * Find a restaurant admin by login
   */
  async findByLogin(login: string): Promise<DbResponse<IRestaurantAdmin>> {
    try {
      const result = await this.findOne({ login, is_active: true });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Find all admins for a specific restaurant
   */
  async findByRestaurant(restaurantId: string): Promise<DbResponse<IRestaurantAdmin[]>> {
    try {
      const result = await this.findAll({ restaurant_id: restaurantId, is_active: true });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create a new restaurant admin with password hashing
   */
  async createRestaurantAdmin(
    restaurantId: string,
    login: string,
    password: string,
    permissions: string[],
    is_admin: boolean
  ): Promise<DbResponse<IRestaurantAdmin>> {
    try {
      // Stage 1: Check if login is already taken
      const existingAdmin = await this.findByLogin(login);
      if (existingAdmin.success) {
        logger.error('[RestaurantAdminModel] Login already exists:', login);
        return {
          success: false,
          error: new DbError(
            ErrorType.VALIDATION,
            'Login already exists',
            { login }
          )
        };
      }

      // Stage 2: Hash password
      try {
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Stage 3: Create admin
        try {
          const result = await this.create({
            restaurant_id: restaurantId,
            login,
            password_hash,
            is_active: true,
            permissions: JSON.stringify(permissions), // Convert array to JSON string for JSONB
            is_admin
          });

          if (!result.success) {
            logger.error('[RestaurantAdminModel] Failed to create admin:', {
              error: result.error,
              login,
              restaurantId,
              permissions
            });
            return {
              success: false,
              error: new DbError(
                ErrorType.DATABASE,
                'Failed to create admin account',
                {
                  cause: result.error,
                  context: {
                    login,
                    restaurantId,
                    permissions
                  }
                }
              )
            };
          }

          return result;
        } catch (error) {
          logger.error('[RestaurantAdminModel] Database error creating admin:', {
            error,
            login,
            restaurantId,
            permissions
          });
          return {
            success: false,
            error: new DbError(
              ErrorType.DATABASE,
              'Database error while creating admin account',
              {
                cause: error,
                context: {
                  login,
                  restaurantId,
                  permissions
                }
              }
            )
          };
        }

      } catch (error) {
        logger.error('[RestaurantAdminModel] Error hashing password:', error);
        return {
          success: false,
          error: new DbError(
            ErrorType.INTERNAL,
            'Error while hashing password',
            {
              cause: error,
              context: {
                login,
                restaurantId
              }
            }
          )
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate restaurant admin credentials
   */
  async validateCredentials(credentials: ILoginCredentials): Promise<DbResponse<IRestaurantAdmin>> {
    try {
      const { login, password } = credentials;

      // Find admin
      const admin = await this.findByLogin(login);
      if (!admin.success || !admin.data) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Verify password
      const isValid = await bcrypt.compare(password, admin.data.password_hash);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Update last login
      await this.updateLastLogin(admin.data.id);

      return admin;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update admin's last login timestamp
   */
  private async updateLastLogin(id: string): Promise<void> {
    try {
      await this.update(id, {
        last_login: new Date()
      });
    } catch (error) {
      // Log error but don't throw - this is a non-critical operation
      console.error('Failed to update last login:', error);
    }
  }

  /**
   * Change admin's password
   */
  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<DbResponse<void>> {
    try {
      // Get admin
      const admin = await this.findById(id);
      if (!admin.success || !admin.data) {
        return {
          success: false,
          error: 'Admin not found'
        };
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, admin.data.password_hash);
      if (!isValid) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      // Hash new password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      const result = await this.update(id, { password_hash });
      if (!result.success) {
        return {
          success: false,
          error: 'Failed to update password'
        };
      }

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Deactivate a restaurant admin account
   */
  async deactivateAdmin(id: string): Promise<DbResponse<void>> {
    try {
      const result = await this.update(id, { is_active: false });
      if (!result.success) {
        return {
          success: false,
          error: 'Failed to deactivate admin account'
        };
      }

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
