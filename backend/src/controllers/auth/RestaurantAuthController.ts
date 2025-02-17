import { Request, Response } from 'express';
import { RestaurantAdminModel } from '../../models/entities/RestaurantAdminModel';
import { sessionService } from '../../services/auth/SessionService';
import { RoleType } from '../../types/rbac';
import { AuthenticatedRequest } from '../../middleware/auth';

export class RestaurantAuthController {
  private restaurantAdminModel: RestaurantAdminModel;

  constructor() {
    this.restaurantAdminModel = new RestaurantAdminModel();
  }

  /**
   * Handle restaurant admin login
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { login, password } = req.body;

      // Validate credentials
      const result = await this.restaurantAdminModel.validateCredentials({ login, password });
      if (!result.success || !result.data) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const admin = result.data;

      // Create session and generate token
      const session = sessionService.createSession({
        userId: admin.id,
        role: RoleType.RESTAURANT_ADMIN,
        entity: {
          id: admin.id,
          login: admin.login,
          restaurant_id: admin.restaurant_id,
          password_hash: admin.password_hash,
          permissions: admin.permissions,
          is_admin: admin.is_admin,
          last_login: admin.last_login,
          created_at: admin.created_at,
          updated_at: admin.updated_at,
          is_active: admin.is_active
        }
      });

      res.status(200).json({
        token: session.token,
        sessionId: session.id,
        admin: {
          id: admin.id,
          login: admin.login,
          restaurantId: admin.restaurant_id,
          lastLogin: admin.last_login
        }
      });
    } catch (error) {
      console.error('Restaurant admin login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Handle restaurant admin logout
   */
  public logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const sessionId = req.user?.sessionId;
      
      if (sessionId) {
        // Remove session
        sessionService.removeSession(sessionId);
      }

      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Restaurant admin logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Validate restaurant admin token
   */
  public validate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.restaurantAdmin) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      res.json({
        admin: {
          id: req.restaurantAdmin.id,
          login: req.restaurantAdmin.login,
          restaurantId: req.restaurantAdmin.restaurant_id,
          lastLogin: req.restaurantAdmin.last_login
        }
      });
    } catch (error) {
      console.error('Restaurant admin validation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Export singleton instance
export const restaurantAuthController = new RestaurantAuthController();
