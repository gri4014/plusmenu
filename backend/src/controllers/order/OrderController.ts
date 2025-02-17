import { Response } from 'express';
import OrderModel from '../../models/entities/OrderModel';
import { z } from 'zod';
import { createOrderSchema, updateOrderStatusSchema, orderItemSchema, orderFiltersSchema } from '../../models/schemas/order';
import { AuthenticatedRequest } from '../../middleware/auth';
import { wsServer } from '../../config/server';
import { IOrderFilters } from '../../models/interfaces/order';

export class OrderController {
  /**
   * Get filtered orders for restaurant
   */
  async getOrders(req: AuthenticatedRequest, res: Response) {
    try {
      const validationResult = orderFiltersSchema.safeParse(req.query);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.message
        });
      }

      // Get restaurant ID from authenticated admin
      if (!req.restaurantAdmin) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const filters: IOrderFilters = {
        ...validationResult.data,
        restaurant_id: req.restaurantAdmin.restaurant_id
      };
      const result = await OrderModel.getFilteredOrders(filters);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Create a new order
   */
  async createOrder(req: AuthenticatedRequest, res: Response) {
    try {
      // Validate request body
      const validationResult = createOrderSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.message
        });
      }

      // Create order
      const result = await OrderModel.createOrder(validationResult.data);

      if (!result.success) {
        return res.status(400).json(result);
      }

      if (result.data) {
        // Map order items to WebSocket payload format
        const items = (result.data.items || []).map(item => ({
          itemId: item.item_id,
          quantity: item.quantity,
          notes: item.special_requests
        }));

        // Common options for order events
        const options = {
          priority: 'high' as const,
          persist: true,
          retry: {
            attempts: 5,
            delay: 1000
          }
        };

        // Emit new order event
        wsServer.emitNewOrder({
          orderId: result.data.id,
          tableId: result.data.table_id,
          restaurantId: result.data.restaurant_id,
          items,
          createdAt: result.data.created_at.toISOString()
        }, options);
      }

      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const { orderId } = req.params;

      const result = await OrderModel.getOrderById(orderId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(req: AuthenticatedRequest, res: Response) {
    try {
      // Validate request body
      const validationResult = updateOrderStatusSchema.safeParse({
        order_id: req.params.orderId,
        status: req.body.status
      });

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.message
        });
      }

      // Get admin ID from authenticated user
      const adminId = req.user?.id;
      if (!adminId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const result = await OrderModel.updateOrderStatus(
        validationResult.data,
        adminId
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      if (result.data) {
        // Common options for order events
        const options = {
          priority: 'high' as const,
          persist: true,
          retry: {
            attempts: 5,
            delay: 1000
          }
        };

        // Emit order status update event
        wsServer.emitOrderStatusUpdate({
          orderId: result.data.id,
          status: result.data.status,
          restaurantId: result.data.restaurant_id,
          tableId: result.data.table_id,
          updatedAt: result.data.updated_at?.toISOString() || new Date().toISOString()
        }, options);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Add items to existing order
   */
  async addItemsToOrder(req: AuthenticatedRequest, res: Response) {
    try {
      // Validate request body
      const validationResult = z.array(orderItemSchema).safeParse(req.body.items);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.message
        });
      }

      const result = await OrderModel.addItemsToOrder(
        req.params.orderId,
        validationResult.data
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}

export default new OrderController();
