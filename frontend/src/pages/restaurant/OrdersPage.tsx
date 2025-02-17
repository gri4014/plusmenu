import React, { useState } from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { OrderList } from '@/components/orders/OrderList';
import { OrderStatus } from '@/types/order';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import styled from 'styled-components';
import { useRestaurantAuth } from '@/contexts/RestaurantAuthContext';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Title } from '@/components/common/Title';

const FiltersContainer = styled(Card)`
  margin-bottom: 1rem;
  padding: 1rem;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: center;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: white;
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
`;

export const OrdersPage: React.FC = () => {
  const { admin, isLoading } = useRestaurantAuth();
  const [filters, setFilters] = useState({
    status: '' as OrderStatus | '',
    tableId: '',
    dateFrom: '',
    dateTo: ''
  });

  const handleFilterChange = (key: keyof typeof filters) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: e.target.value
    }));
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <PageContainer>
      <FiltersContainer>
        <Title>Заказы</Title>
        <FiltersGrid>
          <div>
            <Label>Статус</Label>
            <Select
              value={filters.status}
              onChange={handleFilterChange('status')}
            >
              <option value="">Все статусы</option>
              <option value="pending">Ожидает</option>
              <option value="preparing">Готовится</option>
              <option value="ready">Готов</option>
              <option value="completed">Выполнен</option>
              <option value="cancelled">Отменен</option>
            </Select>
          </div>

          <div>
            <Label>Номер стола</Label>
            <Input
              type="text"
              placeholder="Введите номер стола"
              value={filters.tableId}
              onChange={handleFilterChange('tableId')}
            />
          </div>

          <div>
            <Label>С даты</Label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={handleFilterChange('dateFrom')}
            />
          </div>

          <div>
            <Label>По дату</Label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={handleFilterChange('dateTo')}
            />
          </div>
        </FiltersGrid>
      </FiltersContainer>

      <OrderList
        restaurantId={admin.restaurantId}
        filters={{
          status: filters.status as OrderStatus || undefined,
          tableId: filters.tableId || undefined,
          dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined
        }}
      />
    </PageContainer>
  );
};
