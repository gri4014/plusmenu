import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useRestaurantAuth } from '../../contexts/RestaurantAuthContext';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Title } from '../../components/common/Title';
import { tablesService } from '../../services/tables';
import { ITable, TableStatus } from '../../types/table';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WebSocketEvents, TableEventPayload } from '../../types/websocket';
import styled from 'styled-components';

const TablesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const TableCard = styled(Card)`
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const NotificationBadge = styled.div<{ type: 'order' | 'waiter' }>`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${props => props.type === 'order' ? props.theme.colors.error : props.theme.colors.warning};
`;

const QRImage = styled.img`
  max-width: 200px;
  margin: 10px auto;
`;

const GenerateSection = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  margin-top: 10px;
  padding: 10px;
  background-color: ${props => props.theme.colors.error + '10'};
  border-radius: 4px;
  border: 1px solid ${props => props.theme.colors.error + '30'};
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 14px;
`;

const SuccessMessage = styled.div`
  color: ${props => props.theme.colors.success};
  margin-top: 10px;
  padding: 10px;
  background-color: ${props => props.theme.colors.success + '10'};
  border-radius: 4px;
  border: 1px solid ${props => props.theme.colors.success + '30'};
`;

const TableStatusBadge = styled.div<{ status: TableStatus }>`
  padding: 5px 10px;
  border-radius: 4px;
  margin: 10px 0;
  background-color: ${props => {
    switch (props.status) {
      case TableStatus.AVAILABLE:
        return props.theme.colors.success + '20';
      case TableStatus.OCCUPIED:
        return props.theme.colors.warning + '20';
      case TableStatus.RESERVED:
        return props.theme.colors.primary + '20';
      case TableStatus.INACTIVE:
      default:
        return props.theme.colors.text.disabled + '20';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case TableStatus.AVAILABLE:
        return props.theme.colors.success;
      case TableStatus.OCCUPIED:
        return props.theme.colors.warning;
      case TableStatus.RESERVED:
        return props.theme.colors.primary;
      case TableStatus.INACTIVE:
      default:
        return props.theme.colors.text.disabled;
    }
  }};
`;

interface TableNotifications {
  [tableId: string]: {
    hasNewOrder: boolean;
    hasWaiterCall: boolean;
  };
}

export const TablesPage: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { isAuthenticated, admin, isLoading } = useRestaurantAuth();
  const [tables, setTables] = useState<ITable[]>([]);
  const [notifications, setNotifications] = useState<TableNotifications>({});
  const [tableCount, setTableCount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    if (!restaurantId) return;
    
    try {
      setError(null);
      console.log('Fetching tables for restaurant:', restaurantId);
      console.log('Current admin:', admin);
      const data = await tablesService.listTables(restaurantId);
      console.log('Fetched tables response:', data);
      // Only show active tables
      setTables(data.filter(table => table.is_active));
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        console.error('Table fetch error:', {
          error,
          restaurantId,
          admin,
          message: error.message,
          stack: error.stack
        });
      } else {
        setError('Failed to fetch tables: An unexpected error occurred');
        console.error('Unknown table fetch error:', error);
      }
    }
  }, [restaurantId, admin]);

  useEffect(() => {
    if (isAuthenticated && admin?.restaurantId === restaurantId && !isLoading) {
      fetchTables();
    }
  }, [isAuthenticated, admin, restaurantId, isLoading, fetchTables]);

  const handleTableEvent = useCallback((data: TableEventPayload) => {
    setNotifications(prev => ({
      ...prev,
      [data.tableId]: {
        ...prev[data.tableId],
        hasNewOrder: data.type === 'order' ? true : prev[data.tableId]?.hasNewOrder || false,
        hasWaiterCall: data.type === 'waiter' ? true : prev[data.tableId]?.hasWaiterCall || false
      }
    }));
  }, []);

  useWebSocket({
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: () => console.log('WebSocket disconnected'),
    onEvent: {
      [WebSocketEvents.TABLE_NEW_ORDER]: handleTableEvent,
      [WebSocketEvents.TABLE_WAITER_CALLED]: handleTableEvent
    }
  });

  const clearNotifications = useCallback((tableId: string) => {
    setNotifications(prev => ({
      ...prev,
      [tableId]: {
        hasNewOrder: false,
        hasWaiterCall: false
      }
    }));
  }, []);

  const handleGenerateTables = async () => {
    const count = parseInt(tableCount);
    if (isNaN(count) || count < 1) {
      setError('Пожалуйста, введите корректное количество столов');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Generating tables:', {
        restaurantId,
        count,
        admin
      });
      
      const result = await tablesService.createTable(restaurantId!, count);
      console.log('Table generation result:', result);
      
      await fetchTables();
      setTableCount('');
      setSuccess(`Успешно создано ${count} стол${count > 1 ? 'ов' : ''} с QR-кодами`);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        console.error('Detailed error:', error);
      } else {
        setError('Failed to generate tables: An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    setError(null);
    setSuccess(null);
    try {
      await tablesService.deleteTable(restaurantId!, tableId);
      await fetchTables();
      setSuccess('Table and associated QR code deleted successfully');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        console.error('Detailed error:', error);
      } else {
        setError('Failed to delete table: An unexpected error occurred');
      }
    }
  };

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || admin?.restaurantId !== restaurantId) {
    return <Navigate to="/restaurant/login" />;
  }

  return (
    <PageContainer>
      <Title>Управление столами</Title>

      <GenerateSection>
        <Input
          type="number"
          min="1"
          value={tableCount}
          onChange={(e) => setTableCount(e.target.value)}
          placeholder="Количество столов"
          style={{ width: '150px' }}
        />
        <Button
          onClick={handleGenerateTables}
          disabled={loading || !tableCount}
        >
          {loading ? 'Создание...' : 'Создать столы'}
        </Button>
      </GenerateSection>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <TablesGrid>
        {tables.map((table) => (
          <TableCard key={table.id} onClick={() => clearNotifications(table.id)}>
            {notifications[table.id]?.hasNewOrder && <NotificationBadge type="order" />}
            {notifications[table.id]?.hasWaiterCall && <NotificationBadge type="waiter" />}
            <h3>Стол {table.table_number || 'Удален'}</h3>
{table.qr_code_image_path && (
  <QRImage
    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/storage/qrcodes/${table.qr_code_image_path}`}
    alt={`QR-код для стола ${table.table_number || 'Удален'}`}
    onError={(e) => {
      console.error('Failed to load QR code image:', {
        url: e.currentTarget.src,
        table: {
          id: table.id,
          table_number: table.table_number,
          qr_code_image_path: table.qr_code_image_path
        }
      });
      e.currentTarget.style.display = 'none';
    }}
    onLoad={(e) => {
      console.log('QR code loaded successfully:', {
        url: e.currentTarget.src,
        table: {
          id: table.id,
          table_number: table.table_number,
          qr_code_image_path: table.qr_code_image_path
        }
      });
    }}
  />
)}
            <TableStatusBadge status={table.status}>
              {table.status}
            </TableStatusBadge>
            <Button onClick={() => handleDeleteTable(table.id)} $variant="danger">
              Удалить стол
            </Button>
          </TableCard>
        ))}
      </TablesGrid>
    </PageContainer>
  );
};
