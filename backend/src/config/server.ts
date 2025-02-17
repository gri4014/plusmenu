import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { createWebSocketServer } from '../websocket';
import { dashboardStatsService } from '../services/dashboard/DashboardStatsService';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3002;

// Initialize WebSocket server
const wsServer = createWebSocketServer(httpServer);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3004',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log static file requests
app.use('/storage/qrcodes', (req, _res, next) => {
  const fullPath = path.join(process.cwd(), 'storage/qrcodes', req.path);
  console.log('QR code request:', {
    path: req.path,
    fullPath,
    fullUrl: req.url,
    method: req.method,
    headers: req.headers,
    exists: require('fs').existsSync(fullPath)
  });
  next();
});

// Serve uploaded files
app.use('/uploads/menu-items', express.static(path.join(process.cwd(), 'uploads/menu-items'), {
  fallthrough: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
const menuItemsDir = path.join(uploadsDir, 'menu-items');
try {
  if (!require('fs').existsSync(uploadsDir)) {
    require('fs').mkdirSync(uploadsDir);
  }
  if (!require('fs').existsSync(menuItemsDir)) {
    require('fs').mkdirSync(menuItemsDir);
  }
} catch (error) {
  console.error('Failed to create upload directories:', error);
}

// Log static file requests
app.use('/storage/qrcodes', (req, _res, next) => {
  console.log('QR code request:', {
    url: req.url,
    path: req.path,
    method: req.method,
    headers: req.headers
  });
  next();
});

// Serve QR code files
app.use('/storage/qrcodes', express.static(path.join(process.cwd(), 'storage/qrcodes'), {
  index: false,
  fallthrough: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'image/png');
  }
}));

// Basic route for testing
app.get('/', (_req, res) => {
  res.json({ message: 'ПлюсМеню API is running' });
});

// Routes
import developerAuthRoutes from '../routes/developer/auth';
import restaurantAuthRoutes from '../routes/restaurant/auth';
import customerAuthRoutes from '../routes/customer/auth';
import customerPreferencesRoutes from '../routes/customer/preferences';
import customerMenuRoutes from '../routes/customer/menu';
import customerOrderRoutes from '../routes/customer/orders';
import developerRestaurantRoutes from '../routes/developer/restaurants';
import developerAdminRoutes from '../routes/developer/admins';
import developerTableRoutes from '../routes/developer/tables';
import developerParameterRoutes from '../routes/developer/parameters';
import tableSessionRoutes from '../routes/table/sessions';
import restaurantMenuRoutes from '../routes/restaurant/menu';
import restaurantCategoryRoutes from '../routes/restaurant/categories';
import orderRoutes from '../routes/order';
import tableWaiterRoutes from '../routes/table/waiter';
import restaurantWaiterRoutes from '../routes/restaurant/waiter';
import tableQRRoutes from '../routes/table/qr';
import notificationAnalyticsRoutes from '../routes/notification/analytics';
import restaurantTableRoutes from '../routes/restaurant/tables';
import restaurantParameterRoutes from '../routes/restaurant/parameters';

// Main routes
app.use('/api/developer/auth', developerAuthRoutes);
app.use('/api/restaurant/auth', restaurantAuthRoutes);
app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/customer/preferences', customerPreferencesRoutes);
app.use('/api/customer/menu', customerMenuRoutes);
app.use('/api/customer/orders', customerOrderRoutes);
app.use('/api/developer/restaurants', developerRestaurantRoutes);
app.use('/api/developer', developerAdminRoutes);
app.use('/api/developer', developerTableRoutes);
app.use('/api/developer/parameters', developerParameterRoutes);
app.use('/api/tables', tableSessionRoutes);
app.use('/api/restaurant/menu', restaurantMenuRoutes);
app.use('/api/restaurant/menu/categories', restaurantCategoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', tableWaiterRoutes); // Changed to mount at /api to support both /tables and /waiter-calls paths
app.use('/api/restaurant', restaurantWaiterRoutes);
app.use('/api/tables', tableQRRoutes);
app.use('/api/notifications/analytics', notificationAnalyticsRoutes);
app.use('/api/restaurant/:restaurantId/tables', restaurantTableRoutes);
app.use('/api/restaurant/parameters', restaurantParameterRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const startServer = () => {
  try {
    httpServer.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log('WebSocket server initialized');

      // Initialize dashboard stats service and send initial stats
      dashboardStatsService.forceUpdate().catch(error => {
        console.error('Failed to send initial dashboard stats:', error);
      });
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

export { app, startServer, wsServer };
