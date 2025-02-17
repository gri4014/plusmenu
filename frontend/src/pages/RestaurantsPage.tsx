import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { RestaurantList } from '../components/restaurants/RestaurantList';
import { CreateRestaurantModal } from '../components/restaurants/CreateRestaurantModal';
import { Button } from '../components/common/Button';
import { IRestaurant } from '../types/restaurant';

const PageContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
`;

const PageHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  margin: 0;
`;

const Description = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  margin: ${({ theme }) => theme.spacing.xs} 0 0;
`;

export const RestaurantsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const listRef = useRef<{ fetchRestaurants: () => void }>(null);

  const handleRestaurantClick = (restaurant: IRestaurant) => {
    // Navigate to restaurant details page
    // This will be implemented later when we add routing
    console.log('Restaurant clicked:', restaurant);
  };

  const handleCreateSuccess = () => {
    listRef.current?.fetchRestaurants();
  };

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <Title>Restaurants</Title>
          <Description>
            Manage your restaurant profiles and settings
          </Description>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          Create Restaurant
        </Button>
      </PageHeader>

      <RestaurantList 
        ref={listRef}
        onRestaurantClick={handleRestaurantClick} 
      />

      {showCreateModal && (
        <CreateRestaurantModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </PageContainer>
  );
};
