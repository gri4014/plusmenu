import { IMenuItem, IMenuItemFilters } from '../../models/interfaces/menu';
import { IDietaryPreferences } from '../../models/interfaces/customer';
import { IParameterValues, ICategory } from '../../models/interfaces/system';
import { OrderAnalysisService } from './OrderAnalysisService';

interface IMenuFilterResult {
  item: IMenuItem;
  score: number;
  popularity_score: number;
  time_relevance: number;
  seasonal_relevance: number;
  customer_preference: number;
}

interface IGroupedMenuItems {
  [categoryId: string]: {
    items: IMenuFilterResult[];
    categoryName: string;
    displayOrder: number;
  };
}

export class MenuFilterService {
  /**
   * Filter and score menu items based on customer preferences, filters, and order history
   */
  static async filterAndScoreItems(
    items: IMenuItem[],
    preferences: IDietaryPreferences,
    restaurantId: string,
    customerPhone: string,
    filters?: IMenuItemFilters
  ): Promise<IMenuFilterResult[]> {
    let filteredItems = items;

    // Apply basic filters if provided
    if (filters) {
      filteredItems = this.applyBasicFilters(filteredItems, filters);
    }

    // Get order history analysis
    const [popularItems, customerFavorites] = await Promise.all([
      OrderAnalysisService.getPopularItems(restaurantId),
      OrderAnalysisService.getCustomerFavorites(customerPhone, restaurantId)
    ]);

    // Create lookup maps for quick access
    const popularityMap = new Map(
      popularItems.map(item => [item.item_id, item.order_count])
    );
    const favoritesMap = new Map(
      customerFavorites.map(item => [item.item_id, item.order_count])
    );

    // Calculate scores for each item
    const scoredItems = await Promise.all(
      filteredItems.map(async item => {
        // Only process items that are compatible with dietary restrictions
        if (!this.isItemCompatible(item, preferences)) {
          return null;
        }

        const baseScore = this.calculatePreferenceScore(item, preferences);
        const timeRelevance = OrderAnalysisService.getTimeRelevanceScore(item);
        const seasonalRelevance = OrderAnalysisService.getSeasonalRelevanceScore(item);
        
        // Calculate popularity score (0-5)
        const popularityScore = popularityMap.has(item.id)
          ? Math.min(5, popularityMap.get(item.id)! / 2)
          : 0;

        // Calculate customer preference score (0-5)
        const customerPreference = favoritesMap.has(item.id)
          ? Math.min(5, favoritesMap.get(item.id)! * 2)
          : 0;

        // Combine scores with weights
        const totalScore = 
          baseScore * 0.4 +           // Base preference match (40%)
          popularityScore * 0.2 +     // Popularity (20%)
          timeRelevance * 0.15 +      // Time relevance (15%)
          seasonalRelevance * 0.15 +  // Seasonal relevance (15%)
          customerPreference * 0.1;    // Customer's past preference (10%)

        return {
          item,
          score: totalScore,
          popularity_score: popularityScore,
          time_relevance: timeRelevance,
          seasonal_relevance: seasonalRelevance,
          customer_preference: customerPreference
        };
      })
    );

    // Filter out null results and sort by total score
    return scoredItems
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Apply basic filters to menu items
   */
  private static applyBasicFilters(
    items: IMenuItem[],
    filters: IMenuItemFilters
  ): IMenuItem[] {
    let filtered = items;

    // Filter by price range
    if (filters.price_min !== undefined || filters.price_max !== undefined) {
      filtered = filtered.filter(item => {
        const meetsMinPrice = filters.price_min === undefined || item.price >= filters.price_min;
        const meetsMaxPrice = filters.price_max === undefined || item.price <= filters.price_max;
        return meetsMinPrice && meetsMaxPrice;
      });
    }

    // Filter by categories
    if (filters.category_ids && filters.category_ids.length > 0) {
      filtered = filtered.filter(item =>
        item.category_ids.some(id => filters.category_ids!.includes(id))
      );
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        (item.description?.toLowerCase().includes(searchTerm) ?? false)
      );
    }

    return filtered;
  }

  /**
   * Calculate preference match score for a menu item
   */
  private static calculatePreferenceScore(
    item: IMenuItem,
    preferences: IDietaryPreferences
  ): number {
    let score = 0;
    const parameters = item.parameters;

    // Enhanced taste preference scoring with weights
    const tasteScore = this.calculateTasteScore(parameters, preferences.taste_preferences);
    score += tasteScore * 2; // Give more weight to taste preferences

    // Bonus points for exact dietary preference matches
    if (preferences.dietary_restrictions.some(pref => 
      parameters[`diet_${pref.toLowerCase()}`]
    )) {
      score += 1;
    }

    // Bonus for health-conscious items if user has dietary restrictions
    if (preferences.dietary_restrictions.length > 0 && parameters.healthy) {
      score += 0.5;
    }

    return score;
  }

  /**
   * Calculate taste preference match score with intensity matching
   */
  private static calculateTasteScore(
    parameters: IParameterValues,
    tastePreferences: string[]
  ): number {
    let score = 0;

    // Enhanced taste preference scoring
    tastePreferences.forEach(taste => {
      const paramKey = `taste_${taste.toLowerCase()}`;
      const intensityKey = `${paramKey}_intensity`;

      // Basic match
      if (parameters[paramKey]) {
        score += 1;

        // Bonus for intensity match if available
        if (parameters[intensityKey]) {
          const intensity = parameters[intensityKey] as number;
          if (intensity >= 0.7) score += 0.5; // Strong match for high intensity
          else if (intensity >= 0.4) score += 0.3; // Moderate match
        }
      }
    });

    return score;
  }

  /**
   * Check if item is compatible with dietary restrictions and allergies
   */
  private static isItemCompatible(
    item: IMenuItem,
    preferences: IDietaryPreferences
  ): boolean {
    const parameters = item.parameters;

    // Check dietary restrictions
    for (const restriction of preferences.dietary_restrictions) {
      // If item violates any restriction, it's incompatible
      if (parameters[`restricted_${restriction.toLowerCase()}`]) {
        return false;
      }
    }

    // Check allergies
    for (const allergy of preferences.allergies) {
      // If item contains any allergen, it's incompatible
      if (parameters[`contains_${allergy.toLowerCase()}`]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Group filtered items by category
   */
  static groupByCategory(
    filteredResults: IMenuFilterResult[],
    categories: ICategory[]
  ): IGroupedMenuItems {
    const grouped: IGroupedMenuItems = {};

    // First, initialize groups with category metadata
    categories.forEach(category => {
      grouped[category.id] = {
        items: [],
        categoryName: category.name,
        displayOrder: category.display_order || 0
      };
    });

    // Then distribute items to their categories
    filteredResults.forEach(result => {
      result.item.category_ids.forEach(categoryId => {
        if (grouped[categoryId]) {
          grouped[categoryId].items.push(result);
        }
      });
    });

    // Sort items within each category by preference score
    Object.values(grouped).forEach(category => {
      category.items.sort((a, b) => b.score - a.score);
    });

    return grouped;
  }
}
