#!/bin/bash

# Check if backup files are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <database_backup_file> <media_backup_file>"
    echo "Example: $0 backups/database/backup_20250217_030000.sql backups/media/media_20250217_030000.tar.gz"
    exit 1
fi

DB_BACKUP=$1
MEDIA_BACKUP=$2

# Check if backup files exist
if [ ! -f "$DB_BACKUP" ]; then
    echo "Error: Database backup file not found: $DB_BACKUP"
    exit 1
fi

if [ ! -f "$MEDIA_BACKUP" ]; then
    echo "Error: Media backup file not found: $MEDIA_BACKUP"
    exit 1
fi

# Source .env file to get database credentials
if [ -f backend/.env ]; then
    source backend/.env
else
    echo "Error: backend/.env file not found"
    exit 1
fi

# Extract database credentials from DATABASE_URL
DB_URL=${DATABASE_URL#postgresql://}
DB_USER=${DB_URL%%:*}
DB_REST=${DB_URL#*:}
DB_PASS=${DB_REST%%@*}
DB_REST=${DB_REST#*@}
DB_HOST=${DB_REST%%:*}
DB_REST=${DB_REST#*:}
DB_PORT=${DB_REST%%/*}
DB_NAME=${DB_REST#*/}

# Confirm before proceeding
echo "Warning: This will overwrite your current database and media files!"
echo "Database to restore: $DB_BACKUP"
echo "Media files to restore: $MEDIA_BACKUP"
read -p "Are you sure you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Restore cancelled."
    exit 1
fi

# Restore database
echo "Restoring database..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < "$DB_BACKUP"

# Restore media files
echo "Restoring media files..."
rm -rf backend/storage/* backend/uploads/* 2>/dev/null || true
tar -xzf "$MEDIA_BACKUP" -C .

echo "Restore completed successfully!"
