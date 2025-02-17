export enum WebSocketEvents {
  // Order Events
  ORDER_STATUS_UPDATED = 'order:status_updated',
  NEW_ORDER_CREATED = 'order:created',
  
  // Waiter Events
  WAITER_CALLED = 'waiter:called',
  WAITER_CALL_RESOLVED = 'waiter:resolved',
  
  // Session Events
  TABLE_SESSION_UPDATED = 'session:updated',
  TABLE_SESSION_CLOSED = 'session:closed',

  // Developer Dashboard Events
  DASHBOARD_STATS_UPDATED = 'dashboard:stats_updated',

  // Table Events
  TABLE_NEW_ORDER = 'table:new_order',
  TABLE_WAITER_CALLED = 'table:waiter_called'
}

export interface TableEventPayload {
  tableId: string;
  type: 'order' | 'waiter';
  timestamp: string;
}

export interface DashboardStatsPayload {
  totalRestaurants: number;
  activeOrders: number;
  activeTables: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  timestamp: string;
}
