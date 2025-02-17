import path from 'path';
import fs from 'fs/promises';

// Create upload directories if they don't exist
const createUploadDirs = async () => {
  const uploadDir = path.join(__dirname, '../../uploads');
  const menuItemsDir = path.join(uploadDir, 'menu-items');
  
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(menuItemsDir, { recursive: true });
  } catch (error: any) {
    console.error('Failed to create upload directories:', error);
  }
};

// Initialize directories
createUploadDirs().catch((error: any) => {
  console.error('Failed to create upload directories:', error);
});

export const storageConfig = {
  menuItems: {
    uploadDir: path.join(__dirname, '../../uploads/menu-items'),
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    urlPrefix: '/uploads/menu-items'
  }
};
