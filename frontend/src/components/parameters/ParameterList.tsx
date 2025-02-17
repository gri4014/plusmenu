import React from 'react';
import styled from 'styled-components';
import { Button } from '../common/Button';
import { Parameter, DataType, DATA_TYPE_LABELS } from '../../types/parameters';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Status = styled.span<{ $active: boolean }>`
  display: inline-block;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.success + '20' : theme.colors.error + '20'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.success : theme.colors.error};
`;

const ActionButton = styled(Button)`
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

interface Props {
  parameters: Parameter[];
  onEdit: (parameter: Parameter) => void;
  onDelete: (parameterId: string) => void;
}

export const ParameterList: React.FC<Props> = ({
  parameters,
  onEdit,
  onDelete,
}) => {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Name</Th>
          <Th>Type</Th>
          <Th>Status</Th>
          <Th>Actions</Th>
        </tr>
      </thead>
      <tbody>
        {parameters.map((parameter) => (
          <tr key={parameter.id}>
            <Td>{parameter.name}</Td>
            <Td>{DATA_TYPE_LABELS[parameter.data_type as DataType]}</Td>
            <Td>
              <Status $active={parameter.is_active}>
                {parameter.is_active ? 'Active' : 'Inactive'}
              </Status>
            </Td>
            <Td>
              <ActionButton
                type="button"
                $variant="secondary"
                $size="sm"
                onClick={() => onEdit(parameter)}
              >
                Edit
              </ActionButton>
              <ActionButton
                type="button"
                $variant="danger"
                $size="sm"
                onClick={() => onDelete(parameter.id)}
              >
                Delete
              </ActionButton>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
