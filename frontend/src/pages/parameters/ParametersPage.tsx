import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PageContainer } from '../../components/common/PageContainer';
import { Title } from '../../components/common/Title';
import { Button } from '../../components/common/Button';
import { ParameterList } from '../../components/parameters/ParameterList';
import { ParameterModal } from '../../components/parameters/ParameterModal';
import { Parameter, CreateParameterPayload } from '../../types/parameters';
import { developerParametersService } from '../../services/parameters';

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const ParametersPage: React.FC = () => {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<Parameter>();

  const fetchParameters = async () => {
    try {
      const response = await developerParametersService.getParameters();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch parameters');
      }
      setParameters(response.data || []);
    } catch (error) {
      console.error('Failed to fetch parameters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, []);

  const handleCreateParameter = async (data: CreateParameterPayload) => {
    try {
      const response = await developerParametersService.createParameter(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create parameter');
      }
      await fetchParameters();
    } catch (error) {
      console.error('Failed to create parameter:', error);
    }
  };

  const handleUpdateParameter = async (data: CreateParameterPayload) => {
    if (!selectedParameter) return;

    try {
      const response = await developerParametersService.updateParameter(selectedParameter.id, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update parameter');
      }
      await fetchParameters();
    } catch (error) {
      console.error('Failed to update parameter:', error);
    }
  };

  const handleDeleteParameter = async (parameterId: string) => {
    try {
      const response = await developerParametersService.deleteParameter(parameterId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete parameter');
      }
      await fetchParameters();
    } catch (error) {
      console.error('Failed to delete parameter:', error);
    }
  };

  const handleEdit = (parameter: Parameter) => {
    setSelectedParameter(parameter);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedParameter(undefined);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Title>Parameters</Title>
        <p>Loading...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <Title>Parameters</Title>
        <Button
          type="button"
          $variant="primary"
          onClick={() => setIsModalOpen(true)}
        >
          Add Parameter
        </Button>
      </Header>

      <ParameterList
        parameters={parameters}
        onEdit={handleEdit}
        onDelete={handleDeleteParameter}
      />

      <ParameterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={selectedParameter ? handleUpdateParameter : handleCreateParameter}
        parameter={selectedParameter}
        title={selectedParameter ? 'Edit Parameter' : 'Add Parameter'}
      />
    </PageContainer>
  );
};
