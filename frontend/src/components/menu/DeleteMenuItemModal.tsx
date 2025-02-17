import React from 'react';
import styled from 'styled-components';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

const ButtonContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const Message = styled.p`
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.md};
`;

interface DeleteMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isSubmitting: boolean;
}

export const DeleteMenuItemModal: React.FC<DeleteMenuItemModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isSubmitting
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Удаление позиции из меню</h2>
      <Message>
        Вы уверены, что хотите удалить "{itemName}"? Это действие нельзя отменить.
      </Message>
      <ButtonContainer>
        <Button
          type="button"
          $variant="secondary"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Отмена
        </Button>
        <Button
          type="button"
          $variant="danger"
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Удаление...' : 'Удалить'}
        </Button>
      </ButtonContainer>
    </Modal>
  );
};
