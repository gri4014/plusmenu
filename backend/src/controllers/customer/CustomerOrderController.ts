import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import OrderModel from '../../models/entities/OrderModel';
import { TableSessionModel } from '../../models/entities/TableSessionModel';
import { TableModel } from '../../models/entities/TableModel';
import { MenuItemModel } from '../../models/entities/MenuItemModel';
import { createOrderSchema, addOrderItemsSchema } from '../../models/schemas/order';
import { ICreateOrder } from '../../models/interfaces/order';

const tableSessionModel = new TableSessionModel();
const tableModel = new TableModel();
const menuItemModel = new MenuItemModel();

export class CustomerOrderController {
  /**
   * Get all orders for a table's current session
   */
  async getTableOrders(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.customer) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - customer not authenticated'
        });
      }

      const { tableId } = req.params;

      // Get orders for table's current session
      const result = await OrderModel.getOrdersByTableSession(tableId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('[CustomerOrder] Error getting table orders:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Create a new order for a customer
   */
  async createOrder(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.customer) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - customer not authenticated'
        });
      }

      // Validate request body
      const validationResult = createOrderSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.message
        });
      }

      const { table_id, items } = validationResult.data;

      // Verify active table session
      const sessionResult = await tableSessionModel.getActiveSession(table_id);
      if (!sessionResult.success || !sessionResult.data) {
        return res.status(400).json({
          success: false,
          error: 'No active session found for this table'
        });
      }

      // Verify all menu items exist and are active
      // Get table to get restaurant_id
      const tableResult = await tableModel.findById(table_id);
      if (!tableResult.success || !tableResult.data) {
        return res.status(400).json({
          success: false,
          error: 'Table not found'
        });
      }

      // Get all menu items and filter by IDs
      const itemIds = items.map((item: ICreateOrder['items'][0]) => item.item_id);
      const allMenuItems = await menuItemModel.findByRestaurant(tableResult.data.restaurant_id, { is_active: true });
      
      if (!allMenuItems.success || !allMenuItems.data) {
        return res.status(400).json({
          success: false,
          error: 'Failed to verify menu items'
        });
      }

      const menuItems = allMenuItems.data.filter(item => itemIds.includes(item.id));
      
      if (menuItems.length !== itemIds.length) {
        return res.status(400).json({
          success: false,
          error: 'One or more menu items are not available'
        });
      }

      // Create order with customer's phone number
      const orderResult = await OrderModel.createOrder({
        table_id,
        customer_phone: req.customer.phone_number,
        items: items.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity,
          special_requests: item.special_requests,
          parameters: item.parameters
        }))
      });

      if (!orderResult.success) {
        return res.status(400).json(orderResult);
      }

      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: orderResult.data
      });
    } catch (error) {
      console.error('[CustomerOrder] Error creating order:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get customer's order by ID
   */
  async getOrder(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.customer) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - customer not authenticated'
        });
      }

      const { orderId } = req.params;

      // Get order and verify it belongs to the customer
      const orderResult = await OrderModel.getOrderById(orderId);
      
      if (!orderResult.success || !orderResult.data) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      // Verify order belongs to customer
      if (orderResult.data.customer_phone !== req.customer.phone_number) {
        return res.status(403).json({
          success: false,
          error: 'Access denied - order does not belong to customer'
        });
      }

      return res.status(200).json({
        success: true,
        data: orderResult.data
      });
    } catch (error) {
      console.error('[CustomerOrder] Error getting order:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Add items to an existing order
   */
  async addItemsToOrder(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.customer) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - customer not authenticated'
        });
      }

      const { orderId } = req.params;

      // Validate request body
      const validationResult = addOrderItemsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: validationResult.error.message
        });
      }

      const { items } = validationResult.data;

      // Get order and verify it belongs to the customer
      const orderResult = await OrderModel.getOrderById(orderId);
      if (!orderResult.success || !orderResult.data) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      // Verify order belongs to customer
      if (orderResult.data.customer_phone !== req.customer.phone_number) {
        return res.status(403).json({
          success: false,
          error: 'Access denied - order does not belong to customer'
        });
      }

      // Verify active table session
      const sessionResult = await tableSessionModel.getActiveSession(orderResult.data.table_id);
      if (!sessionResult.success || !sessionResult.data) {
        return res.status(400).json({
          success: false,
          error: 'No active session found for this table'
        });
      }

      // Verify all menu items exist and are active
      const itemIds = items.map((item: ICreateOrder['items'][0]) => item.item_id);
      const allMenuItems = await menuItemModel.findByRestaurant(orderResult.data.restaurant_id, { is_active: true });
      
      if (!allMenuItems.success || !allMenuItems.data) {
        return res.status(400).json({
          success: false,
          error: 'Failed to verify menu items'
        });
      }

      const menuItems = allMenuItems.data.filter(item => itemIds.includes(item.id));
      
      if (menuItems.length !== itemIds.length) {
        return res.status(400).json({
          success: false,
          error: 'One or more menu items are not available'
        });
      }

      // Add items to order
      const result = await OrderModel.addItemsToOrder(orderId, items);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json({
        success: true,
        message: 'Items added to order successfully',
        data: result.data
      });

    } catch (error) {
      console.error('[CustomerOrder] Error adding items to order:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}

export const customerOrderController = new CustomerOrderController();
