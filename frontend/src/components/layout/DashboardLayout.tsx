import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { StatCard } from '../common/StatCard';
import { OrderVolumeChart } from '../charts/OrderVolumeChart';
import { RestaurantActivityChart } from '../charts/RestaurantActivityChart';
import { SystemPerformanceChart } from '../charts/SystemPerformanceChart';
import api from '../../services/api';
import { DashboardStatsPayload } from '../../types/websocket';
import { useWebSocket } from '../../hooks/useWebSocket';

// Icons (using emoji as placeholders - we can replace with proper icons later)
const ICONS = {
  restaurant: '🏪',
  orders: '📋',
  tables: '🪑',
  health: '💪'
};

const SOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3000';

const DashboardContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  position: relative;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin: ${({ theme }) => theme.spacing.xl} auto;
  max-width: 1200px;
  padding: 0 ${({ theme }) => theme.spacing.lg};
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.xl};
  margin: ${({ theme }) => theme.spacing.xl} auto;
  max-width: 1200px;
  padding: 0 ${({ theme }) => theme.spacing.lg};

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const FullWidthChart = styled.div`
  grid-column: 1 / -1;
`;

const ConnectionStatus = styled.div<{ isConnected: boolean }>`
  position: fixed;
  top: calc(${({ theme }) => theme.spacing.md} + 60px);
  right: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  z-index: 1000;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ isConnected, theme }) => 
    isConnected ? theme.colors.success : theme.colors.error}20;
  background: ${({ isConnected, theme }) => 
    isConnected ? theme.colors.success : theme.colors.error}10;
  color: ${({ isConnected, theme }) => 
    isConnected ? theme.colors.success : theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  transition: all ${({ theme }) => theme.transitions.default};
  opacity: 0.6;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ isConnected, theme }) => 
      isConnected ? theme.colors.success : theme.colors.error};
  }
`;

type DashboardStats = Omit<DashboardStatsPayload, 'timestamp'>;

export const DashboardLayout: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchInitialStats = useCallback(async () => {
    try {
      const [
        { data: restaurants },
        { data: orders },
        { data: tables }
      ] = await Promise.all([
        api.get('/developer/restaurants'),
        api.get('/orders?status=active'),
        api.get('/tables/sessions/active')
      ]);

      setStats({
        totalRestaurants: restaurants.length,
        activeOrders: orders.length,
        activeTables: tables.length,
        systemHealth: 'healthy'
      });
    } catch (error) {
      console.error('Failed to fetch initial dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleStatsUpdate = useCallback((data: DashboardStatsPayload) => {
    const { timestamp, ...statsData } = data;
    setStats(statsData);
    setLastUpdate(timestamp);
    setIsLoading(false);
  }, []);

  const handleConnect = useCallback(() => {
    setIsConnected(true);
    console.log('Connected to WebSocket server');
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    console.log('Disconnected from WebSocket server');
    setIsLoading(true);
  }, []);

  useWebSocket({
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onStatsUpdate: handleStatsUpdate
  });

  useEffect(() => {
    fetchInitialStats();
  }, [fetchInitialStats]);

  const getHealthColor = (health: 'healthy' | 'warning' | 'error') => {
    switch (health) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'primary';
    }
  };

  return (
    <DashboardContainer>
      <ConnectionStatus 
        isConnected={isConnected} 
        onClick={async () => {
          if (!isConnected && !isRetrying) {
            setIsRetrying(true);
            await fetchInitialStats();
            setIsRetrying(false);
          }
        }}
        title={isConnected ? 'WebSocket connection active' : 'Click to retry connection'}
      >
        {isConnected ? 'Connected' : isRetrying ? 'Retrying...' : 'Disconnected'}
      </ConnectionStatus>
      <StatsGrid>
        <StatCard
          title="Total Restaurants"
          value={stats?.totalRestaurants ?? 0}
          icon={ICONS.restaurant}
          isLoading={isLoading}
          timestamp={lastUpdate}
        />
        <StatCard
          title="Active Orders"
          value={stats?.activeOrders ?? 0}
          icon={ICONS.orders}
          color={stats?.activeOrders ? 'success' : undefined}
          isLoading={isLoading}
          timestamp={lastUpdate}
        />
        <StatCard
          title="Tables in Use"
          value={stats?.activeTables ?? 0}
          icon={ICONS.tables}
          color={stats?.activeTables ? 'primary' : undefined}
          isLoading={isLoading}
          timestamp={lastUpdate}
        />
        <StatCard
          title="System Health"
          value={stats?.systemHealth === 'healthy' ? 'Healthy' : 'Check Required'}
          icon={ICONS.health}
          color={stats?.systemHealth ? getHealthColor(stats.systemHealth) : undefined}
          isLoading={isLoading}
          timestamp={lastUpdate}
        />
      </StatsGrid>
      <ChartsGrid>
        <FullWidthChart>
          <OrderVolumeChart />
        </FullWidthChart>
        <RestaurantActivityChart />
        <SystemPerformanceChart />
      </ChartsGrid>
    </DashboardContainer>
  );
};
