import { BaseModel } from '../base/BaseModel';
import { DbResponse } from '../interfaces';
import { WaiterCall, WaiterCallCreate, WaiterCallStatus, waiterCallSchema } from '../interfaces/waiter';
import pool from '../../config/database';

export interface WaiterCallWithTableInfo extends WaiterCall {
  table_number: number;
  restaurant_id: string;
}

export class WaiterCallModel extends BaseModel<WaiterCall> {
  protected tableName = 'waiter_calls';
  protected schema = waiterCallSchema;

  /**
   * Create a new waiter call
   */
  async createWaiterCall(data: WaiterCallCreate): Promise<DbResponse<WaiterCall>> {
    return this.create(data);
  }

  /**
   * Update waiter call status with validation
   */
  /**
   * Get all waiter calls for a restaurant with table information
   */
  async getWaiterCallsByRestaurant(
    restaurantId: string,
    status?: WaiterCallStatus
  ): Promise<DbResponse<WaiterCallWithTableInfo[]>> {
    try {
      const query = {
        text: `
          SELECT 
            wc.*,
            t.number as table_number,
            t.restaurant_id
          FROM waiter_calls wc
          JOIN tables t ON wc.table_id = t.id
          WHERE t.restaurant_id = $1
          ${status ? 'AND wc.status = $2' : ''}
          ORDER BY wc.created_at DESC
        `,
        values: status ? [restaurantId, status] : [restaurantId]
      };

      const result = await pool.query(query);

      return {
        success: true,
        data: result.rows as WaiterCallWithTableInfo[]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch waiter calls'
      };
    }
  }

  async updateStatus(id: string, newStatus: WaiterCallStatus): Promise<DbResponse<WaiterCall>> {
    try {
      // Get current status
      const currentCall = await this.findById(id);
      if (!currentCall.success || !currentCall.data) {
        return {
          success: false,
          error: 'Waiter call not found'
        };
      }

      // Validate status transition
      const isValidTransition = this.validateStatusTransition(
        currentCall.data.status,
        newStatus
      );

      if (!isValidTransition) {
        return {
          success: false,
          error: `Invalid status transition from ${currentCall.data.status} to ${newStatus}`
        };
      }

      // Update status
      return this.update(id, { status: newStatus });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get active waiter calls for a table
   */
  async getActiveCallsByTableId(tableId: string): Promise<DbResponse<WaiterCall[]>> {
    return this.findAll({ table_id: tableId, status: 'active' });
  }

  /**
   * Validate status transition
   * Only allows: active → acknowledged → completed
   */
  private validateStatusTransition(
    currentStatus: WaiterCallStatus,
    newStatus: WaiterCallStatus
  ): boolean {
    const transitions: Record<WaiterCallStatus, WaiterCallStatus[]> = {
      active: ['acknowledged'],
      acknowledged: ['completed'],
      completed: []
    };

    return transitions[currentStatus].includes(newStatus);
  }
}
