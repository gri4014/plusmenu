import { Router } from 'express';
import { tableQRController } from '../../controllers/table/TableQRController';
import { validateRequest } from '../../middleware/validation';
import { z } from 'zod';

const router = Router();

// Validation schema for join session request
const joinSessionSchema = {
  body: z.object({
    qrData: z.string(),
    phone_number: z.string().optional(),
    preferences: z.record(z.any()).optional()
  })
};

/**
 * Join a table session via QR code
 * @route POST /api/tables/join-session
 * @param {string} x-device-id - Device ID header
 * @param {object} body - QR code data and optional user info
 */
router.post(
  '/join-session',
  validateRequest(joinSessionSchema),
  tableQRController.joinSession
);

export default router;
