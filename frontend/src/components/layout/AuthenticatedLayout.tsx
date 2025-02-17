import React from 'react';
import styled from 'styled-components';
import { Header } from '@/components/common/Header';
import { Navigation } from './Navigation';

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background};
`;

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  return (
    <LayoutContainer>
      <Header />
      <Navigation />
      <MainContent>{children}</MainContent>
    </LayoutContainer>
  );
};
