import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { customerModel } from '../../models/entities/CustomerModel';
import { jwtService } from '../../services/auth/JWTService';
import { sessionService } from '../../services/auth/SessionService';
import { RoleType } from '../../types/rbac';

export class CustomerAuthController {
  constructor() {
    // Bind methods to ensure proper 'this' context
    this.registerPhone = this.registerPhone.bind(this);
    this.checkDevice = this.checkDevice.bind(this);
  }

  /**
   * Register or retrieve customer by phone number
   */
  async registerPhone(req: AuthenticatedRequest, res: Response) {
    try {
      console.log('[CustomerAuthController] Starting registration process');
      const { phone_number } = req.body;
      const deviceId = req.headers['x-device-id'] as string;

      console.log('[CustomerAuthController] Phone:', phone_number, 'Device ID:', deviceId);

      if (!deviceId) {
        console.log('[CustomerAuthController] Missing device ID');
        return res.status(400).json({
          success: false,
          error: 'Device ID is required'
        });
      }

      // Check if customer exists with this phone number
      console.log('[CustomerAuthController] Checking for existing customer');
      const existingCustomer = await customerModel.findByPhone(phone_number);

      if (existingCustomer.success && existingCustomer.customer) {
        console.log('[CustomerAuthController] Found existing customer:', existingCustomer.customer.id);
        // Update device ID if different
        if (existingCustomer.customer.device_id !== deviceId) {
          console.log('[CustomerAuthController] Updating device ID');
          await customerModel.linkDevice(existingCustomer.customer.id, deviceId);
        }

      // Generate JWT token and session
      console.log('[CustomerAuthController] Generating token and session');
      const token = jwtService.generateToken({
        id: existingCustomer.customer.id,
        role: RoleType.CUSTOMER
      });

      console.log('[CustomerAuthController] Creating session');
      const session = await sessionService.createSession({
        userId: existingCustomer.customer.id,
        role: RoleType.CUSTOMER
      });

      return res.status(200).json({
        success: true,
        customer: existingCustomer.customer,
        isNewCustomer: false,
        token,
        sessionId: session.id
      });
      }

      // Create new customer
      console.log('[CustomerAuthController] Creating new customer');
      const newCustomer = await customerModel.createCustomer(phone_number, deviceId);

      if (!newCustomer.success || !newCustomer.customer) {
        console.error('[CustomerAuthController] Failed to create customer:', newCustomer.error);
        return res.status(400).json({
          success: false,
          error: newCustomer.error || 'Failed to create customer'
        });
      }

      console.log('[CustomerAuthController] New customer created:', newCustomer.customer.id);

      // Generate JWT token
      console.log('[CustomerAuthController] Generating token for new customer');
      let token: string;
      try {
        token = jwtService.generateToken({
          id: newCustomer.customer.id,
          role: RoleType.CUSTOMER
        });
        console.log('[CustomerAuthController] Token generated successfully');
      } catch (error) {
        console.error('[CustomerAuthController] Failed to generate token:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to generate authentication token'
        });
      }

      // Create session
      console.log('[CustomerAuthController] Creating session for new customer');
      let session;
      try {
        session = sessionService.createSession({
          userId: newCustomer.customer.id,
          role: RoleType.CUSTOMER
        });
        console.log('[CustomerAuthController] Session created successfully:', session.id);

        // Store session in memory
        sessionService.updateSessionActivity(session.id);
      } catch (error) {
        console.error('[CustomerAuthController] Failed to create session:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to create session'
        });
      }

      const response = {
        success: true,
        customer: newCustomer.customer,
        isNewCustomer: true,
        token,
        sessionId: session.id
      };
      console.log('[CustomerAuthController] Sending response:', response);
      return res.status(201).json(response);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register phone number'
      });
    }
  }

  /**
   * Check if device has existing customer registration
   */
  async checkDevice(req: AuthenticatedRequest, res: Response) {
    try {
      const deviceId = req.headers['x-device-id'] as string;

      if (!deviceId) {
        return res.status(400).json({
          success: false,
          error: 'Device ID is required'
        });
      }

      const existingCustomer = await customerModel.findByDevice(deviceId);

      if (!existingCustomer.success || !existingCustomer.customer) {
        return res.status(200).json({
          success: true,
          hasRegistration: false
        });
      }

      // Get active sessions for the customer
      const activeSessions = sessionService.getUserSessions(existingCustomer.customer.id);
      const hasActiveSession = activeSessions.length > 0;

      return res.status(200).json({
        success: true,
        hasRegistration: true,
        phoneNumber: existingCustomer.customer.phone_number,
        hasActiveSession,
        sessionId: hasActiveSession ? activeSessions[0].id : undefined
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check device'
      });
    }
  }
}

export const customerAuthController = new CustomerAuthController();
