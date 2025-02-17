import React from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { useRestaurantAuth } from '../../contexts/RestaurantAuthContext';

const Nav = styled.nav`
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`;

const NavItem = styled.li`
  margin: 0;
`;

const NavLink = styled(Link)<{ active?: boolean }>`
  color: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.text.primary};
  text-decoration: none;
  font-weight: ${({ theme, active }) => active ? theme.typography.fontWeights.semibold : theme.typography.fontWeights.normal};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: all ${({ theme }) => theme.transitions.default};
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.inputBg};
  }
`;

export const RestaurantNavigation: React.FC = () => {
  const location = useLocation();
  const { admin } = useRestaurantAuth();

  const getLinks = () => {
    if (!admin?.restaurantId) return [];

    return [
      { to: `/restaurant/${admin.restaurantId}/orders`, label: 'Заказы' },
      { to: `/restaurant/${admin.restaurantId}/menu`, label: 'Меню' },
      { to: `/restaurant/${admin.restaurantId}/tables`, label: 'Столы' },
    ];
  };

  const links = getLinks();

  return (
    <Nav>
      <NavList>
        {links.map(({ to, label }) => (
          <NavItem key={to}>
            <NavLink to={to} active={location.pathname === to}>
              {label}
            </NavLink>
          </NavItem>
        ))}
      </NavList>
    </Nav>
  );
};
