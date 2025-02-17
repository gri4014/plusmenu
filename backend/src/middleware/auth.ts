import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/auth/JWTService';
import { sessionService } from '../services/auth/SessionService';
import { roleService } from '../services/auth/RoleService';
import { RoleType, ResourceType, ActionType } from '../types/rbac';
import { IDeveloper, IRestaurantAdmin } from '../models/interfaces/auth';
import { ICustomer } from '../models/interfaces/customer';

/**
 * Extended Request interface to include authenticated user data
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: RoleType;
    sessionId: string;
    entity?: IDeveloper | IRestaurantAdmin | ICustomer;
  };
  restaurantAdmin?: IRestaurantAdmin;
  customer?: ICustomer;
}

/**
 * Middleware to verify JWT token and session
 */
export const verifyAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Validate token
    const tokenValidation = jwtService.validateToken(token);
    if (!tokenValidation.valid) {
      res.status(401).json({ error: tokenValidation.error.message });
      return;
    }

    // Get session ID from header
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      res.status(401).json({ error: 'No session ID provided' });
      return;
    }

    // Validate session
    const sessionValidation = sessionService.validateSession(sessionId);
    if (!sessionValidation.valid) {
      res.status(401).json({ error: sessionValidation.error });
      return;
    }

    // Update session activity
    sessionService.updateSessionActivity(sessionId);

    // Add user data to request
    req.user = {
      id: tokenValidation.payload.id,
      role: tokenValidation.payload.role,
      sessionId,
      entity: tokenValidation.payload.entity
    };

    // Set role-specific entity
    if (req.user.entity) {
      if (req.user.role === RoleType.RESTAURANT_ADMIN && 'restaurant_id' in req.user.entity) {
        req.restaurantAdmin = req.user.entity as IRestaurantAdmin;
      } else if (req.user.role === RoleType.CUSTOMER && 'phone_number' in req.user.entity) {
        req.customer = req.user.entity as ICustomer;
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Middleware factory to verify role permissions
 */
export const verifyPermission = (resource: ResourceType, action: ActionType) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const permissionCheck = roleService.checkPermission(
        req.user.role,
        resource,
        action
      );

      if (!permissionCheck.granted) {
        res.status(403).json({ error: permissionCheck.reason });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Permission check error' });
    }
  };
};

/**
 * Middleware to verify developer role
 */
export const verifyDeveloper = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (req.user.role !== RoleType.DEVELOPER) {
      res.status(403).json({ error: 'Developer access required' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Role verification error' });
  }
};

/**
 * Combined middleware for developer authentication
 * Combines verifyAuth and verifyDeveloper
 */
export const authenticateDeveloper = [verifyAuth, verifyDeveloper];

/**
 * Middleware to verify restaurant admin role
 */
export const verifyRestaurantAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (req.user.role !== RoleType.RESTAURANT_ADMIN) {
      res.status(403).json({ error: 'Restaurant admin access required' });
      return;
    }

    if (!req.restaurantAdmin) {
      res.status(401).json({ error: 'Restaurant admin data not found' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Role verification error' });
  }
};

/**
 * Combined middleware for restaurant staff authentication
 * Combines verifyAuth and verifyRestaurantAdmin
 */
export const authenticateRestaurantStaff = [verifyAuth, verifyRestaurantAdmin];

/**
 * Middleware to verify customer role
 */
export const verifyCustomer = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (req.user.role !== RoleType.CUSTOMER) {
      res.status(403).json({ error: 'Customer access required' });
      return;
    }

    if (!req.customer) {
      res.status(401).json({ error: 'Customer data not found' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Role verification error' });
  }
};

/**
 * Combined middleware for customer authentication
 * Combines verifyAuth and verifyCustomer
 */
export const authenticateCustomer = [verifyAuth, verifyCustomer];

/**
 * Middleware to verify higher privilege
 * Useful when one role tries to modify another role's data
 */
export const verifyHigherPrivilege = (targetRole: RoleType) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!roleService.hasHigherPrivilege(req.user.role, targetRole)) {
        res.status(403).json({ error: 'Insufficient privileges' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Privilege check error' });
    }
  };
};
