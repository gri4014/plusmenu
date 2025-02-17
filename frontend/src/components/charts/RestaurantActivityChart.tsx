import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card } from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../services/api';

const ChartContainer = styled(Card)`
  padding: ${({ theme }) => theme.spacing.lg};
  height: 400px;
  width: 100%;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const ChartTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-weight: 500;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

interface RestaurantActivity {
  name: string;
  orders: number;
  tables: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '8px 12px',
          border: '1px solid #f0f0f0',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <p style={{ margin: 0, color: '#666' }}>
          <strong>{label}</strong>
        </p>
        <p style={{ margin: '4px 0 0', color: '#1a73e8' }}>
          {payload[0].value} orders
        </p>
        <p style={{ margin: '4px 0 0', color: '#34a853' }}>
          {payload[1].value} active tables
        </p>
      </div>
    );
  }
  return null;
};

export const RestaurantActivityChart: React.FC = () => {
  const [data, setData] = useState<RestaurantActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulated data for now - will be replaced with actual API call
        const mockData = [
          { name: 'Restaurant A', orders: 45, tables: 8 },
          { name: 'Restaurant B', orders: 32, tables: 6 },
          { name: 'Restaurant C', orders: 28, tables: 5 },
          { name: 'Restaurant D', orders: 22, tables: 4 },
          { name: 'Restaurant E', orders: 18, tables: 3 }
        ];
        setData(mockData);
      } catch (error) {
        console.error('Failed to fetch restaurant activity data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <ChartContainer>
        <ChartHeader>
          <ChartTitle>Restaurant Activity</ChartTitle>
        </ChartHeader>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <LoadingSpinner />
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer>
      <ChartHeader>
        <ChartTitle>Restaurant Activity</ChartTitle>
      </ChartHeader>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f0f0f0"
          />
          <XAxis
            dataKey="name"
            tick={{ fill: '#666', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#f0f0f0' }}
          />
          <YAxis
            tick={{ fill: '#666', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="orders"
            fill="#1a73e8"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="tables"
            fill="#34a853"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
