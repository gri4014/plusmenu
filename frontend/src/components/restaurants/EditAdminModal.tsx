import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { LoadingButton } from '../common/LoadingButton';
import { restaurantAdminApi, IRestaurantAdmin } from '../../services/restaurantAdmin';

const ModalHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
`;

const ModalContent = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
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

const Label = styled.label`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const ModalFooter = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const PasswordNote = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const PasswordRequirements = styled.ul`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
  padding-left: ${({ theme }) => theme.spacing.lg};
`;

const RequirementItem = styled.li<{ isMet: boolean }>`
  color: ${({ theme, isMet }) => isMet ? theme.colors.success : theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

interface EditAdminModalProps {
  restaurantId: string;
  admin: IRestaurantAdmin;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditAdminModal: React.FC<EditAdminModalProps> = ({
  restaurantId,
  admin,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    login: admin.login,
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);

    return {
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      isValid: hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.login) {
      setError('Login is required');
      return;
    }

    // Validate login
    if (formData.login.length < 3) {
      setError('Login must be at least 3 characters long');
      return;
    }
    if (formData.login.length > 50) {
      setError('Login cannot exceed 50 characters');
      return;
    }
    if (!formData.login.match(/^[a-zA-Z0-9_]+$/)) {
      setError('Login must contain only letters, numbers, and underscores (no special characters or spaces)');
      return;
    }

    // Validate password if provided
    if (formData.password && !validatePassword(formData.password).isValid) {
      setError('Password does not meet requirements');
      return;
    }

    const updateData = {
      login: formData.login,
      ...(formData.password ? { password: formData.password } : {})
    };

    try {
      setLoading(true);
      const response = await restaurantAdminApi.update(restaurantId, admin.id, updateData);
      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError('Failed to update admin account');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Edit Admin</ModalTitle>
      </ModalHeader>

      <ModalContent>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="login">Login</Label>
            <Input
              id="login"
              name="login"
              value={formData.login}
              onChange={handleChange}
              placeholder="Enter login"
              autoComplete="off"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">New Password (optional)</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password"
              autoComplete="new-password"
            />
            <PasswordNote>
              Leave blank to keep current password
            </PasswordNote>
            {formData.password && (
              <PasswordRequirements>
                <RequirementItem isMet={validatePassword(formData.password).hasMinLength}>
                  At least 8 characters
                </RequirementItem>
                <RequirementItem isMet={validatePassword(formData.password).hasUppercase}>
                  At least one uppercase letter
                </RequirementItem>
                <RequirementItem isMet={validatePassword(formData.password).hasLowercase}>
                  At least one lowercase letter
                </RequirementItem>
                <RequirementItem isMet={validatePassword(formData.password).hasNumber}>
                  At least one number
                </RequirementItem>
                <RequirementItem isMet={validatePassword(formData.password).hasSpecial}>
                  At least one special character (@$!%*?&)
                </RequirementItem>
              </PasswordRequirements>
            )}
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Form>
      </ModalContent>

      <ModalFooter>
        <Button $variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <LoadingButton
          loading={loading}
          onClick={handleSubmit}
          $variant="primary"
        >
          Save Changes
        </LoadingButton>
      </ModalFooter>
    </Modal>
  );
};
