import fs from 'fs/promises';
import path from 'path';
import { storageConfig } from '../../config/storage';
import { logger } from '../../utils/logger';

export class ImageStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = storageConfig.menuItems.uploadDir;
    this.ensureUploadDir().catch(error => {
      logger.error('Failed to create upload directory:', error);
    });
  }

  /**
   * Ensure the upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Process and save multiple uploaded images
   */
  async saveImages(files: any[], _restaurantId: string): Promise<string[]> {
    try {
      const urls: string[] = [];
      const baseUrl = process.env.API_URL || 'http://localhost:3002';
      
      // Move files from temp location to uploads directory
      for (const file of files) {
        const uniqueFilename = `${Date.now()}-${path.basename(file.filepath)}`;
        const destPath = path.join(this.uploadDir, uniqueFilename);
        
        // Move file from temp location to uploads directory
        await fs.copyFile(file.filepath, destPath);
        await fs.unlink(file.filepath); // Clean up temp file
        
        const url = new URL(path.posix.join(storageConfig.menuItems.urlPrefix, uniqueFilename), baseUrl).toString();
        urls.push(url);
      }
      
      return urls;
    } catch (error) {
      logger.error('Failed to process images:', error);
      throw new Error(`Failed to process images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete multiple image files
   */
  async deleteImages(imageUrls: string[]): Promise<void> {
    try {
      await Promise.all(imageUrls.map(url => this.deleteImage(url)));
    } catch (error) {
      logger.error('Failed to delete images:', error);
      throw new Error(`Failed to delete images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a single image file
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      if (!imageUrl) return;

      // Extract filename from full URL
      const urlObj = new URL(imageUrl);
      const filename = path.basename(urlObj.pathname);
      const filePath = path.join(this.uploadDir, filename);

      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
      } catch (error) {
        // If file doesn't exist, log and continue
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          logger.warn(`Image file not found: ${filePath}`);
          return;
        }
        throw error;
      }
    } catch (error) {
      logger.error('Failed to delete image:', error);
      throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate file type
   */
  validateFileType(mimetype: string): boolean {
    const isValid = storageConfig.menuItems.allowedTypes.includes(mimetype);
    if (!isValid) {
      logger.warn(`Invalid file type attempted: ${mimetype}`);
    }
    return isValid;
  }

  /**
   * Validate file size
   */
  validateFileSize(size: number): boolean {
    const isValid = size <= storageConfig.menuItems.maxFileSize;
    if (!isValid) {
      logger.warn(`File size too large: ${size} bytes (max: ${storageConfig.menuItems.maxFileSize} bytes)`);
    }
    return isValid;
  }
}
