import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { TableModel } from '../../models/entities/TableModel';
import { WaiterCallModel } from '../../models/entities/WaiterCallModel';
import { WaiterCallStatus } from '../../models/interfaces/waiter';
import { wsServer } from '../../config/server';
import { Logger } from '../../utils/logger';

export class TableWaiterController {
  private waiterCallModel: WaiterCallModel;
  private readonly logger: Logger;

  constructor() {
    this.waiterCallModel = new WaiterCallModel();
    this.logger = new Logger('TableWaiterController');
  }

  async callWaiter(req: AuthenticatedRequest, res: Response) {
    const { tableId } = req.params;
    
    try {
      this.logger.info(`Received waiter call request for table ${tableId}`);
      
      // Validate table exists
      const tableModel = new TableModel();
      const table = await tableModel.findById(tableId);
      
      if (!table.success || !table.data) {
        this.logger.warn(`Table not found: ${tableId}`);
        return res.status(404).json({ error: 'Table not found' });
      }

      // Create waiter call
      const waiterCall = await this.waiterCallModel.createWaiterCall({
        table_id: tableId,
        status: 'active'
      });

      if (!waiterCall.success || !waiterCall.data) {
        this.logger.error(`Failed to create waiter call for table ${tableId}: ${waiterCall.error}`);
        return res.status(500).json({ error: waiterCall.error || 'Failed to create waiter call' });
      }

      this.logger.info(`Created waiter call ${waiterCall.data.id} for table ${tableId}`);

      // Emit waiter call event with high priority and persistence
      wsServer.emitWaiterCall({
        callId: waiterCall.data.id,
        tableId: tableId,
        restaurantId: table.data.restaurant_id,
        status: waiterCall.data.status,
        createdAt: waiterCall.data.created_at.toISOString()
      }, {
        priority: 'high',
        persist: true,
        retry: {
          attempts: 5,
          delay: 1000
        }
      });

      this.logger.info(`Emitted waiter call event for call ${waiterCall.data.id}`);

      return res.status(200).json({
        message: 'Waiter has been called',
        table_number: table.data.table_number,
        call_id: waiterCall.data.id,
        restaurant_id: table.data.restaurant_id
      });
    } catch (error) {
      console.error('Error calling waiter:', error);
      return res.status(500).json({ error: 'Failed to call waiter' });
    }
  }

  /**
   * Update waiter call status
   * PATCH /api/waiter-calls/:callId/status
   */
  async updateCallStatus(req: AuthenticatedRequest, res: Response) {
    const { callId } = req.params;
    const { status } = req.body as { status: WaiterCallStatus };

    try {
      this.logger.info(`Updating waiter call ${callId} status to ${status}`);

      // Update status
      const result = await this.waiterCallModel.updateStatus(callId, status);

      if (!result.success) {
        this.logger.warn(`Failed to update waiter call ${callId} status: ${result.error}`);
        return res.status(400).json({ error: result.error });
      }

      if (result.data) {
        // Get table info for restaurant_id
        const tableModel = new TableModel();
        const table = await tableModel.findById(result.data.table_id);
        
        if (table.success && table.data) {
          this.logger.info(`Emitting waiter call resolution for call ${callId}`);
          
          // Emit waiter call resolution event with high priority
          wsServer.emitWaiterCallResolved({
            callId: result.data.id,
            tableId: result.data.table_id,
            restaurantId: table.data.restaurant_id,
            status: result.data.status,
            updatedAt: result.data.updated_at?.toISOString() || new Date().toISOString()
          }, {
            priority: 'high',
            persist: true,
            retry: {
              attempts: 3,
              delay: 1000
            }
          });
        } else {
          this.logger.warn(`Table not found for waiter call ${callId}`);
        }
      }

      this.logger.info(`Successfully updated waiter call ${callId} status`);

      return res.status(200).json({
        message: 'Waiter call status updated successfully',
        call: result.data
      });
    } catch (error) {
      console.error('Error updating waiter call status:', error);
      return res.status(500).json({ error: 'Failed to update waiter call status' });
    }
  }
}
