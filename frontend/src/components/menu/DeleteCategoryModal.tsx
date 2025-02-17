import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { LoadingButton } from '../common/LoadingButton';

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

const Message = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`;

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  categoryName: string;
  isSubmitting?: boolean;
}

export const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  isSubmitting = false
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось удалить категорию');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Удаление категории</ModalTitle>
        </ModalHeader>
        <Message>
          Вы уверены, что хотите удалить категорию "{categoryName}"? Это действие нельзя отменить.
        </Message>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <ButtonGroup>
          <Button type="button" $variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button 
            type="button" 
            $variant="danger" 
            disabled={isSubmitting} 
            onClick={handleConfirm}
          >
            {isSubmitting ? 'Удаление...' : 'Удалить'}
          </Button>
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
};
