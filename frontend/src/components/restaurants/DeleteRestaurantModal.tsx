import React, { useState } from 'react';
import { restaurantApi } from '../../services/api';
import { Button } from '../common/Button';
import { LoadingButton } from '../common/LoadingButton';
import { Modal } from '../common/Modal';
import { IRestaurant } from '../../types/restaurant';

interface Props {
  restaurant: IRestaurant;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteRestaurantModal: React.FC<Props> = ({ restaurant, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      await restaurantApi.deleteRestaurant(restaurant.id);
      onSuccess(); // Refresh restaurant list
      onClose(); // Close modal
    } catch (err) {
      console.error('Restaurant deletion error:', err);
      let errorMessage = 'Failed to delete restaurant';
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
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Delete Restaurant</h2>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete <span className="font-semibold">{restaurant.name}</span>?
          </p>
          <p className="text-red-500 text-sm">
            This action cannot be undone.
          </p>
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
            type="button"
            onClick={handleDelete}
            loading={loading}
            $variant="primary"
            style={{ backgroundColor: '#dc2626' }} // Tailwind red-600
          >
            Delete
          </LoadingButton>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteRestaurantModal;
