import React, { useState } from 'react';
import { restaurantApi } from '../../services/api';
import { Button } from '../common/Button';
import { LoadingButton } from '../common/LoadingButton';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { IRestaurant } from '../../types/restaurant';

interface Props {
  restaurant: IRestaurant;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditRestaurantModal: React.FC<Props> = ({ restaurant, onClose, onSuccess }) => {
  const [name, setName] = useState(restaurant.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate name
      if (!name.trim()) {
        throw new Error('Restaurant name is required');
      }

      // Update restaurant
      const result = await restaurantApi.updateRestaurant(restaurant.id, {
        name: name.trim()
      });

      // Handle success
      if (result.success && result.data) {
        onSuccess(); // Refresh restaurant list
        onClose(); // Close modal
      } else {
        throw new Error('Failed to update restaurant');
      }
    } catch (err) {
      console.error('Restaurant update error:', err);
      let errorMessage = 'Failed to update restaurant';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'error' in err) {
        errorMessage = String(err.error);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Edit Restaurant</h2>
          <Input
            label="Restaurant Name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            required
            placeholder="Enter restaurant name"
            className="w-full"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            onClick={onClose}
            $variant="secondary"
            disabled={loading}
          >
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            loading={loading}
            $variant="primary"
          >
            Save Changes
          </LoadingButton>
        </div>
      </form>
    </Modal>
  );
};

export default EditRestaurantModal;
