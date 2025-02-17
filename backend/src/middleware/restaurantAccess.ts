import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export const validateRestaurantAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { restaurantId } = req.params;
    
    if (!req.restaurantAdmin) {
      res.status(401).json({ error: 'Restaurant admin not found in request' });
      return;
    }

    if (req.restaurantAdmin.restaurant_id !== restaurantId) {
      res.status(403).json({ error: 'Access denied to this restaurant' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Restaurant access validation error' });
  }
};
