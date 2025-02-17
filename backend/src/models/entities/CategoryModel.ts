import { BaseModel } from '../base/BaseModel';
import { ICategory } from '../interfaces/system';
import { categorySchema } from '../schemas/categories';
import { DbResponse } from '../interfaces/database';

export class CategoryModel extends BaseModel<ICategory> {
  protected tableName = 'categories';
  protected schema = categorySchema;

  /**
   * Find a category by name
   */
  async findByName(name: string): Promise<DbResponse<ICategory>> {
    return await this.findOne({ name });
  }

  /**
   * Find active categories
   */
  async findActive(): Promise<DbResponse<ICategory[]>> {
    return await this.findAll({ is_active: true });
  }

  /**
   * Bulk create categories
   */
  async bulkCreate(categories: Array<Omit<ICategory, 'id' | 'created_at' | 'updated_at'>>): Promise<DbResponse<ICategory[]>> {
    const client = await this.beginTransaction();
    try {
      const createdCategories: ICategory[] = [];

      for (const category of categories) {
        const result = await this.create(category);
        if (!result.success) {
          throw new Error(`Failed to create category: ${result.error}`);
        }
        if (result.data) {
          createdCategories.push(result.data);
        }
      }

      await this.commitTransaction(client);
      return {
        success: true,
        data: createdCategories
      };
    } catch (error) {
      await this.rollbackTransaction(client);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update category status
   */
  async updateStatus(id: string, isActive: boolean): Promise<DbResponse<ICategory>> {
    return await this.update(id, { is_active: isActive });
  }

  /**
   * Search categories by name pattern
   */
  async searchByName(pattern: string): Promise<DbResponse<ICategory[]>> {
    try {
      const query = `
        SELECT *
        FROM ${this.tableName}
        WHERE name ILIKE $1
        ORDER BY name ASC
      `;

      const result = await this.db.query(query, [`%${pattern}%`]);
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get categories with item counts
   */
  async getCategoriesWithItemCounts(): Promise<DbResponse<Array<ICategory & { item_count: number }>>> {
    try {
      const query = `
        SELECT c.*, 
          COUNT(DISTINCT unnest(mi.category_ids)) as item_count
        FROM ${this.tableName} c
        LEFT JOIN menu_items mi ON c.id = ANY(mi.category_ids)
        WHERE c.is_active = true
        GROUP BY c.id
        ORDER BY c.display_order ASC, c.name ASC
      `;

      const result = await this.db.query(query);
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update category orders in bulk
   */
  async bulkUpdateOrder(orders: Array<{ category_id: string; display_order: number }>): Promise<DbResponse<void>> {
    const client = await this.beginTransaction();
    try {
      for (const order of orders) {
        const query = `
          UPDATE ${this.tableName}
          SET display_order = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
        `;
        const result = await client.query(query, [order.display_order, order.category_id]);
        
        if (result.rows.length === 0) {
          throw new Error(`Category not found: ${order.category_id}`);
        }
      }

      await this.commitTransaction(client);
      return { success: true };
    } catch (error) {
      await this.rollbackTransaction(client);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
