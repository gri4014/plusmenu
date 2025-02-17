import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

interface QRCodeData {
  tableId: string;
  restaurantId: string;
  timestamp: number;
  signature: string;
}

export class QRCodeService {
  private readonly qrStoragePath: string;
  private readonly secretKey: string;

  constructor() {
    // Store QR codes in a 'storage/qrcodes' directory relative to project root
    this.qrStoragePath = path.join(process.cwd(), 'storage', 'qrcodes');
    // Use JWT secret for signing QR codes
    this.secretKey = process.env.JWT_SECRET || 'default-secret-key';
    this.initStorage();
  }

  private async initStorage(): Promise<void> {
    try {
      await fs.mkdir(this.qrStoragePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create QR code storage directory:', error);
      throw error;
    }
  }

  private generateSignature(data: Omit<QRCodeData, 'signature'>): string {
    const dataString = JSON.stringify(data);
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(dataString)
      .digest('hex');
  }

  private async generateQRCodeImage(data: QRCodeData): Promise<string> {
    const fileName = `${data.restaurantId}_${data.tableId}.png`;
    const filePath = path.join(this.qrStoragePath, fileName);
    
    try {
      console.log('Generating QR code:', {
        data,
        fileName,
        filePath,
        storagePath: this.qrStoragePath
      });

      // Ensure directory exists
      await fs.mkdir(this.qrStoragePath, { recursive: true });

      // Generate QR code with medium error correction level
      await QRCode.toFile(filePath, JSON.stringify({
        ...data,
        url: `${process.env.FRONTEND_URL}/restaurant/${data.restaurantId}/table/${data.tableId}`
      }), {
        errorCorrectionLevel: 'M',
        type: 'png',
        width: 300,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      
      // Verify file was created
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      if (!exists) {
        console.error('QR code file was not created:', {
          filePath,
          exists
        });
        throw new Error('QR code file was not created');
      }
      
      console.log('QR code generated successfully:', {
        fileName,
        filePath,
        exists
      });
      
      return fileName;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw error;
    }
  }

  public async generateQRCode(
    tableId: string,
    restaurantId: string
  ): Promise<{ qrCodeIdentifier: string; qrCodeImagePath: string }> {
    const qrCodeIdentifier = uuidv4();
    
    const qrData: QRCodeData = {
      tableId,
      restaurantId,
      timestamp: Date.now(),
      signature: '' // Will be filled after
    };

    // Generate signature
    qrData.signature = this.generateSignature({
      tableId: qrData.tableId,
      restaurantId: qrData.restaurantId,
      timestamp: qrData.timestamp
    });

    // Generate and save QR code image
    const qrCodeImagePath = await this.generateQRCodeImage(qrData);

    return {
      qrCodeIdentifier,
      qrCodeImagePath
    };
  }

  public async generateBulkQRCodes(
    restaurantId: string,
    tableCount: number
  ): Promise<Array<{ tableId: string; qrCodeIdentifier: string; qrCodeImagePath: string }>> {
    const results = [];

    for (let i = 0; i < tableCount; i++) {
      const tableId = uuidv4(); // Generate new table ID
      const qrCode = await this.generateQRCode(tableId, restaurantId);
      results.push({
        tableId,
        ...qrCode
      });
    }

    return results;
  }

  public validateQRCode(qrCodeData: string): boolean {
    try {
      const data: QRCodeData = JSON.parse(qrCodeData);
      const { signature, ...dataWithoutSignature } = data;

      // Generate signature for comparison
      const expectedSignature = this.generateSignature(dataWithoutSignature);

      // Verify signature
      if (signature !== expectedSignature) {
        return false;
      }

      // Check if QR code is not too old (optional, can be adjusted or removed)
      const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
      if (Date.now() - data.timestamp > maxAge) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to validate QR code:', error);
      return false;
    }
  }

  public async deleteQRCode(qrCodeImagePath: string): Promise<void> {
    try {
      const fullPath = path.join(this.qrStoragePath, qrCodeImagePath);
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Failed to delete QR code image:', error);
      throw error;
    }
  }
}

export const qrCodeService = new QRCodeService();
