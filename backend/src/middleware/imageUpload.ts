import { Request, Response, NextFunction } from 'express';
import formidable from 'formidable';
import { storageConfig } from '../config/storage';
import { ImageStorageService } from '../services/image/ImageStorageService';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';

const MAX_FILES = 8;
const imageStorage = new ImageStorageService();

// Ensure directories exist
const ensureDirectories = async () => {
  const tempDir = path.join(process.cwd(), 'uploads', 'temp');
  try {
    await fs.access(storageConfig.menuItems.uploadDir);
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(storageConfig.menuItems.uploadDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });
  }
};

// Clean up temp files
const cleanupTempFiles = async (files: string[]) => {
  await Promise.all(files.map(async (file) => {
    try {
      await fs.unlink(file);
    } catch (error) {
      logger.error(`Failed to delete temp file ${file}:`, error);
    }
  }));
};

// Parse form data with file tracking
const parseFormData = async (
  req: Request, 
  form: ReturnType<typeof formidable>
): Promise<{
  fields: formidable.Fields<string>;
  files: formidable.Files;
  uploadedFiles: string[];
}> => {
  const uploadedFiles: string[] = [];
  
  const [fields, files] = await new Promise<[formidable.Fields<string>, formidable.Files]>((resolve, reject) => {
    form.on('file', (_: string, file: formidable.File) => {
      uploadedFiles.push(file.filepath);
    });
    
    form.parse(req, (err: Error | null, fields: formidable.Fields<string>, files: formidable.Files) => {
      if (err) reject(err);
      else resolve([fields, files]);
    });
  });

  return { fields, files, uploadedFiles };
};

// Middleware for handling file uploads
export const handleMenuItemImageUpload = async (req: Request, res: Response, next: NextFunction) => {
  let tempFiles: string[] = [];
  
  try {
    await ensureDirectories();

    const form = formidable({
      uploadDir: path.join(process.cwd(), 'uploads', 'temp'),
      maxFiles: MAX_FILES,
      maxFileSize: storageConfig.menuItems.maxFileSize,
      maxTotalFileSize: storageConfig.menuItems.maxFileSize * MAX_FILES,
      filter: ({ mimetype }) => {
        if (!mimetype) return false;
        return storageConfig.menuItems.allowedTypes.includes(mimetype);
      },
      filename: (_name, _ext, part) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        return `${uniqueSuffix}${path.extname(part.originalFilename || '')}`;
      }
    });

    // Parse form data
    const { fields, files, uploadedFiles } = await parseFormData(req, form);
    tempFiles = uploadedFiles;

    // Validate files if present
    const fileArray = files.images || [];
    if (fileArray.length > 0) {
      if (fileArray.length > MAX_FILES) {
        throw new Error(`Maximum ${MAX_FILES} files allowed`);
      }

      // Validate file types and sizes
      for (const file of fileArray) {
        if (!imageStorage.validateFileType(file.mimetype || '')) {
          throw new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${storageConfig.menuItems.allowedTypes.join(', ')}`);
        }
        if (!imageStorage.validateFileSize(file.size)) {
          throw new Error(`File ${file.originalFilename} too large. Maximum size: ${storageConfig.menuItems.maxFileSize / (1024 * 1024)}MB`);
        }
      }
    }

    // Convert fields from formidable format to regular format
    const processedFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(fields)) {
      // Handle array fields (those ending with [])
      const baseKey = key.endsWith('[]') ? key.slice(0, -2) : key;
      
      // If this is an array field or already has multiple values, keep as array
      if (key.endsWith('[]') || (Array.isArray(value) && value.length > 1)) {
        processedFields[baseKey] = value;
      } else {
        // For non-array fields, take the first value if it exists
        processedFields[baseKey] = Array.isArray(value) ? value[0] : value;
      }
    }

    // Add parsed data to request
    req.body = processedFields;
    (req as any).files = files;

    next();
  } catch (error) {
    // Clean up any temp files
    if (tempFiles.length > 0) {
      await cleanupTempFiles(tempFiles);
    }
    logger.error('File upload error:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'File upload failed'
    });
  }
};
