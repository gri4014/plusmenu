import { BaseModel } from '../base/BaseModel';
import { DbResponse } from '../interfaces/database';
import { IOrder, IOrderItem, ICreateOrder, IUpdateOrderStatus, ITableSessionOrders, IOrderFilters } from '../interfaces/order';
import pool from '../../config/database';
import { orderSchema } from '../schemas/order';

export class OrderModel extends BaseModel<IOrder> {
  /**
   * Get filtered orders for restaurant
   */
  async getFilteredOrders(filters: IOrderFilters): Promise<DbResponse<IOrder[]>> {
    try {
      let query = `
        SELECT o.*, 
          json_agg(
            json_build_object(
              'id', oi.id,
              'item_id', oi.item_id,
              'name', mi.name,
              'quantity', oi.quantity,
              'price', oi.price,
              'special_requests', oi.special_requests
            )
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN menu_items mi ON oi.item_id = mi.id
        WHERE o.is_active = true
        AND o.restaurant_id = $1
      `;

      const values: any[] = [filters.restaurant_id];
      let paramCount = 1;

      if (filters.status) {
        paramCount++;
        query += ` AND o.status = $${paramCount}`;
        values.push(filters.status);
      }

      if (filters.table_id) {
        paramCount++;
        query += ` AND o.table_id = $${paramCount}`;
        values.push(filters.table_id);
      }

      if (filters.date_from) {
        paramCount++;
        query += ` AND o.created_at >= $${paramCount}`;
        values.push(filters.date_from);
      }

      if (filters.date_to) {
        paramCount++;
        query += ` AND o.created_at <= $${paramCount}`;
        values.push(filters.date_to);
      }

      query += `
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;

      const result = await pool.query(query, values);

      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get orders'
      };
    }
  }

  protected tableName = 'orders';
  protected schema = orderSchema;

  /**
   * Create a new order with items
   */
  async createOrder(data: ICreateOrder): Promise<DbResponse<IOrder>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (
          table_id,
          restaurant_id,
          customer_phone,
          status,
          total_amount,
          created_at,
          updated_at,
          is_active
        )
        SELECT 
          $1,
          t.restaurant_id,
          $2,
          'pending',
          0,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          true
        FROM tables t
        WHERE t.id = $1
        RETURNING *`,
        [data.table_id, data.customer_phone]
      );

      const order = orderResult.rows[0];
      if (!order) {
        throw new Error('Failed to create order');
      }

      // Insert order items
      let totalAmount = 0;
      for (const item of data.items) {
        const itemResult = await client.query(
          `INSERT INTO order_items (
            order_id,
            item_id,
            quantity,
            price,
            special_requests,
            parameters,
            created_at,
            updated_at,
            is_active
          )
          SELECT 
            $1,
            m.id,
            $2,
            m.price * $2,
            $3,
            $4,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            true
          FROM menu_items m
          WHERE m.id = $5 AND m.is_active = true
          RETURNING *`,
          [
            order.id,
            item.quantity,
            item.special_requests || null,
            item.parameters || null,
            item.item_id
          ]
        );

        if (itemResult.rows[0]) {
          totalAmount += itemResult.rows[0].price;
        }
      }

      // Update order total
      await client.query(
        'UPDATE orders SET total_amount = $1 WHERE id = $2',
        [totalAmount, order.id]
      );

      // Insert initial status history
      await client.query(
        `INSERT INTO order_status_history (
          order_id,
          status,
          changed_at
        ) VALUES ($1, 'pending', CURRENT_TIMESTAMP)`,
        [order.id]
      );

      await client.query('COMMIT');

      return {
        success: true,
        data: {
          ...order,
          total_amount: totalAmount
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order'
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get order by ID with items
   */
  async getOrderById(orderId: string): Promise<DbResponse<IOrder & { items: IOrderItem[] }>> {
    try {
      const orderResult = await pool.query(
        `SELECT o.*, 
          json_agg(json_build_object(
            'id', oi.id,
            'item_id', oi.item_id,
            'quantity', oi.quantity,
            'price', oi.price,
            'special_requests', oi.special_requests,
            'parameters', oi.parameters
          )) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1 AND o.is_active = true
        GROUP BY o.id`,
        [orderId]
      );

      const order = orderResult.rows[0];
      if (!order) {
        return {
          success: false,
          error: 'Order not found'
        };
      }

      return {
        success: true,
        data: order
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get order'
      };
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    data: IUpdateOrderStatus,
    adminId: string
  ): Promise<DbResponse<IOrder>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update order status
      const orderResult = await client.query(
        `UPDATE orders 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND is_active = true
        RETURNING *`,
        [data.status, data.order_id]
      );

      if (!orderResult.rows[0]) {
        throw new Error('Order not found');
      }

      // Record status change in history
      await client.query(
        `INSERT INTO order_status_history (
          order_id,
          status,
          changed_by,
          changed_at
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [data.order_id, data.status, adminId]
      );

      await client.query('COMMIT');

      return {
        success: true,
        data: orderResult.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update order status'
      };
    } finally {
      client.release();
    }
  }

  /**
   * Add items to existing order
   */
  async addItemsToOrder(
    orderId: string,
    items: ICreateOrder['items']
  ): Promise<DbResponse<IOrder>> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify order exists and is in valid status
      const orderResult = await client.query(
        `SELECT * FROM orders 
        WHERE id = $1 
        AND is_active = true 
        AND status IN ('pending', 'preparing')`,
        [orderId]
      );

      if (!orderResult.rows[0]) {
        throw new Error('Order not found or cannot be modified');
      }

      // Insert new items
      let additionalAmount = 0;
      for (const item of items) {
        const itemResult = await client.query(
          `INSERT INTO order_items (
            order_id,
            item_id,
            quantity,
            price,
            special_requests,
            parameters,
            created_at,
            updated_at,
            is_active
          )
          SELECT 
            $1,
            m.id,
            $2,
            m.price * $2,
            $3,
            $4,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            true
          FROM menu_items m
          WHERE m.id = $5 AND m.is_active = true
          RETURNING *`,
          [
            orderId,
            item.quantity,
            item.special_requests || null,
            item.parameters || null,
            item.item_id
          ]
        );

        if (itemResult.rows[0]) {
          additionalAmount += itemResult.rows[0].price;
        }
      }

      // Update order total
      const updatedOrder = await client.query(
        `UPDATE orders 
        SET total_amount = total_amount + $1, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *`,
        [additionalAmount, orderId]
      );

      await client.query('COMMIT');

      return {
        success: true,
        data: updatedOrder.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add items to order'
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get all orders for a table's current session
   */
  async getOrdersByTableSession(tableId: string): Promise<DbResponse<ITableSessionOrders>> {
    try {
      const result = await pool.query(
        `WITH current_session AS (
          SELECT id 
          FROM table_sessions 
          WHERE table_id = $1 
          AND status = 'active' 
          AND is_active = true
          LIMIT 1
        )
        SELECT 
          o.id,
          o.customer_phone,
          o.status,
          o.total_amount,
          o.created_at,
          json_agg(
            json_build_object(
              'name', mi.name,
              'quantity', oi.quantity,
              'price', oi.price,
              'special_requests', oi.special_requests,
              'status', o.status
            )
          ) as items
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN menu_items mi ON oi.item_id = mi.id
        WHERE o.table_id = $1 
        AND o.is_active = true
        AND EXISTS (
          SELECT 1 FROM current_session
        )
        GROUP BY o.id, o.customer_phone, o.status, o.total_amount, o.created_at
        ORDER BY o.created_at DESC`,
        [tableId]
      );

      const orders = result.rows;
      const totalTableAmount = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);

      return {
        success: true,
        data: {
          orders,
          total_table_amount: totalTableAmount
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get table orders'
      };
    }
  }
}

export default new OrderModel();
