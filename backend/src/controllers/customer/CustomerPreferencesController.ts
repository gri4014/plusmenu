import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { customerModel } from '../../models/entities/CustomerModel';

export class CustomerPreferencesController {
  constructor() {
    // Bind methods to ensure proper 'this' context
    this.updatePreferences = this.updatePreferences.bind(this);
    this.getPreferences = this.getPreferences.bind(this);
  }

  /**
   * Update customer preferences
   */
  async updatePreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        console.error(`[CustomerPreferences] Unauthorized update attempt from IP: ${req.ip}`);
        return res.status(401).json({
          success: false,
          error: 'Unauthorized access - user ID not found in request'
        });
      }

      const { dietary_restrictions, allergies, taste_preferences } = req.body;
      console.log(`[CustomerPreferences] Updating preferences for customer: ${customerId}`, {
        dietary_restrictions,
        allergies,
        taste_preferences
      });

      const result = await customerModel.updatePreferences(customerId, {
        dietary_restrictions,
        allergies,
        taste_preferences
      });

      if (!result.success) {
        console.error(`[CustomerPreferences] Failed to update preferences for customer ${customerId}: ${result.error}`);
        return res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to update customer preferences'
        });
      }

      console.log(`[CustomerPreferences] Successfully updated preferences for customer: ${customerId}`);
      return res.status(200).json({
        success: true,
        message: 'Preferences updated successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`[CustomerPreferences] Unexpected error updating preferences for customer ${req.user?.id}: ${errorMessage}`);
      console.error(error);
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error while updating preferences',
        details: errorMessage
      });
    }
  }

  /**
   * Get customer preferences
   */
  async getPreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const customerId = req.user?.id;
      if (!customerId) {
        console.error(`[CustomerPreferences] Unauthorized access attempt from IP: ${req.ip}`);
        return res.status(401).json({
          success: false,
          error: 'Unauthorized access - user ID not found in request'
        });
      }

      console.log(`[CustomerPreferences] Retrieving preferences for customer: ${customerId}`);
      const result = await customerModel.getPreferences(customerId);

      if (!result.success) {
        console.error(`[CustomerPreferences] Failed to get preferences for customer ${customerId}: ${result.error}`);
        return res.status(400).json({
          success: false,
          error: result.error,
          message: 'Failed to retrieve customer preferences'
        });
      }

      console.log(`[CustomerPreferences] Successfully retrieved preferences for customer: ${customerId}`);
      return res.status(200).json({
        success: true,
        preferences: result.preferences,
        message: 'Preferences retrieved successfully'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`[CustomerPreferences] Unexpected error for customer ${req.user?.id}: ${errorMessage}`);
      console.error(error);
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error while retrieving preferences',
        details: errorMessage
      });
    }
  }
}

export const customerPreferencesController = new CustomerPreferencesController();
