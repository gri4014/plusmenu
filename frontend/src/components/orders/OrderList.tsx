import React, { useEffect, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import ordersService from '@/services/orders';
import { Order, OrderItem, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, OrderStatus } from '@/types/order';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import styled, { useTheme } from 'styled-components';

const OrdersContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const OrderCard = styled(Card)`
  padding: 1.5rem;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const OrderId = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const StatusBadge = styled.span<{ status: OrderStatus }>`
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: ${({ status }) => ORDER_STATUS_COLORS[status]};
  color: white;
`;

const ItemsList = styled.div`
  margin: 1rem 0;
`;

const Item = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ItemDetails = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Quantity = styled.span`
  font-weight: 500;
`;

const Price = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const TotalAmount = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  background-color: ${({ variant, theme }) =>
    variant === 'primary' ? theme.colors.primary : theme.colors.text.secondary};
  color: white;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface OrderListProps {
  restaurantId: string;
  filters?: {
    status?: OrderStatus;
    tableId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  };
}

export const OrderList: React.FC<OrderListProps> = ({ restaurantId, filters }) => {
  const theme = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { socket } = useWebSocket();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersService.getOrders({
        restaurant_id: restaurantId,
        ...filters
      });
      setOrders(response.data);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить заказы');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await ordersService.updateOrderStatus(orderId, newStatus);
      // The WebSocket will handle the update in real-time
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Не удалось обновить статус заказа. Пожалуйста, попробуйте снова.');
      // Refresh orders to ensure we have the latest state
      fetchOrders();
    }
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to order updates
    if (socket?.connected) {
      socket?.on('orderCreated', (newOrder: Order) => {
        if (newOrder.restaurant_id === restaurantId) {
          setOrders(prev => [newOrder, ...prev]);
        }
      });

      socket?.on('orderUpdated', (updatedOrder: Order) => {
        setOrders(prev =>
          prev.map(order =>
            order.id === updatedOrder.id ? updatedOrder : order
          )
        );
      });
    }

    return () => {
      if (socket?.connected) {
        socket?.off('orderCreated');
        socket?.off('orderUpdated');
      }
    };
  }, [restaurantId, filters, socket]);

  if (loading) {
      return <LoadingSpinner text="Загрузка..." />;
  }

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '2rem', color: theme.colors.error }}>
          {error}
        </div>
      </Card>
    );
  }

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: OrderStatus[] = ['pending', 'preparing', 'ready', 'completed'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;
  };

  return (
    <OrdersContainer>
      {orders.map(order => (
        <OrderCard key={order.id}>
          <OrderHeader>
            <OrderId>Заказ №{order.id.slice(0, 8)}</OrderId>
            <StatusBadge status={order.status as OrderStatus}>
              {ORDER_STATUS_LABELS[order.status as OrderStatus]}
            </StatusBadge>
          </OrderHeader>
          
          <ItemsList>
            {order.items.map((item: OrderItem) => (
              <Item key={item.id}>
                <ItemDetails>
                  <Quantity>{item.quantity}x</Quantity>
                  <span>{item.name}</span>
                </ItemDetails>
                <Price>{(item.price * item.quantity).toFixed(2)} ₽</Price>
              </Item>
            ))}
          </ItemsList>
          
          <TotalAmount>
            <span>Итого</span>
            <span>{order.total_amount.toFixed(2)} ₽</span>
          </TotalAmount>
          
          {order.status !== 'completed' && (
            <ActionButtons>
              {getNextStatus(order.status) && (
                <Button
                  variant="primary"
                  onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status)!)}
                >
                  Отметить как {ORDER_STATUS_LABELS[getNextStatus(order.status)!]}
                </Button>
              )}
            </ActionButtons>
          )}
        </OrderCard>
      ))}
      
      {orders.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Заказы не найдены
          </div>
        </Card>
      )}
    </OrdersContainer>
  );
};
