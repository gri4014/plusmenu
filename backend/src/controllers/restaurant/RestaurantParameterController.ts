import { Response } from 'express';
import { ItemParameterModel } from '../../models/entities/ItemParameterModel';
import { AuthenticatedRequest } from '../../middleware/auth';

const parameterModel = new ItemParameterModel();

export class RestaurantParameterController {
  async getParameters(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false,
          error: 'You must be authenticated to view parameters' 
        });
        return;
      }

      // Only return active parameters for restaurant staff
      const result = await parameterModel.findAll({ is_active: true });
      if (!result.success) {
        res.status(500).json({ 
          success: false,
          error: `Failed to fetch parameters: ${result.error}` 
        });
        return;
      }

      res.json({
        success: true,
        data: result.data || []
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: error instanceof Error 
          ? `Failed to fetch parameters: ${error.message}` 
          : 'Failed to fetch parameters due to an unknown error'
      });
    }
  }
}
