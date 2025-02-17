#!/bin/bash

# Create backup directories if they don't exist
mkdir -p backups/database
mkdir -p backups/media

# Get current timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Source .env file to get database credentials
if [ -f backend/.env ]; then
    source backend/.env
else
    echo "Error: backend/.env file not found"
    exit 1
fi

# Extract database credentials from DATABASE_URL
# Expected format: postgresql://username:password@localhost:5432/database
DB_URL=${DATABASE_URL#postgresql://}
DB_USER=${DB_URL%%:*}
DB_REST=${DB_URL#*:}
DB_PASS=${DB_REST%%@*}
DB_REST=${DB_REST#*@}
DB_HOST=${DB_REST%%:*}
DB_REST=${DB_REST#*:}
DB_PORT=${DB_REST%%/*}
DB_NAME=${DB_REST#*/}

# Create database backup
echo "Creating database backup..."
PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > "backups/database/backup_${TIMESTAMP}.sql"

# Create media backup
echo "Creating media backup..."
tar -czf "backups/media/media_${TIMESTAMP}.tar.gz" backend/storage backend/uploads 2>/dev/null || true

echo "Backup completed successfully!"
echo "Database backup: backups/database/backup_${TIMESTAMP}.sql"
echo "Media backup: backups/media/media_${TIMESTAMP}.tar.gz"

# Keep only last 5 backups
echo "Cleaning up old backups..."
cd backups/database && ls -t | tail -n +6 | xargs rm -f
cd ../media && ls -t | tail -n +6 | xargs rm -f

echo "Backup process completed!"
