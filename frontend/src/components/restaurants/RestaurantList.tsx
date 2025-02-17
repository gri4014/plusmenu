import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { IRestaurant } from '../../types/restaurant';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { restaurantApi } from '../../services/api';
import EditRestaurantModal from './EditRestaurantModal';
import DeleteRestaurantModal from './DeleteRestaurantModal';
import { RestaurantDetailsModal } from './RestaurantDetailsModal';

const Container = styled.div``;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SearchContainer = styled.div`
  max-width: 400px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const RestaurantsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const RestaurantCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing.lg};
  transition: all ${({ theme }) => theme.transitions.default};
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.border};
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.colors.primary}40;
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const RestaurantName = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
`;

const RestaurantDate = styled.p`
  margin: ${({ theme }) => theme.spacing.xs} 0;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
`;

interface ThemePreviewProps {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  theme?: any; // Required for styled-components
}

const ThemePreview = styled.div<ThemePreviewProps>`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing.md};

  > div {
    width: 24px;
    height: 24px;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg} 0;
`;

const PageButton = styled.button<{ active?: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  min-width: 40px;
  border: 1px solid ${({ theme, active }) => active ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, active }) => active ? theme.colors.primary : 'transparent'};
  color: ${({ theme, active }) => active ? '#fff' : theme.colors.text.primary};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.default};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};

  &:hover {
    background: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.inputBg};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    border-color: ${({ theme }) => theme.colors.border};
    &:hover {
      background: transparent;
      border-color: ${({ theme }) => theme.colors.border};
    }
  }
`;

interface RestaurantListProps {
  onRestaurantClick?: (restaurant: IRestaurant) => void;
}

export const RestaurantList = React.forwardRef<{ fetchRestaurants: () => void }, RestaurantListProps>((props, ref) => {
  const { onRestaurantClick } = props;
  const [editingRestaurant, setEditingRestaurant] = useState<IRestaurant | null>(null);
  const [deletingRestaurant, setDeletingRestaurant] = useState<IRestaurant | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<IRestaurant | null>(null);
  const [restaurants, setRestaurants] = useState<IRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await restaurantApi.getRestaurants({
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        search: searchQuery || undefined,
        orderBy: 'created_at',
        orderDirection: 'DESC'
      });
      
      if (response.success && response.data) {
        setRestaurants(response.data.data);
        setTotalPages(Math.ceil(response.data.total / itemsPerPage));
      } else {
        setRestaurants([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, itemsPerPage]);

  // Refresh list when component mounts

  // Expose fetchRestaurants through ref
  React.useImperativeHandle(ref, () => ({
    fetchRestaurants
  }));

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Container>
      <Header>
        <SearchContainer>
          <Input
            type="text"
            placeholder="Search restaurants..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </SearchContainer>
      </Header>

      {restaurants.length === 0 ? (
        <NoResults>No restaurants found</NoResults>
      ) : (
        <RestaurantsGrid>
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              onClick={() => setSelectedRestaurant(restaurant)}
            >
              <div className="flex justify-end mb-2">
                <Button
                  $variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingRestaurant(restaurant);
                  }}
                >
                  Edit
                </Button>
                <Button
                  $variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingRestaurant(restaurant);
                  }}
                  style={{ marginLeft: '16px', borderColor: '#dc2626', color: '#dc2626' }}
                >
                  Delete
                </Button>
              </div>
              <RestaurantName>{restaurant.name}</RestaurantName>
              <RestaurantDate>
                Created: {new Date(restaurant.created_at).toLocaleDateString()}
              </RestaurantDate>
              {restaurant.theme_colors && (
                <ThemePreview colors={restaurant.theme_colors}>
                  <div style={{ background: restaurant.theme_colors.primary }} />
                  <div style={{ background: restaurant.theme_colors.secondary }} />
                  <div style={{ background: restaurant.theme_colors.accent }} />
                </ThemePreview>
              )}
            </RestaurantCard>
          ))}
        </RestaurantsGrid>
      )}

      {selectedRestaurant && (
        <RestaurantDetailsModal
          restaurant={selectedRestaurant}
          isOpen={true}
          onClose={() => setSelectedRestaurant(null)}
        />
      )}

      {totalPages > 1 && (
        <PaginationContainer>
          <PageButton
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </PageButton>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PageButton
              key={page}
              active={page === currentPage}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </PageButton>
          ))}
          <PageButton
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </PageButton>
        </PaginationContainer>
      )}

      {editingRestaurant && (
        <EditRestaurantModal
          restaurant={editingRestaurant}
          onClose={() => setEditingRestaurant(null)}
          onSuccess={() => {
            setEditingRestaurant(null);
            fetchRestaurants();
          }}
        />
      )}

      {deletingRestaurant && (
        <DeleteRestaurantModal
          restaurant={deletingRestaurant}
          onClose={() => setDeletingRestaurant(null)}
          onSuccess={() => {
            setDeletingRestaurant(null);
            fetchRestaurants();
          }}
        />
      )}
    </Container>
  );
});

RestaurantList.displayName = 'RestaurantList';
