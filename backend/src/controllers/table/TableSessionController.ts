import { Response } from 'express';
import { tableSessionModel } from '../../models/entities/TableSessionModel';
import { createTableSessionSchema, updateTableSessionSchema } from '../../models/schemas/session';
import { AuthenticatedRequest } from '../../middleware/auth';
import { sessionDetailsSchema } from '../../models/schemas/session';
import { TableModel } from '../../models/entities/TableModel';
import { wsServer } from '../../config/server';
import { Logger } from '../../utils/logger';
import { ITableSession } from '../../models/interfaces/session';

export class TableSessionController {
  private readonly logger = new Logger('TableSessionController');

  constructor() {
    // Bind methods to ensure proper 'this' context
    this.startSession = this.startSession.bind(this);
    this.updateSessionStatus = this.updateSessionStatus.bind(this);
    this.closeSession = this.closeSession.bind(this);
    this.getActiveSession = this.getActiveSession.bind(this);
    this.getSessionDetails = this.getSessionDetails.bind(this);
  }

  /**
   * Start a new table session
   */
  async startSession(req: AuthenticatedRequest, res: Response) {
    try {
      const { tableId } = req.params;
      const deviceId = req.headers['x-device-id'] as string;
      
      if (!deviceId) {
        return res.status(400).json({
          success: false,
          error: 'Device ID is required'
        });
      }

      // Validate request body
      const validationResult = createTableSessionSchema.safeParse({
        table_id: tableId,
        device_id: deviceId,
        phone_number: req.body.phone_number,
        current_preferences: req.body.preferences
      });

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors
        });
      }

      const result = await tableSessionModel.startSession(validationResult.data);

      if (!result.success) {
        return res.status(400).json(result);
      }

      if (result.success && result.data) {
        // Get table info for restaurant_id
        const tableModel = new TableModel();
        const table = await tableModel.findById(result.data.table_id);
        
        if (table.success && table.data) {
          this.logger.info('Starting new table session', {
            sessionId: result.data.id,
            tableId: result.data.table_id,
            restaurantId: table.data.restaurant_id
          });

          // Emit session update event with high priority for new sessions
          wsServer.emitTableSessionUpdate({
            sessionId: result.data.id,
            tableId: result.data.table_id,
            restaurantId: table.data.restaurant_id,
            status: result.data.status,
            updatedAt: result.data.created_at.toISOString()
          }, {
            priority: 'high',
            persist: true,
            retry: {
              attempts: 3,
              delay: 1000
            }
          });
        }
      }

      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start session'
      });
    }
  }

  /**
   * Update session status
   */
  async updateSessionStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { sessionId } = req.params;
      const deviceId = req.headers['x-device-id'] as string;

      // Validate device access
      const accessResult = await tableSessionModel.validateSessionAccess(sessionId, deviceId) as { 
        success: boolean; 
        data?: ITableSession;
        error?: string;
      };
      if (!accessResult.success) {
        return res.status(403).json(accessResult);
      }

      // Validate request body
      const validationResult = updateTableSessionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors
        });
      }

      const result = await tableSessionModel.updateSessionStatus(sessionId, validationResult.data);

      if (!result.success) {
        return res.status(400).json(result);
      }

      if (result.success && result.data) {
        // Get table info for restaurant_id
        const tableModel = new TableModel();
        const table = await tableModel.findById(result.data.table_id);
        
        if (table.success && table.data) {
          this.logger.info('Updating table session status', {
            sessionId: result.data.id,
            tableId: result.data.table_id,
            restaurantId: table.data.restaurant_id,
            oldStatus: accessResult.data?.status,
            newStatus: result.data.status
          });

          // Emit session update event with appropriate priority based on status
          wsServer.emitTableSessionUpdate({
            sessionId: result.data.id,
            tableId: result.data.table_id,
            restaurantId: table.data.restaurant_id,
            status: result.data.status,
            updatedAt: result.data.updated_at?.toISOString() || new Date().toISOString()
          });
        }
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update session status'
      });
    }
  }

  /**
   * Close session (staff only)
   */
  async closeSession(req: AuthenticatedRequest, res: Response) {
    try {
      const { sessionId } = req.params;
      const staffId = req.user?.id; // Set by auth middleware

      if (!staffId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const result = await tableSessionModel.closeSession(sessionId, staffId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      if (result.success && result.data) {
        // Get table info for restaurant_id
        const tableModel = new TableModel();
        const table = await tableModel.findById(result.data.table_id);
        
        if (table.success && table.data) {
          this.logger.info('Closing table session', {
            sessionId: result.data.id,
            tableId: result.data.table_id,
            restaurantId: table.data.restaurant_id,
            closedBy: staffId
          });

          // Emit session update event with high priority for session closure
          wsServer.emitTableSessionUpdate({
            sessionId: result.data.id,
            tableId: result.data.table_id,
            restaurantId: table.data.restaurant_id,
            status: result.data.status,
            updatedAt: result.data.updated_at?.toISOString() || new Date().toISOString()
          }, {
            priority: 'high',
            persist: true,
            retry: {
              attempts: 5,
              delay: 1000
            }
          });
        }
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to close session'
      });
    }
  }

  /**
   * Get active session for table
   */
  async getActiveSession(req: AuthenticatedRequest, res: Response) {
    try {
      const { tableId } = req.params;
      const result = await tableSessionModel.getActiveSession(tableId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get active session'
      });
    }
  }

  /**
   * Get detailed session information
   */
  async getSessionDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const { sessionId } = req.params;
      const deviceId = req.headers['x-device-id'] as string;

      // Validate device access
      const accessResult = await tableSessionModel.validateSessionAccess(sessionId, deviceId) as { 
        success: boolean; 
        data?: ITableSession;
        error?: string;
      };
      if (!accessResult.success) {
        return res.status(403).json(accessResult);
      }

      const result = await tableSessionModel.getSessionDetails(sessionId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      // Validate response format
      const validationResult = sessionDetailsSchema.safeParse(result.data);
      if (!validationResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Invalid session details format',
          details: validationResult.error.errors
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get session details'
      });
    }
  }
}

export const tableSessionController = new TableSessionController();
