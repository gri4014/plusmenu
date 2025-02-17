import { BaseModel } from '../base/BaseModel';
import { IRestaurant, IThemeColors } from '../interfaces/auth';
import { restaurantSchema, createRestaurantSchema, updateRestaurantSchema } from '../schemas/auth';
import { DbResponse } from '../interfaces/database';
import { PoolClient } from 'pg';
import { DbError, ErrorType } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * Model for managing restaurant profiles
 */
export class RestaurantModel extends BaseModel<IRestaurant> {
  protected tableName = 'restaurants';
  protected schema = restaurantSchema;

  /**
   * Create a new restaurant with a transaction client
   */
  async createWithClient(
    client: PoolClient,
    data: Omit<IRestaurant, 'id' | 'created_at' | 'updated_at'>
  ): Promise<DbResponse<IRestaurant>> {
    try {
      // Validate with createRestaurantSchema first
      const validationResult = createRestaurantSchema.safeParse(data);
      if (!validationResult.success) {
        return {
          success: false,
          error: new DbError(
            ErrorType.VALIDATION,
            'Validation failed',
            validationResult.error
          )
        };
      }

      const dataToInsert = {
        ...data,
        is_active: 'is_active' in data ? data.is_active : true
      };

      const keys = Object.keys(dataToInsert);
      const values = Object.values(dataToInsert);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');

      const query = `
        INSERT INTO ${this.tableName} (${columns}, created_at, updated_at)
        VALUES (${placeholders}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      logger.info(`Creating ${this.tableName} with data:`, data);
      const result = await client.query(query, values);

      if (!result.rows[0]) {
        return {
          success: false,
          error: new DbError(
            ErrorType.DATABASE,
            `Failed to create ${this.tableName}: No data returned`
          )
        };
      }

      return {
        success: true,
        data: result.rows[0] as IRestaurant
      };
    } catch (error) {
      logger.error(`Error creating ${this.tableName}:`, error);
      return {
        success: false,
        error: new DbError(
          ErrorType.DATABASE,
          `Failed to create ${this.tableName}`,
          error
        )
      };
    }
  }

  /**
   * Override updateWithClient to add any restaurant-specific logic
   */
  async updateWithClient(
    client: PoolClient,
    id: string,
    data: Partial<Omit<IRestaurant, 'id' | 'created_at'>>
  ): Promise<DbResponse<IRestaurant>> {
    try {
      // Validate with updateRestaurantSchema first
      const validationResult = updateRestaurantSchema.safeParse(data);
      if (!validationResult.success) {
        return {
          success: false,
          error: new DbError(
            ErrorType.VALIDATION,
            'Validation failed',
            validationResult.error
          )
        };
      }

      const keys = Object.keys(data);
      if (keys.length === 0) {
        return {
          success: false,
          error: new DbError(
            ErrorType.VALIDATION,
            'No fields to update'
          )
        };
      }

      const setClause = keys
        .map((key, index) => `${key} = $${index + 1}`)
        .join(', ');

      const query = `
        UPDATE ${this.tableName}
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${keys.length + 1}
        RETURNING *
      `;

      const values = [...Object.values(data), id];
      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        return {
          success: false,
          error: new DbError(
            ErrorType.NOT_FOUND,
            'Record not found'
          )
        };
      }

      return {
        success: true,
        data: result.rows[0] as IRestaurant
      };
    } catch (error) {
      logger.error(`Error updating ${this.tableName}:`, error);
      return {
        success: false,
        error: new DbError(
          ErrorType.DATABASE,
          `Failed to update ${this.tableName}`,
          error
        )
      };
    }
  }

  /**
   * Override deleteWithClient to add any restaurant-specific logic
   */
  async deleteWithClient(
    client: PoolClient,
    id: string
  ): Promise<DbResponse<void>> {
    // Add any restaurant-specific validation or preprocessing here
    return super.deleteWithClient(client, id);
  }

  /**
   * Find all restaurants with pagination and search
   */
  async findAllPaginated(options: {
    limit: number;
    offset: number;
    search?: string;
    orderBy: string;
    orderDirection: 'ASC' | 'DESC';
  }): Promise<DbResponse<{ data: IRestaurant[]; total: number }>> {
    try {
      const { limit, offset, search, orderBy, orderDirection } = options;

      let whereClause = 'WHERE is_active = true';
      const params: any[] = [];

      if (search) {
        whereClause += ' AND name ILIKE $1';
        params.push(`%${search}%`);
      }

      const countQuery = `
        SELECT COUNT(*) as total
        FROM ${this.tableName}
        ${whereClause}
      `;

      // Validate orderBy to prevent SQL injection
      const validColumns = ['created_at', 'name', 'id'];
      const safeOrderBy = validColumns.includes(orderBy) ? orderBy : 'created_at';
      const safeOrderDirection = orderDirection === 'ASC' ? 'ASC' : 'DESC';

      const dataQuery = `
        SELECT *
        FROM ${this.tableName}
        ${whereClause}
        ORDER BY "${safeOrderBy}" ${safeOrderDirection}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      const queryParams = [...params];
      if (limit !== undefined) queryParams.push(limit);
      if (offset !== undefined) queryParams.push(offset);

      const [countResult, dataResult] = await Promise.all([
        this.db.query(countQuery, params),
        this.db.query(dataQuery, queryParams)
      ]);

      return {
        success: true,
        data: {
          data: dataResult.rows as IRestaurant[],
          total: parseInt(countResult.rows[0].total)
        }
      };
    } catch (error) {
      logger.error(`Error finding restaurants:`, error);
      return {
        success: false,
        error: new DbError(
          ErrorType.DATABASE,
          'Failed to find restaurants',
          error
        )
      };
    }
  }

  /**
   * Find all active restaurants
   */
  async findActiveRestaurants(): Promise<DbResponse<IRestaurant[]>> {
    return this.findAll({ is_active: true } as Partial<IRestaurant>);
  }

  /**
   * Update restaurant theme colors
   */
  async updateThemeColors(id: string, colors: IThemeColors): Promise<DbResponse<IRestaurant>> {
    return this.update(id, { theme_colors: colors });
  }

  /**
   * Update restaurant logo
   */
  async updateLogo(id: string, logoUrl: string): Promise<DbResponse<IRestaurant>> {
    return this.update(id, { logo_url: logoUrl });
  }
}
