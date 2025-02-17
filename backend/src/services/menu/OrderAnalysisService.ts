import { IMenuItem } from '../../models/interfaces/menu';
import pool from '../../config/database';

interface IItemPopularity {
  item_id: string;
  order_count: number;
  last_ordered: Date;
}

interface IItemSimilarity {
  item_id1: string;
  item_id2: string;
  score: number;
}

export class OrderAnalysisService {
  /**
   * Get popular items for a restaurant
   */
  static async getPopularItems(
    restaurantId: string,
    limit: number = 10
  ): Promise<IItemPopularity[]> {
    try {
      const result = await pool.query(
        `SELECT 
          oi.item_id,
          COUNT(DISTINCT o.id) as order_count,
          MAX(o.created_at) as last_ordered
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.restaurant_id = $1
          AND o.created_at > NOW() - INTERVAL '30 days'
        GROUP BY oi.item_id
        ORDER BY order_count DESC, last_ordered DESC
        LIMIT $2`,
        [restaurantId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('[OrderAnalysis] Error getting popular items:', error);
      return [];
    }
  }

  /**
   * Get items frequently ordered together
   */
  static async getFrequentlyOrderedTogether(
    itemId: string,
    restaurantId: string,
    limit: number = 5
  ): Promise<IItemSimilarity[]> {
    try {
      const result = await pool.query(
        `WITH item_orders AS (
          SELECT DISTINCT o.id as order_id
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          WHERE o.restaurant_id = $1
            AND oi.item_id = $2
            AND o.created_at > NOW() - INTERVAL '30 days'
        )
        SELECT 
          oi.item_id as item_id2,
          COUNT(*) as order_count,
          COUNT(*)::float / (
            SELECT COUNT(DISTINCT o.id)
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.restaurant_id = $1
              AND oi.item_id = oi.item_id
              AND o.created_at > NOW() - INTERVAL '30 days'
          ) as score
        FROM item_orders io
        JOIN order_items oi ON io.order_id = oi.order_id
        WHERE oi.item_id != $2
        GROUP BY oi.item_id
        ORDER BY score DESC
        LIMIT $3`,
        [restaurantId, itemId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('[OrderAnalysis] Error getting frequently ordered together:', error);
      return [];
    }
  }

  /**
   * Get customer's favorite items based on order history
   */
  static async getCustomerFavorites(
    customerPhone: string,
    restaurantId: string,
    limit: number = 5
  ): Promise<IItemPopularity[]> {
    try {
      const result = await pool.query(
        `SELECT 
          oi.item_id,
          COUNT(*) as order_count,
          MAX(o.created_at) as last_ordered
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.restaurant_id = $1
          AND o.customer_phone = $2
          AND o.created_at > NOW() - INTERVAL '90 days'
        GROUP BY oi.item_id
        ORDER BY order_count DESC, last_ordered DESC
        LIMIT $3`,
        [restaurantId, customerPhone, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('[OrderAnalysis] Error getting customer favorites:', error);
      return [];
    }
  }

  /**
   * Get similar customers based on ordering patterns and preferences
   */
  static async getSimilarCustomers(
    customerPhone: string,
    restaurantId: string,
    limit: number = 5
  ): Promise<string[]> {
    try {
      // First get items ordered by the target customer
      const customerItems = await pool.query(
        `SELECT DISTINCT oi.item_id
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.restaurant_id = $1
          AND o.customer_phone = $2
          AND o.created_at > NOW() - INTERVAL '90 days'`,
        [restaurantId, customerPhone]
      );

      if (customerItems.rows.length === 0) {
        return [];
      }

      const itemIds = customerItems.rows.map(row => row.item_id);

      // Find customers who ordered similar items
      const result = await pool.query(
        `SELECT 
          o.customer_phone,
          COUNT(DISTINCT oi.item_id) as common_items
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.restaurant_id = $1
          AND o.customer_phone != $2
          AND oi.item_id = ANY($3::uuid[])
          AND o.created_at > NOW() - INTERVAL '90 days'
        GROUP BY o.customer_phone
        ORDER BY common_items DESC
        LIMIT $4`,
        [restaurantId, customerPhone, itemIds, limit]
      );

      return result.rows.map(row => row.customer_phone);
    } catch (error) {
      console.error('[OrderAnalysis] Error getting similar customers:', error);
      return [];
    }
  }

  /**
   * Calculate time-based relevance score
   */
  static getTimeRelevanceScore(item: IMenuItem): number {
    const currentHour = new Date().getHours();
    let score = 0;

    // Example time-based scoring logic
    if (item.parameters['meal_breakfast'] && currentHour >= 6 && currentHour < 11) {
      score += 2;
    }
    if (item.parameters['meal_lunch'] && currentHour >= 11 && currentHour < 15) {
      score += 2;
    }
    if (item.parameters['meal_dinner'] && currentHour >= 17 && currentHour < 23) {
      score += 2;
    }
    if (item.parameters['meal_snack']) {
      score += 1; // Snacks are always somewhat relevant
    }

    return score;
  }

  /**
   * Calculate seasonal relevance score
   */
  static getSeasonalRelevanceScore(item: IMenuItem): number {
    const currentMonth = new Date().getMonth(); // 0-11
    let score = 0;

    // Example seasonal scoring logic
    const isWinter = currentMonth >= 11 || currentMonth <= 1;
    const isSpring = currentMonth >= 2 && currentMonth <= 4;
    const isSummer = currentMonth >= 5 && currentMonth <= 7;
    const isFall = currentMonth >= 8 && currentMonth <= 10;

    if (item.parameters['seasonal_winter'] && isWinter) score += 2;
    if (item.parameters['seasonal_spring'] && isSpring) score += 2;
    if (item.parameters['seasonal_summer'] && isSummer) score += 2;
    if (item.parameters['seasonal_fall'] && isFall) score += 2;

    return score;
  }
}
