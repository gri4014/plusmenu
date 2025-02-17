import React from 'react';
import styled from 'styled-components';
import { Button } from '../common/Button';
import { Checkbox } from '../common/Checkbox';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Category } from '../../types/category';

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const Th = styled.th`
  text-align: left;
  padding: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const OrderInput = styled.input`
  width: 60px;
  padding: ${({ theme }) => theme.spacing.xs};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  background-color: ${({ theme }) => theme.colors.inputBg};
  text-align: center;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    opacity: 1;
  }
`;

const Tr = styled.tr`
  &:hover {
    background-color: ${({ theme }) => theme.colors.hover};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onToggleActive: (categoryId: string, isActive: boolean) => void;
  onUpdateOrder: (categoryId: string, order: number) => void;
  isLoading?: boolean;
}

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text.secondary};
`;

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onEdit,
  onDelete,
  onToggleActive,
  onUpdateOrder,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <EmptyState>
        <LoadingSpinner />
      </EmptyState>
    );
  }

  if (categories.length === 0) {
    return (
      <EmptyState>
        Категории не найдены. Нажмите "Добавить категорию" чтобы создать новую.
      </EmptyState>
    );
  }
  const handleOrderChange = (categoryId: string, newOrder: number) => {
    onUpdateOrder(categoryId, newOrder);
  };

  return (
    <Table>
      <thead>
        <tr>
          <Th>Порядок</Th>
          <Th>Название</Th>
          <Th>Активна</Th>
          <Th>Действия</Th>
        </tr>
      </thead>
      <tbody>
        {[...categories]
          .sort((a, b) => a.display_order - b.display_order)
          .map((category) => (
          <Tr key={category.id}>
            <Td>
              <OrderInput
                type="number"
                min="0"
                value={category.display_order}
                onChange={(e) => handleOrderChange(category.id, parseInt(e.target.value, 10))}
              />
            </Td>
            <Td>{category.name}</Td>
            <Td>
              <Checkbox
                id={`active-${category.id}`}
                label=""
                checked={category.is_active}
                onChange={(e) => onToggleActive(category.id, e.target.checked)}
              />
            </Td>
            <Td>
              <ButtonGroup>
                <Button
                  type="button"
                  $variant="secondary"
                  $size="sm"
                  onClick={() => onEdit(category)}
                >
                  Изменить
                </Button>
                <Button
                  type="button"
                  $variant="danger"
                  $size="sm"
                  onClick={() => onDelete(category)}
                >
                  Удалить
                </Button>
              </ButtonGroup>
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
};
