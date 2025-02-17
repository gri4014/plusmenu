import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { restaurantAdminApi, IRestaurantAdmin } from '../../services/restaurantAdmin';
import { CreateAdminModal } from './CreateAdminModal';
import { EditAdminModal } from './EditAdminModal';

const Section = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
`;

const AdminList = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const AdminItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  &:last-child {
    margin-bottom: 0;
  }
`;

const AdminInfo = styled.div`
  flex: 1;
`;

const AdminLogin = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
`;

const AdminMeta = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

interface StaffManagementSectionProps {
  restaurantId: string;
}

export const StaffManagementSection: React.FC<StaffManagementSectionProps> = ({ restaurantId }) => {
  const [admins, setAdmins] = useState<IRestaurantAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<IRestaurantAdmin | null>(null);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await restaurantAdminApi.list(restaurantId);
      if (response.success) {
        setAdmins(response.data);
      } else {
        setError('Failed to load restaurant admins');
      }
    } catch (err) {
      setError('An error occurred while loading admins');
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [restaurantId]);

  const handleDelete = async (adminId: string) => {
    if (!window.confirm('Are you sure you want to deactivate this admin?')) {
      return;
    }

    try {
      const response = await restaurantAdminApi.delete(restaurantId, adminId);
      if (response.success) {
        await fetchAdmins();
      } else {
        setError('Failed to deactivate admin');
      }
    } catch (err) {
      setError('An error occurred while deactivating admin');
      console.error('Error deleting admin:', err);
    }
  };

  return (
    <Section>
      <SectionTitle>Staff Management</SectionTitle>
      
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <>
          <Button $variant="primary" onClick={() => setIsCreateModalOpen(true)}>Add New Admin</Button>
          
          <AdminList>
            {admins.map((admin) => (
              <AdminItem key={admin.id}>
                <AdminInfo>
                  <AdminLogin>{admin.login}</AdminLogin>
                  <AdminMeta>
                    Last login: {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}
                  </AdminMeta>
                </AdminInfo>
                <Actions>
                  <Button 
                    $variant="secondary"
                    onClick={() => setEditingAdmin(admin)}
                  >
                    Edit
                  </Button>
                  <Button 
                    $variant="danger"
                    onClick={() => handleDelete(admin.id)}
                  >
                    Delete
                  </Button>
                </Actions>
              </AdminItem>
            ))}
            
            {admins.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No admins found
              </div>
            )}
          </AdminList>

          <CreateAdminModal
            restaurantId={restaurantId}
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={fetchAdmins}
          />

          {editingAdmin && (
            <EditAdminModal
              restaurantId={restaurantId}
              admin={editingAdmin}
              isOpen={true}
              onClose={() => setEditingAdmin(null)}
              onSuccess={fetchAdmins}
            />
          )}
        </>
      )}
    </Section>
  );
};
