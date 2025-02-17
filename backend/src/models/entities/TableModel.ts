import { BaseModel } from '../base/BaseModel';
import { ITable, TableStatus } from '../interfaces/system';
import { systemTableSchema } from '../schemas';
import { DbResponse } from '../interfaces/database';
import { qrCodeService } from '../../services/qr/QRCodeService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Model for managing restaurant tables and their QR codes
 */
export class TableModel extends BaseModel<ITable> {
  protected tableName = 'tables';
  protected schema = systemTableSchema;

  /**
   * Create a new table with QR code using a transaction client
   */
  private async findNextAvailableTableNumber(client: any, restaurant_id: string): Promise<number> {
    const query = `
      SELECT table_number 
      FROM ${this.tableName} 
      WHERE restaurant_id = $1 AND table_number IS NOT NULL
      ORDER BY table_number ASC
    `;
    const result = await client.query(query, [restaurant_id]);
    const existingNumbers = result.rows
      .map((row: { table_number: number | null }) => row.table_number)
      .filter((num: number | null): num is number => num !== null);
    
    // Find the first gap in the sequence starting from 1
    let nextNumber = 1;
    while (existingNumbers.includes(nextNumber)) {
      nextNumber++;
    }
    
    return nextNumber;
  }

  async createTableWithQR(restaurant_id: string, table_count: number): Promise<DbResponse<ITable[]>> {
    const client = await this.db.connect();
    try {
      console.log('Creating tables:', {
        restaurant_id,
        table_count
      });

      await client.query('BEGIN');

      const tables = [];
      for (let i = 0; i < table_count; i++) {
        const table_number = await this.findNextAvailableTableNumber(client, restaurant_id);

        // Generate QR code
        const { qrCodeIdentifier, qrCodeImagePath } = await qrCodeService.generateQRCode(
          uuidv4(),
          restaurant_id
        );

        // Create table
        const result = await this.createWithClient(client, {
          restaurant_id,
          table_number,
          status: TableStatus.AVAILABLE,
          qr_code_identifier: qrCodeIdentifier,
          qr_code_image_path: qrCodeImagePath,
          is_active: true
        });

        if (!result.success || !result.data) {
          console.error('Failed to create table:', result.error);
          await client.query('ROLLBACK');
          return {
            success: false,
            error: `Failed to create table ${i + 1}: ${result.error}`
          };
        }

        tables.push(result.data);
      }

      await client.query('COMMIT');
      return {
        success: true,
        data: tables
      };
    } catch (error) {
      console.error('Error in createTableWithQR:', error);
      await client.query('ROLLBACK');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create table with QR code'
      };
    } finally {
      client.release();
    }
  }

  /**
   * Find all tables for a restaurant
   */
  async findByRestaurantId(restaurant_id: string): Promise<DbResponse<ITable[]>> {
    try {
      console.log('Finding tables for restaurant:', restaurant_id);
      const query = `
        SELECT *
        FROM ${this.tableName}
        WHERE restaurant_id = $1 AND is_active = true
        ORDER BY table_number ASC
      `;
      
      const result = await this.db.query(query, [restaurant_id]);
      console.log('Found tables:', result.rows);
      
      return {
        success: true,
        data: result.rows as ITable[]
      };
    } catch (error) {
      console.error('Error finding tables:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find tables'
      };
    }
  }

  /**
   * Find a specific table by its number within a restaurant
   */
  async findByTableNumber(restaurant_id: string, table_number: number): Promise<DbResponse<ITable>> {
    const query = `
      SELECT *
      FROM ${this.tableName}
      WHERE restaurant_id = $1 
        AND table_number = $2 
        AND is_active = true
      LIMIT 1
    `;
    
    try {
      const result = await this.db.query(query, [restaurant_id, table_number]);
      if (result.rows.length === 0) {
        return {
          success: true,
          data: undefined
        };
      }
      return {
        success: true,
        data: result.rows[0] as ITable
      };
    } catch (error) {
      console.error('Error finding table by number:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to find table'
      };
    }
  }

  /**
   * Update table status
   */
  async updateStatus(tableId: string, status: TableStatus): Promise<DbResponse<ITable>> {
    return this.update(tableId, { status });
  }

  /**
   * Delete table and its QR code
   */
  async deleteTable(tableId: string): Promise<DbResponse<void>> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const table = await this.findById(tableId);
      if (!table.success || !table.data) {
        return {
          success: false,
          error: 'Table not found'
        };
      }

      // Delete QR code image if it exists
      if (table.data.qr_code_image_path) {
        await qrCodeService.deleteQRCode(table.data.qr_code_image_path);
      }

      // Instead of deleting, mark as inactive and clear table number
      const result = await this.updateWithClient(client, tableId, {
        is_active: false,
        table_number: null
      });

      if (!result.success) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'Failed to update table'
        };
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete table'
      };
    } finally {
      client.release();
    }
  }
}
