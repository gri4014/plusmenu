import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { MenuFilterService } from '../../services/menu/MenuFilterService';
import { MenuItemModel } from '../../models/entities/MenuItemModel';
import { CategoryModel } from '../../models/entities/CategoryModel';
import { customerModel } from '../../models/entities/CustomerModel';
import { IDietaryPreferences } from '../../models/interfaces/customer';
import { IMenuItemFilters } from '../../models/interfaces/menu';
import { ICategory } from '../../models/interfaces/system';

// Create model instances
const menuItemModel = new MenuItemModel();
const categoryModel = new CategoryModel();

export class CustomerMenuController {
  /**
   * Get categories for a restaurant with metadata
   */
  async getCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const restaurantId = req.params.restaurantId;

      if (!restaurantId) {
        return res.status(400).json({
          success: false,
          error: 'Restaurant ID is required'
        });
      }

      // Get categories with item counts
      const categoriesResult = await categoryModel.getCategoriesWithItemCounts();
      
      if (!categoriesResult.success || !categoriesResult.data) {
        return res.status(400).json({
          success: false,
          error: 'Failed to retrieve categories',
          details: categoriesResult.error
        });
      }

      // Filter categories for the specific restaurant and ensure they're active
      const restaurantCategories = categoriesResult.data.filter(
        (category: ICategory) => category.restaurant_id === restaurantId && category.is_active
      );

      // Sort categories by display order
      const sortedCategories = restaurantCategories.sort(
        (a: ICategory, b: ICategory) => (a.display_order || 0) - (b.display_order || 0)
      );

      return res.status(200).json({
        success: true,
        categories: sortedCategories
      });
    } catch (error) {
      console.error('[CustomerMenu] Error getting categories:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error while retrieving categories'
      });
    }
  }

  /**
   * Get filtered menu items based on customer preferences
   */
  async getFilteredMenu(req: AuthenticatedRequest, res: Response) {
    try {
      const customerId = req.user?.id;
      const restaurantId = req.params.restaurantId;

      if (!customerId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized access - user ID not found'
        });
      }

      if (!restaurantId) {
        return res.status(400).json({
          success: false,
          error: 'Restaurant ID is required'
        });
      }

      // Get customer preferences
      const preferencesResult = await customerModel.getPreferences(customerId);
      if (!preferencesResult.success || !preferencesResult.preferences) {
        return res.status(400).json({
          success: false,
          error: 'Failed to retrieve customer preferences',
          details: preferencesResult.error
        });
      }

      // Ensure all preference fields are present
      const preferences: IDietaryPreferences = {
        dietary_restrictions: preferencesResult.preferences.dietary_restrictions || [],
        allergies: preferencesResult.preferences.allergies || [],
        taste_preferences: preferencesResult.preferences.taste_preferences || []
      };

      // Get all active menu items for the restaurant
      const menuItemsResult = await menuItemModel.findByRestaurant(restaurantId, {
        is_active: true
      });

      if (!menuItemsResult.success || !menuItemsResult.data) {
        return res.status(400).json({
          success: false,
          error: 'Failed to retrieve menu items',
          details: menuItemsResult.error
        });
      }

      // Get all categories for the restaurant
      const categoriesResult = await categoryModel.findAll({
        restaurant_id: restaurantId,
        is_active: true
      });

      if (!categoriesResult.success || !categoriesResult.data) {
        return res.status(400).json({
          success: false,
          error: 'Failed to retrieve categories',
          details: categoriesResult.error
        });
      }

      // Sort categories by display order
      const sortedCategories = categoriesResult.data.sort(
        (a: ICategory, b: ICategory) => (a.display_order || 0) - (b.display_order || 0)
      );

      // Extract filters from query parameters
      const filters: IMenuItemFilters = {
        category_ids: req.query.category_ids ? (req.query.category_ids as string).split(',') : undefined,
        price_min: req.query.price_min ? parseFloat(req.query.price_min as string) : undefined,
        price_max: req.query.price_max ? parseFloat(req.query.price_max as string) : undefined,
        search: req.query.search as string || undefined
      };

      // Get customer's phone number from auth data
      const customerResult = await customerModel.findById(customerId);
      if (!customerResult.success || !customerResult.data) {
        return res.status(400).json({
          success: false,
          error: 'Failed to retrieve customer data',
          details: customerResult.error
        });
      }

      // Filter and score menu items based on preferences, filters, and order history
      const filteredResults = await MenuFilterService.filterAndScoreItems(
        menuItemsResult.data,
        preferences,
        restaurantId,
        customerResult.data.phone_number,
        filters
      );

      // Group filtered items by category
      const groupedResults = MenuFilterService.groupByCategory(
        filteredResults,
        sortedCategories
      );

      // Format response with sorted categories
      const formattedMenu = Object.entries(groupedResults)
        .map(([categoryId, categoryData]) => ({
          category_id: categoryId,
          category_name: categoryData.categoryName,
          display_order: categoryData.displayOrder,
          items: categoryData.items.map(result => ({
            ...result.item,
            price: Number(result.item.price).toFixed(2),
            preference_score: result.score,
            recommendation_factors: {
              taste_match: result.score * 0.4, // Base preference match (40%)
              popularity: result.popularity_score * 0.2, // Popularity (20%)
              time_relevance: result.time_relevance * 0.15, // Time relevance (15%)
              seasonal_relevance: result.seasonal_relevance * 0.15, // Seasonal relevance (15%)
              personal_history: result.customer_preference * 0.1 // Customer's past preference (10%)
            }
          }))
        }))
        .sort((a, b) => a.display_order - b.display_order);

      return res.status(200).json({
        success: true,
        menu: formattedMenu
      });
    } catch (error) {
      console.error('[CustomerMenu] Error getting filtered menu:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error while retrieving menu'
      });
    }
  }
}

export const customerMenuController = new CustomerMenuController();
