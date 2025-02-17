import { Request, Response } from 'express';
import { TableModel } from '../../models/entities/TableModel';
import { TableStatus } from '../../models/interfaces/system';
import { RestaurantModel } from '../../models/entities/RestaurantModel';

export class TableController {
  private tableModel: TableModel;
  private restaurantModel: RestaurantModel;

  constructor() {
    this.tableModel = new TableModel();
    this.restaurantModel = new RestaurantModel();
  }

  /**
   * Create a new table with QR code for a restaurant
   */
  async createTable(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = req.params.restaurantId;
      const { table_number } = req.body;

      // Validate restaurant exists
      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant.success || !restaurant.data) {
        res.status(404).json({ success: false, error: 'Restaurant not found' });
        return;
      }

      // Validate table number
      if (!table_number || typeof table_number !== 'number' || table_number < 1) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid table number. Must be a positive number.' 
        });
        return;
      }

      // Create table with QR code
      const result = await this.tableModel.createTableWithQR(restaurantId, table_number);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create table' 
      });
    }
  }

  /**
   * List all tables for a restaurant
   */
  async listTables(req: Request, res: Response): Promise<void> {
    try {
      const restaurantId = req.params.restaurantId;

      // Validate restaurant exists
      const restaurant = await this.restaurantModel.findById(restaurantId);
      if (!restaurant.success || !restaurant.data) {
        res.status(404).json({ success: false, error: 'Restaurant not found' });
        return;
      }

      const result = await this.tableModel.findByRestaurantId(restaurantId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to list tables' 
      });
    }
  }

  /**
   * Update table status
   */
  async updateTableStatus(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;
      const { status } = req.body;

      // Validate status
      if (!status || !Object.values(TableStatus).includes(status)) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid status. Must be one of: ' + Object.values(TableStatus).join(', ') 
        });
        return;
      }

      // Check if table exists and belongs to the restaurant
      const table = await this.tableModel.findById(tableId);
      if (!table.success || !table.data) {
        res.status(404).json({ success: false, error: 'Table not found' });
        return;
      }

      if (table.data.restaurant_id !== req.params.restaurantId) {
        res.status(403).json({ 
          success: false, 
          error: 'Table does not belong to this restaurant' 
        });
        return;
      }

      const result = await this.tableModel.updateStatus(tableId, status);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update table status' 
      });
    }
  }

  /**
   * Delete/deactivate table
   */
  async deleteTable(req: Request, res: Response): Promise<void> {
    try {
      const { tableId } = req.params;

      // Check if table exists and belongs to the restaurant
      const table = await this.tableModel.findById(tableId);
      if (!table.success || !table.data) {
        res.status(404).json({ success: false, error: 'Table not found' });
        return;
      }

      if (table.data.restaurant_id !== req.params.restaurantId) {
        res.status(403).json({ 
          success: false, 
          error: 'Table does not belong to this restaurant' 
        });
        return;
      }

      const result = await this.tableModel.deleteTable(tableId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json({ success: true, message: 'Table deleted successfully' });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete table' 
      });
    }
  }
}

export const tableController = new TableController();
