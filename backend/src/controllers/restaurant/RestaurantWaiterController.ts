import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { WaiterCallModel } from '../../models/entities/WaiterCallModel';
import { WaiterCallStatus } from '../../models/interfaces/waiter';

export class RestaurantWaiterController {
  private waiterCallModel: WaiterCallModel;

  constructor() {
    this.waiterCallModel = new WaiterCallModel();
  }

  /**
   * Get all waiter calls for a restaurant
   * GET /api/restaurant/waiter-calls
   */
  async getWaiterCalls(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if user is authenticated and is a restaurant admin
      const admin = req.restaurantAdmin;
      if (!admin) {
        return res.status(401).json({ error: 'Unauthorized - Restaurant admin access required' });
      }

      const restaurantId = admin.restaurant_id;
      const { status } = req.query;

      // Validate status if provided
      if (status && !['active', 'acknowledged', 'completed'].includes(status as string)) {
        return res.status(400).json({
          error: 'Invalid status. Must be one of: active, acknowledged, completed'
        });
      }

      // Get waiter calls
      const result = await this.waiterCallModel.getWaiterCallsByRestaurant(
        restaurantId,
        status as WaiterCallStatus | undefined
      );

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // Format response
      const formattedCalls = (result.data || []).map((call) => ({
        id: call.id,
        table_number: call.table_number,
        status: call.status,
        created_at: call.created_at,
        updated_at: call.updated_at
      }));

      return res.status(200).json({
        message: 'Waiter calls retrieved successfully',
        calls: formattedCalls
      });
    } catch (error) {
      console.error('Error getting waiter calls:', error);
      return res.status(500).json({ error: 'Failed to get waiter calls' });
    }
  }
}
