import { Request as ExpressRequest, Response } from 'express';
import { RoleType } from '../../types/rbac';
import { IDeveloper, IRestaurantAdmin } from '../../models/interfaces/auth';
import { ICustomer } from '../../models/interfaces/customer';
import { TableModel } from '../../models/entities/TableModel';

type Request = ExpressRequest & {
  user?: {
    id: string;
    role: RoleType;
    sessionId: string;
    entity?: IDeveloper | IRestaurantAdmin | ICustomer;
  };
};

export class RestaurantTableController {
  private tableModel = new TableModel();

  public listTables = async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId } = req.params;
      console.log('Listing tables for restaurant:', restaurantId);
      console.log('Request user:', req.user);
      
      const tables = await this.tableModel.findByRestaurantId(restaurantId);
      console.log('Tables query result:', tables);
      
      if (!tables.success) {
        console.error('Failed to fetch tables:', tables.error);
        res.status(500).json({ error: tables.error });
        return;
      }
      
      console.log('Returning tables:', tables.data);
      res.json({ data: tables.data });
    } catch (error) {
      console.error('Error in listTables:', error);
      res.status(500).json({ error: 'Failed to list tables' });
    }
  };

  public createTable = async (req: Request, res: Response): Promise<void> => {
    const client = await this.tableModel.db.connect();
    try {
      const { restaurantId } = req.params;
      const { table_number } = req.body;

      console.log('Creating tables:', {
        restaurantId,
        table_number,
        user: req.user
      });

      await client.query('BEGIN');

      console.log('Creating tables with count:', table_number);
      const result = await this.tableModel.createTableWithQR(restaurantId, table_number);
        
      if (!result.success) {
        console.error('Failed to create tables:', result.error);
        await client.query('ROLLBACK');
        res.status(500).json({ error: result.error });
        return;
      }

      await client.query('COMMIT');
      console.log('Created tables:', result.data);
      res.json({ data: result.data });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating tables:', error);
      res.status(500).json({ error: 'Failed to create tables' });
    } finally {
      client.release();
    }
  };

  public deleteTable = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tableId } = req.params;
      const result = await this.tableModel.deleteTable(tableId);
      if (!result.success) {
        res.status(500).json({ error: result.error });
        return;
      }
      res.json({ message: 'Table deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete table' });
    }
  };
}
