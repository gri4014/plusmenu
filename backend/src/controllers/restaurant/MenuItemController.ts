import { Response } from 'express';
import { MenuItemModel } from '../../models/entities/MenuItemModel';
import { ICreateMenuItem, IUpdateMenuItem } from '../../models/interfaces/menu';
import { AuthenticatedRequest } from '../../middleware/auth';
import { IRestaurantAdmin } from '../../models/interfaces/auth';
import { menuItemFiltersSchema, createMenuItemSchema, updateMenuItemSchema } from '../../models/schemas/menu';
import { ImageStorageService } from '../../services/image/ImageStorageService';
import { logger } from '../../utils/logger';
import fs from 'fs/promises';

export class MenuItemController {
  private menuItemModel: MenuItemModel;
  private imageStorageService: ImageStorageService;

  constructor() {
    this.menuItemModel = new MenuItemModel();
    this.imageStorageService = new ImageStorageService();
  }

  /**
   * Create a new menu item
   */
  createMenuItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const restaurantId = (req.user?.entity as IRestaurantAdmin)?.restaurant_id;
      if (!restaurantId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized - Restaurant ID not found'
        });
        return;
      }

      let imageUrls: string[] = [];
      const files = (req as any).files?.images || [];
      if (files.length > 0) {
        try {
          // Move files from temp to permanent storage
          imageUrls = await this.imageStorageService.saveImages(files, restaurantId);
        } catch (error) {
          logger.error('Failed to process uploaded images:', error);
          // Clean up any temp files
          for (const file of files) {
            try {
              await fs.unlink(file.filepath);
            } catch (cleanupError) {
              logger.error('Failed to clean up temp file:', cleanupError);
            }
          }
          res.status(500).json({
            success: false,
            error: 'Failed to process uploaded images'
          });
          return;
        }
      }

      try {
        // Get form fields from formidable
        const fields = req.body;

        // Parse and validate form data
        const data = {
          name: fields.name || '',
          description: fields.description,
          price: parseFloat(fields.price || '0'),
          parameters: (() => {
            try {
              if (!fields.parameters) return {};
              // Handle formidable array format
              if (Array.isArray(fields.parameters)) {
                return fields.parameters.length > 0 ? JSON.parse(fields.parameters[0]) : {};
              }
              // Handle string format
              if (typeof fields.parameters === 'string') {
                return JSON.parse(fields.parameters);
              }
              // Handle object format
              return fields.parameters;
            } catch (error) {
              logger.error('Failed to parse parameters:', error);
              return {};
            }
          })(),
          is_active: fields.is_active === 'true',
          category_ids: (() => {
            try {
              if (!fields.category_ids) return [];
              // Handle formidable array format
              if (Array.isArray(fields.category_ids)) {
                return fields.category_ids.filter((id: unknown): id is string => 
                  typeof id === 'string' && 
                  !!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
                );
              }
              // Handle string format (single ID)
              if (typeof fields.category_ids === 'string') {
                return fields.category_ids.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i) ? 
                  [fields.category_ids] : [];
              }
              return [];
            } catch (error) {
              logger.error('Failed to parse category_ids:', error);
              return [];
            }
          })(),
          restaurant_id: restaurantId
        };

        // Log raw data for debugging
        logger.info('Raw form fields:', fields);
        logger.info('Parsed data:', data);

        // Validate using Zod schema
        const validation = createMenuItemSchema.safeParse(data);
        if (!validation.success) {
          res.status(400).json({
            success: false,
            error: validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
          });
          return;
        }

        const menuItemData: ICreateMenuItem = {
          ...data,
          restaurant_id: restaurantId,
          image_url: imageUrls[0], // Use first image as primary
          image_urls: imageUrls // Store all images
        };

        const result = await this.menuItemModel.createMenuItem(menuItemData);

        if (!result.success) {
          // If menu item creation fails, clean up uploaded images
          if (imageUrls.length > 0) {
            await this.imageStorageService.deleteImages(imageUrls).catch(error => {
              logger.error('Failed to clean up images after failed menu item creation:', error);
            });
          }
          
          logger.error('Failed to create menu item:', result.error);
          res.status(400).json(result);
          return;
        }

        // Ensure price is properly formatted
        const formattedResult = {
          ...result,
          data: result.data ? {
            ...result.data,
            price: Number(result.data.price).toFixed(2)
          } : undefined
        };

        res.status(201).json(formattedResult);
      } catch (error) {
        // Clean up any uploaded images if data processing fails
        if (imageUrls.length > 0) {
          await this.imageStorageService.deleteImages(imageUrls).catch(error => {
            logger.error('Failed to clean up images after error:', error);
          });
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error in createMenuItem:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  };

  /**
   * Get menu items for a restaurant
   */
  getMenuItems = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const restaurantId = (req.user?.entity as IRestaurantAdmin)?.restaurant_id;
      if (!restaurantId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized - Restaurant ID not found'
        });
        return;
      }

      // Validate and parse filters
      const filterValidation = menuItemFiltersSchema.safeParse(req.query);
      if (!filterValidation.success) {
        res.status(400).json({
          success: false,
          error: filterValidation.error.message
        });
        return;
      }

      const result = await this.menuItemModel.findByRestaurant(restaurantId, filterValidation.data);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      // Ensure prices are properly formatted
      const formattedResult = {
        ...result,
        data: result.data?.map(item => ({
          ...item,
          price: Number(item.price).toFixed(2)
        }))
      };

      res.json(formattedResult);
    } catch (error) {
      logger.error('Error in getMenuItems:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  };

  /**
   * Update a menu item
   */
  updateMenuItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { itemId } = req.params;
      const restaurantId = (req.user?.entity as IRestaurantAdmin)?.restaurant_id;
      if (!restaurantId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized - Restaurant ID not found'
        });
        return;
      }

      // Verify the item belongs to the restaurant
      const item = await this.menuItemModel.findById(itemId);
      if (!item.success || !item.data) {
        res.status(404).json({
          success: false,
          error: 'Menu item not found'
        });
        return;
      }

      if (item.data.restaurant_id !== restaurantId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden - Item does not belong to this restaurant'
        });
        return;
      }

      // Handle image update
      let imageUrls: string[] = [];
      const files = (req as any).files?.images || [];
      if (files.length > 0) {
        try {
          // Save new images first
          imageUrls = await this.imageStorageService.saveImages(files, restaurantId);
          
          // Only delete old images if new ones are successfully saved
          if (item.data.image_urls?.length) {
            await this.imageStorageService.deleteImages(item.data.image_urls);
          } else if (item.data.image_url) {
            await this.imageStorageService.deleteImage(item.data.image_url);
          }
        } catch (error) {
          // Clean up any temp files
          for (const file of files) {
            try {
              await fs.unlink(file.filepath);
            } catch (cleanupError) {
              logger.error('Failed to clean up temp file:', cleanupError);
            }
          }
          // If something fails during image update, clean up any new images
          if (imageUrls.length > 0) {
            await this.imageStorageService.deleteImages(imageUrls).catch(error => {
              logger.error('Failed to clean up images after error:', error);
            });
          }
          logger.error('Failed to process images during update:', error);
          res.status(500).json({
            success: false,
            error: 'Failed to process images'
          });
          return;
        }
      }

      // Log raw request data
      logger.info('Raw update request body:', req.body);
      logger.info('Raw is_active value:', req.body.is_active);
      logger.info('Raw is_active type:', typeof req.body.is_active);

      // Parse form data
      const fields = req.body;
      logger.info('Raw update request fields:', fields);

      const data: Partial<{
        name: string;
        description: string;
        price: number;
        parameters: Record<string, any>;
        category_ids: string[];
        is_active: boolean;
      }> = {};

      // Helper function to get field value
      const getFieldValue = (field: any): string | undefined => {
        if (Array.isArray(field)) return field[0];
        if (typeof field === 'string') return field;
        return undefined;
      };

      // Process name
      const name = getFieldValue(fields.name);
      if (name) data.name = name;

      // Process description
      const description = getFieldValue(fields.description);
      if (description) data.description = description;

      // Process price
      const price = getFieldValue(fields.price);
      if (price) {
        const priceValue = parseFloat(price);
        if (!isNaN(priceValue)) data.price = priceValue;
      }

      // Process parameters
      if (fields.parameters) {
        try {
          if (typeof fields.parameters === 'object' && !Array.isArray(fields.parameters)) {
            data.parameters = fields.parameters;
          } else {
            const paramsStr = getFieldValue(fields.parameters);
            data.parameters = paramsStr ? JSON.parse(paramsStr) : {};
          }
        } catch (error) {
          logger.error('Failed to parse parameters:', error);
          data.parameters = {};
        }
      }

      // Process category_ids
      if (fields.category_ids) {
        const categoryIds = Array.isArray(fields.category_ids) ? fields.category_ids : [fields.category_ids];
        data.category_ids = categoryIds.filter((id: unknown): id is string => 
          typeof id === 'string' && 
          !!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
        );
      }

      // Process is_active
      const isActive = getFieldValue(fields.is_active);
      if (isActive !== undefined) {
        // Convert various truthy/falsy values to boolean
        data.is_active = isActive.toLowerCase() === 'true' || isActive === '1';
      }

      logger.info('Processed update data:', data);

      // Validate using Zod schema
      const validation = updateMenuItemSchema.safeParse(data);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          error: validation.error.errors.map((err: { path: (string | number)[]; message: string }) => `${err.path.join('.')}: ${err.message}`).join(', ')
        });
        return;
      }

      // Log the parsed data for debugging
      logger.info('Parsed menu item update data:', data);
      logger.info('Final is_active value:', data.is_active);

      const updateData: IUpdateMenuItem = {
        ...data,
        image_url: imageUrls[0] || item.data.image_url, // Use first new image or keep existing
        image_urls: imageUrls.length > 0 ? imageUrls : item.data.image_urls // Use new images or keep existing
      };

      const result = await this.menuItemModel.updateMenuItem(itemId, updateData);

      if (!result.success) {
        logger.error('Failed to update menu item:', result.error);
        res.status(400).json(result);
        return;
      }

      // Ensure price is properly formatted
      const formattedResult = {
        ...result,
        data: result.data ? {
          ...result.data,
          price: Number(result.data.price).toFixed(2)
        } : undefined
      };

      res.json(formattedResult);
    } catch (error) {
      logger.error('Error in updateMenuItem:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  };

  /**
   * Delete a menu item (hard delete)
   */
  deleteMenuItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { itemId } = req.params;
      const restaurantId = (req.user?.entity as IRestaurantAdmin)?.restaurant_id;
      if (!restaurantId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized - Restaurant ID not found'
        });
        return;
      }

      // Verify the item belongs to the restaurant
      const item = await this.menuItemModel.findById(itemId);
      if (!item.success || !item.data) {
        res.status(404).json({
          success: false,
          error: 'Menu item not found'
        });
        return;
      }

      if (item.data.restaurant_id !== restaurantId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden - Item does not belong to this restaurant'
        });
        return;
      }

      // Delete the menu item and its related records
      const result = await this.menuItemModel.delete(itemId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      // Delete all images if they exist
      if (item.data.image_urls?.length) {
        await this.imageStorageService.deleteImages(item.data.image_urls);
      } else if (item.data.image_url) {
        await this.imageStorageService.deleteImage(item.data.image_url);
      }

      res.json({
        success: true,
        message: 'Menu item deleted successfully'
      });
    } catch (error) {
      logger.error('Error in deleteMenuItem:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  };

  /**
   * Get menu items with category details
   */
  getMenuItemsWithCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const restaurantId = (req.user?.entity as IRestaurantAdmin)?.restaurant_id;
      if (!restaurantId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized - Restaurant ID not found'
        });
        return;
      }

      const result = await this.menuItemModel.getMenuItemsWithCategories(restaurantId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      // Ensure prices are properly formatted
      const formattedResult = {
        ...result,
        data: result.data?.map(item => ({
          ...item,
          price: Number(item.price).toFixed(2)
        }))
      };

      res.json(formattedResult);
    } catch (error) {
      logger.error('Error in getMenuItemsWithCategories:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  };
}
