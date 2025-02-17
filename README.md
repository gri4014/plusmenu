# PlusMenu - Restaurant Management System

A comprehensive restaurant menu and order management system that enables QR code-based ordering, table management, and restaurant administration.

## Features

- QR code-based table ordering system
- Multi-restaurant support with individual admin panels
- Developer admin panel for managing restaurants and permissions
- Real-time order tracking and notifications
- Table management and waiter call system
- Customer preferences and order history

## Project Structure

```
.
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── config/         # Application configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── db/            # Database migrations and setup
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions
│   │   └── websocket/     # WebSocket handling
│   └── storage/           # Local storage for uploads
└── frontend/              # React frontend application
    ├── src/
    │   ├── components/    # React components
    │   ├── contexts/      # React contexts
    │   ├── hooks/        # Custom React hooks
    │   ├── pages/        # Page components
    │   ├── services/     # API service calls
    │   ├── styles/       # Global styles
    │   └── types/        # TypeScript type definitions
```

## Database Backup Instructions

1. Create a backup directory:
```bash
mkdir -p backups
```

2. Database backup (replace with your database credentials):
```bash
pg_dump -U your_username -d your_database > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

3. Media files backup:
```bash
tar -czf backups/media_$(date +%Y%m%d_%H%M%S).tar.gz backend/storage backend/uploads
```

## Database Restore Instructions

1. Restore database:
```bash
psql -U your_username -d your_database < backup_file.sql
```

2. Restore media files:
```bash
tar -xzf media_backup.tar.gz
```

## Environment Variables

### Backend (.env)
```
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/database
JWT_SECRET=your_jwt_secret
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## Development Setup

1. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

2. Set up database:
```bash
cd backend
npm run migrate
```

3. Run development servers:
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

This project is proprietary software. All rights reserved.
