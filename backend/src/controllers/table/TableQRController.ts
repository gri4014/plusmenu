import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { qrCodeService } from '../../services/qr/QRCodeService';
import { tableSessionModel } from '../../models/entities/TableSessionModel';
import { TableModel } from '../../models/entities/TableModel';
import { TableStatus } from '../../models/interfaces/system';

export class TableQRController {
  private tableModel: TableModel;

  constructor() {
    // Bind methods to ensure proper 'this' context
    this.joinSession = this.joinSession.bind(this);
    this.tableModel = new TableModel();
  }

  /**
   * Join a table session via QR code
   * @route POST /api/tables/join-session
   */
  async joinSession(req: AuthenticatedRequest, res: Response) {
    try {
      const deviceId = req.headers['x-device-id'] as string;
      const { qrData } = req.body;

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          error: 'Device ID is required'
        });
      }

      if (!qrData) {
        return res.status(400).json({
          success: false,
          error: 'QR code data is required'
        });
      }

      // Validate QR code
      if (!qrCodeService.validateQRCode(qrData)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired QR code'
        });
      }

      // Parse QR data
      const data = JSON.parse(qrData);
      const { tableId, restaurantId } = data;

      // Check if table exists and is available
      const tableResult = await this.tableModel.findById(tableId);
      if (!tableResult.success || !tableResult.data) {
        return res.status(404).json({
          success: false,
          error: 'Table not found'
        });
      }

      if (tableResult.data.status !== TableStatus.AVAILABLE) {
        return res.status(400).json({
          success: false,
          error: 'Table is not available'
        });
      }

      // Check if table belongs to the correct restaurant
      if (tableResult.data.restaurant_id !== restaurantId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid table for this restaurant'
        });
      }

      // Check for existing active session
      const existingSession = await tableSessionModel.getActiveSession(tableId);
      if (existingSession.success && existingSession.data) {
        return res.status(400).json({
          success: false,
          error: 'Table already has an active session'
        });
      }

      // Create new session
      const sessionResult = await tableSessionModel.startSession({
        table_id: tableId,
        device_id: deviceId,
        phone_number: req.body.phone_number,
        current_preferences: req.body.preferences
      });

      if (!sessionResult.success) {
        return res.status(500).json(sessionResult);
      }

      return res.status(201).json(sessionResult);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join session'
      });
    }
  }
}

export const tableQRController = new TableQRController();
