import { Request, Response } from 'express';
import { DeveloperModel } from '../../models/entities/DeveloperModel';
import { sessionService } from '../../services/auth/SessionService';
import { RoleType } from '../../types/rbac';
import { AuthenticatedRequest } from '../../middleware/auth';

export class DeveloperAuthController {
  private developerModel: DeveloperModel;

  constructor() {
    this.developerModel = new DeveloperModel();
  }

  /**
   * Handle developer login
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { login, password } = req.body;

      // Validate credentials
      const result = await this.developerModel.validateCredentials({ login, password });
      if (!result.success || !result.data) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const developer = result.data;

      // Create session and generate token
      const session = sessionService.createSession({
        userId: developer.id,
        role: RoleType.DEVELOPER
      });

      res.status(200).json({
        token: session.token,
        sessionId: session.id,
        developer: {
          id: developer.id,
          login: developer.login,
          lastLogin: developer.last_login
        }
      });
    } catch (error) {
      console.error('Developer login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Handle developer logout
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
      console.error('Developer logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Validate developer session and return developer info
   */
  public validate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await this.developerModel.findById(req.user.id);
      
      if (!result.success || !result.data) {
        res.status(404).json({ error: 'Developer not found' });
        return;
      }

      res.status(200).json({
        developer: {
          id: result.data.id,
          login: result.data.login,
          lastLogin: result.data.last_login
        }
      });
    } catch (error) {
      console.error('Developer validation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Export singleton instance
export const developerAuthController = new DeveloperAuthController();
