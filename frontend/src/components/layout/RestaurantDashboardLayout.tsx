import React from 'react';
import styled from 'styled-components';
import { RestaurantNavigation } from './RestaurantNavigation';
import { useRestaurantAuth } from '@/contexts/RestaurantAuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { LoadingSpinner } from '../common/LoadingSpinner';

const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`;

const Header = styled.div`
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl};
  text-align: right;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Content = styled.main`
  padding: ${({ theme }) => theme.spacing.xl};
`;

const RestaurantId = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  background: rgba(255, 255, 255, 0.1);
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

export const RestaurantDashboardLayout: React.FC = () => {
  const { admin, isLoading } = useRestaurantAuth();

  if (isLoading) {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  if (!admin) {
    return <Navigate to="/restaurant/login" replace />;
  }

  return (
    <Container>
      <Header>
        <RestaurantId>Restaurant ID: {admin.restaurantId}</RestaurantId>
      </Header>
      <RestaurantNavigation />
      <Content>
        <Outlet />
      </Content>
    </Container>
  );
};
