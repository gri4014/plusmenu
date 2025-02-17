import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { IRestaurant } from '../../types/restaurant';
import { restaurantApi } from '../../services/api';
import { StaffManagementSection } from './StaffManagementSection';

const ModalHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
`;

const ModalContent = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const InfoSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const InfoLabel = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const InfoValue = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
`;

const ThemeSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const ColorPreview = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ color }) => color};
  margin-right: ${({ theme }) => theme.spacing.sm};
`;

const ColorsContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const ColorInfo = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${({ theme }) => theme.spacing.lg};
`;

const ColorLabel = styled.span`
  margin-left: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const ModalFooter = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: flex-end;
`;

interface RestaurantDetailsModalProps {
  restaurant: IRestaurant;
  isOpen: boolean;
  onClose: () => void;
}

export const RestaurantDetailsModal: React.FC<RestaurantDetailsModalProps> = ({
  restaurant,
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<IRestaurant | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await restaurantApi.getRestaurantById(restaurant.id);
        setDetails(response.data.data);
      } catch (err) {
        setError('Failed to load restaurant details');
        console.error('Error fetching restaurant details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchDetails();
    }
  }, [isOpen, restaurant.id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>{restaurant.name}</ModalTitle>
      </ModalHeader>

      <ModalContent>
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage>{error}</ErrorMessage>
        ) : details && (
          <>
            <InfoSection>
              <InfoLabel>Status</InfoLabel>
              <InfoValue>
                {details.is_active ? 'Active' : 'Inactive'}
              </InfoValue>
            </InfoSection>

            <InfoSection>
              <InfoLabel>Created</InfoLabel>
              <InfoValue>
                {new Date(details.created_at).toLocaleDateString()}
              </InfoValue>
            </InfoSection>

            {details.updated_at && (
              <InfoSection>
                <InfoLabel>Last Updated</InfoLabel>
                <InfoValue>
                  {new Date(details.updated_at).toLocaleDateString()}
                </InfoValue>
              </InfoSection>
            )}

            {details.theme_colors && (
              <ThemeSection>
                <InfoLabel>Theme Colors</InfoLabel>
                <ColorsContainer>
                  <ColorInfo>
                    <ColorPreview color={details.theme_colors.primary} />
                    <ColorLabel>Primary</ColorLabel>
                  </ColorInfo>
                  <ColorInfo>
                    <ColorPreview color={details.theme_colors.secondary} />
                    <ColorLabel>Secondary</ColorLabel>
                  </ColorInfo>
                  <ColorInfo>
                    <ColorPreview color={details.theme_colors.accent} />
                    <ColorLabel>Accent</ColorLabel>
                  </ColorInfo>
                </ColorsContainer>
              </ThemeSection>
            )}

            <StaffManagementSection restaurantId={restaurant.id} />
          </>
        )}
      </ModalContent>

      <ModalFooter>
        <Button onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
};
