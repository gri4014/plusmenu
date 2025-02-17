import { Logger } from '../../utils/logger';
import { WebSocketEvents } from '../../websocket/events/types';
import { eventHandlerRegistry } from '../events/EventHandlerRegistry';
import { eventEmitter } from '../events/EventEmitterService';
import pool from '../../config/database';

interface DashboardStats {
  totalRestaurants: number;
  activeOrders: number;
  activeTables: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  timestamp: string;
}

class DashboardStatsService {
  private static instance: DashboardStatsService;
  private logger: Logger;
  private updateTimeout: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 1000; // 1 second debounce
  private lastStats: DashboardStats | null = null;
  private lastUpdateTime: Date | null = null;
  private readonly CACHE_TTL = 5000; // 5 seconds cache TTL

  private constructor() {
    this.logger = new Logger('DashboardStatsService');
    this.setupEventListeners();
  }

  public static getInstance(): DashboardStatsService {
    if (!DashboardStatsService.instance) {
      DashboardStatsService.instance = new DashboardStatsService();
    }
    return DashboardStatsService.instance;
  }

  private setupEventListeners(): void {
    // Register handlers for events that should trigger stats updates
    const updateHandler = async () => this.scheduleUpdate();
    
    eventHandlerRegistry.registerHandler(WebSocketEvents.NEW_ORDER_CREATED, updateHandler);
    eventHandlerRegistry.registerHandler(WebSocketEvents.ORDER_STATUS_UPDATED, updateHandler);
    eventHandlerRegistry.registerHandler(WebSocketEvents.TABLE_SESSION_UPDATED, updateHandler);
    eventHandlerRegistry.registerHandler(WebSocketEvents.TABLE_SESSION_CLOSED, updateHandler);
  }

  private scheduleUpdate(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(async () => {
      await this.emitDashboardStats();
      this.updateTimeout = null;
    }, this.DEBOUNCE_DELAY);
  }

  private isCacheValid(): boolean {
    if (!this.lastStats || !this.lastUpdateTime) return false;
    const now = new Date();
    return now.getTime() - this.lastUpdateTime.getTime() < this.CACHE_TTL;
  }

  public async getStats(): Promise<DashboardStats> {
    try {
      // Return cached stats if valid
      if (this.isCacheValid() && this.lastStats) {
        return this.lastStats;
      }

      const [restaurantsResult, ordersResult, tablesResult] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM restaurants WHERE is_active = true'),
        pool.query(
          'SELECT COUNT(*) FROM orders WHERE status = ANY($1)',
          [['received', 'preparing', 'ready']]
        ),
        pool.query('SELECT COUNT(*) FROM active_sessions WHERE status = $1', ['active'])
      ]);

      const totalRestaurants = parseInt(restaurantsResult.rows[0].count);
      const activeOrders = parseInt(ordersResult.rows[0].count);
      const activeTables = parseInt(tablesResult.rows[0].count);

      const stats: DashboardStats = {
        totalRestaurants,
        activeOrders,
        activeTables,
        systemHealth: 'healthy',
        timestamp: new Date().toISOString()
      };

      // Update cache
      this.lastStats = stats;
      this.lastUpdateTime = new Date();

      return stats;
    } catch (error) {
      this.logger.error('Failed to fetch dashboard stats:', error);
      
      // Return last known stats if available, otherwise throw
      if (this.lastStats) {
        return {
          ...this.lastStats,
          systemHealth: 'warning',
          timestamp: new Date().toISOString()
        };
      }
      
      throw error;
    }
  }

  public async emitDashboardStats(): Promise<void> {
    try {
      const stats = await this.getStats();
      
      // Emit to all connected developers
      await eventEmitter.emitToRole(
        'system', // system-wide scope
        'developer', // developer role
        WebSocketEvents.DASHBOARD_STATS_UPDATED,
        stats,
        {
          priority: 'normal',
          persist: false // No need to persist stats as they're frequently updated
        }
      );

      this.logger.debug('Emitted dashboard stats update', stats);
    } catch (error) {
      this.logger.error('Failed to emit dashboard stats:', error);
      
      // Emit error state if we can't get stats
      const errorStats: DashboardStats = {
        totalRestaurants: this.lastStats?.totalRestaurants ?? 0,
        activeOrders: this.lastStats?.activeOrders ?? 0,
        activeTables: this.lastStats?.activeTables ?? 0,
        systemHealth: 'error',
        timestamp: new Date().toISOString()
      };

      await eventEmitter.emitToRole(
        'system',
        'developer',
        WebSocketEvents.DASHBOARD_STATS_UPDATED,
        errorStats,
        {
          priority: 'high',
          persist: false
        }
      );
    }
  }

  // Force an immediate update, bypassing debounce and cache
  public async forceUpdate(): Promise<void> {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
    this.lastStats = null; // Clear cache
    await this.emitDashboardStats();
  }
}

// Export singleton instance
export const dashboardStatsService = DashboardStatsService.getInstance();
