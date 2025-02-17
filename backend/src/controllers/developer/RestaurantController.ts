import { Response } from 'express';
import { RestaurantModel } from '../../models/entities/RestaurantModel';
import { createRestaurantSchema, updateRestaurantSchema } from '../../models/schemas/auth';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ErrorType, handleError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export class RestaurantController {
  private restaurantModel: RestaurantModel;

  constructor() {
    this.restaurantModel = new RestaurantModel();
  }

  /**
   * Create a new restaurant
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const client = await this.restaurantModel.db.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');

      // Validate request data
      const validationResult = createRestaurantSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = handleError(validationResult.error);
        const errorMessage = Array.isArray(error.details) 
          ? error.details.map((d: { message: string }) => d.message).join(', ') 
          : error.message;
        logger.error('Restaurant creation validation failed:', errorMessage);
        return res.status(400).json({
          success: false,
          error: errorMessage
        });
      }

      // Create restaurant using transaction client
      const result = await this.restaurantModel.createWithClient(client, validationResult.data);

      if (!result.success) {
        // Rollback transaction
        await client.query('ROLLBACK');
        const error = handleError(result.error);
        const errorMessage = Array.isArray(error.details)
          ? error.details.map((d: { message: string }) => d.message).join(', ')
          : error.message;
        logger.error('Restaurant creation failed:', errorMessage);
        return res.status(400).json({
          success: false,
          error: errorMessage
        });
      }

      // Commit transaction
      await client.query('COMMIT');

      if (!result.data) {
        logger.error('Restaurant created but no data returned');
        return res.status(500).json({
          success: false,
          error: {
            type: ErrorType.INTERNAL,
            message: 'Restaurant created but no data returned',
            code: 'INTERNAL_002'
          }
        });
      }

      logger.info('Restaurant created successfully:', result.data.id);
      return res.status(201).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      // Rollback transaction if it was started
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        logger.error('Error rolling back transaction:', rollbackError);
      }

      const handledError = handleError(error);
      logger.error('Unexpected error during restaurant creation:', handledError);
      
      return res.status(500).json({
        success: false,
        error: handledError
      });
    } finally {
      // Release client back to pool
      client.release();
    }
  }

  /**
   * Get all restaurants for the developer
   */
  async list(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const limit = Number(req.query.limit) || 12;
      const offset = Number(req.query.offset) || 0;
      const search = req.query.search as string | undefined;
      const orderBy = req.query.orderBy as string || 'created_at';
      const orderDirection = (req.query.orderDirection as 'ASC' | 'DESC') || 'DESC';

      const result = await this.restaurantModel.findAllPaginated({
        limit: Number(limit),
        offset: Number(offset),
        search: search as string | undefined,
        orderBy: orderBy as string,
        orderDirection: orderDirection as 'ASC' | 'DESC'
      });

      if (!result.success) {
        const error = handleError(result.error);
        logger.error('Failed to list restaurants:', error);
        return res.status(400).json({
          success: false,
          error
        });
      }

      return res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      const handledError = handleError(error);
      logger.error('Unexpected error listing restaurants:', handledError);
      return res.status(500).json({
        success: false,
        error: handledError
      });
    }
  }

  /**
   * Get a specific restaurant
   */
  async getById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const result = await this.restaurantModel.findById(req.params.id);
      if (!result.success) {
        const error = handleError(result.error);
        logger.error('Failed to get restaurant:', error);
        return res.status(404).json({
          success: false,
          error
        });
      }

      return res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      const handledError = handleError(error);
      logger.error('Unexpected error getting restaurant:', handledError);
      return res.status(500).json({
        success: false,
        error: handledError
      });
    }
  }

  /**
   * Update a restaurant
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const client = await this.restaurantModel.db.connect();
    
    try {
      await client.query('BEGIN');

      // First check if restaurant exists and developer owns it
      const restaurant = await this.restaurantModel.findById(req.params.id);
      if (!restaurant.success) {
        const error = handleError(restaurant.error);
        logger.error('Restaurant not found for update:', error);
        return res.status(404).json({
          success: false,
          error
        });
      }

      // Validate update data
      const validationResult = updateRestaurantSchema.safeParse(req.body);
      if (!validationResult.success) {
        const error = handleError(validationResult.error);
        logger.error('Restaurant update validation failed:', error);
        return res.status(400).json({
          success: false,
          error
        });
      }

      // Update restaurant using transaction client
      const result = await this.restaurantModel.updateWithClient(
        client,
        req.params.id,
        validationResult.data
      );

      if (!result.success) {
        await client.query('ROLLBACK');
        const error = handleError(result.error);
        logger.error('Failed to update restaurant:', error);
        return res.status(400).json({
          success: false,
          error
        });
      }

      await client.query('COMMIT');

      return res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        logger.error('Error rolling back transaction:', rollbackError);
      }

      const handledError = handleError(error);
      logger.error('Unexpected error updating restaurant:', handledError);
      return res.status(500).json({
        success: false,
        error: handledError
      });
    } finally {
      client.release();
    }
  }

  /**
   * Delete a restaurant (soft delete)
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const client = await this.restaurantModel.db.connect();
    
    try {
      await client.query('BEGIN');

      // First check if restaurant exists and developer owns it
      const restaurant = await this.restaurantModel.findById(req.params.id);
      if (!restaurant.success) {
        const error = handleError(restaurant.error);
        logger.error('Restaurant not found for deletion:', error);
        return res.status(404).json({
          success: false,
          error
        });
      }

      // Delete restaurant using transaction client
      const result = await this.restaurantModel.deleteWithClient(client, req.params.id);
      if (!result.success) {
        await client.query('ROLLBACK');
        const error = handleError(result.error);
        logger.error('Failed to delete restaurant:', error);
        return res.status(400).json({
          success: false,
          error
        });
      }

      await client.query('COMMIT');

      return res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        logger.error('Error rolling back transaction:', rollbackError);
      }

      const handledError = handleError(error);
      logger.error('Unexpected error deleting restaurant:', handledError);
      return res.status(500).json({
        success: false,
        error: handledError
      });
    } finally {
      client.release();
    }
  }
}
