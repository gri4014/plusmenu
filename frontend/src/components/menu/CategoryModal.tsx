import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Label } from '../common/Label';
import { Button } from '../common/Button';
import { LoadingButton } from '../common/LoadingButton';
import { Checkbox } from '../common/Checkbox';
import { Category } from '../../types/category';

const ModalContent = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
`;

const ModalHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const ModalTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
`;

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; is_active: boolean }) => Promise<void>;
  category?: Category;
  title: string;
  isSubmitting?: boolean;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  category,
  title,
  isSubmitting = false
}) => {
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIsActive(category.is_active);
    } else {
      setName('');
      setIsActive(true);
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await onSubmit({ name, is_active: isActive });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              required
            />
          </FormGroup>

          <FormGroup>
            <Checkbox
              id="isActive"
              label="Активная"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <ButtonGroup>
            <Button type="button" $variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <LoadingButton type="submit" loading={isSubmitting}>
              {category ? 'Обновить' : 'Создать'}
            </LoadingButton>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </Modal>
  );
};
