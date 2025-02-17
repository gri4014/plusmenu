import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { LoadingButton } from '../common/LoadingButton';
import { restaurantAdminApi } from '../../services/restaurantAdmin';
import { PermissionCheckboxGroup, Permission } from '../common/PermissionCheckboxGroup';

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

const ErrorContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.error + '15'};
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

const ErrorTitle = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  line-height: 1.5;
`;

const ErrorDetails = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.error + '30'};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-word;
`;

const WarningMessage = styled.div`
  color: ${({ theme }) => theme.colors.warning};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.warning + '15'};
  border: 1px solid ${({ theme }) => theme.colors.warning};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const WarningIcon = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
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
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  &::before {
    content: ${({ isMet }) => isMet ? '"✓"' : '"○"'};
    color: ${({ theme, isMet }) => isMet ? theme.colors.success : theme.colors.text.secondary};
  }
`;

const ModalFooter = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
`;

interface ErrorDisplayProps {
  error: string;
  stage?: string;
  details?: any;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, stage, details }) => (
  <ErrorContainer>
    <ErrorTitle>
      <span>⚠️</span>
      <span>Error {stage ? `(${stage})` : ''}</span>
    </ErrorTitle>
    <ErrorMessage>{error}</ErrorMessage>
    {details && (
      <ErrorDetails>
        {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
      </ErrorDetails>
    )}
  </ErrorContainer>
);

interface CreateAdminModalProps {
  restaurantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  login: string;
  password: string;
  permissions: Permission[];
  is_admin: boolean;
  stage?: string;
  details?: any;
}

export const CreateAdminModal: React.FC<CreateAdminModalProps> = ({
  restaurantId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormState>({
    login: '',
    password: '',
    permissions: [],
    is_admin: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManagerWarning, setShowManagerWarning] = useState(false);
  const [wasManager, setWasManager] = useState(false);

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

    if (!formData.login || !formData.password || formData.permissions.length === 0) {
      setError('Please fill in all fields and select at least one permission');
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

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError('Password does not meet requirements');
      return;
    }

    try {
      setLoading(true);
      // Check if all permissions are selected (MENU, ORDER, TABLE, ADMIN, THEME)
      const isManager = formData.permissions.length === 5;
      
      const response = await restaurantAdminApi.create(restaurantId, {
        ...formData,
        is_admin: isManager
      });

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        console.error('[CreateAdminModal] Error response:', response);
        setFormData(prev => ({
          ...prev,
          stage: response.stage,
          details: response.details
        }));
        setError(response.error || 'Failed to create admin account');
      }
    } catch (err) {
      console.error('[CreateAdminModal] Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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

  const handlePermissionChange = (permissions: Permission[]) => {
    const isManager = permissions.length === 5;
    const wasManagerBefore = formData.permissions.length === 5;
    
    // Show warning when removing manager status
    if (wasManagerBefore && !isManager && !showManagerWarning) {
      setShowManagerWarning(true);
      setWasManager(true);
      return;
    }

    setFormData(prev => ({
      ...prev,
      permissions,
      is_admin: isManager
    }));
    setShowManagerWarning(false);
    setWasManager(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Create New Admin</ModalTitle>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              autoComplete="new-password"
            />
          </FormGroup>

          <FormGroup>
            <Label>Permissions</Label>
            <PermissionCheckboxGroup
              selectedPermissions={formData.permissions}
              onChange={handlePermissionChange}
            />
            {showManagerWarning && (
              <WarningMessage>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <WarningIcon>⚠️</WarningIcon>
                  <span>Removing manager status will limit access to certain features. Are you sure?</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <Button
                    $variant="danger"
                    onClick={() => {
                      setShowManagerWarning(false);
                      setWasManager(false);
                    }}
                  >
                    Yes, limit access
                  </Button>
                  <Button
                    $variant="primary"
                    onClick={() => {
                      setShowManagerWarning(false);
                      setFormData(prev => ({
                        ...prev,
                        permissions: ['MENU', 'ORDER', 'TABLE', 'ADMIN', 'THEME'],
                        is_admin: true
                      }));
                    }}
                  >
                    Keep manager status
                  </Button>
                </div>
              </WarningMessage>
            )}
          </FormGroup>

          <FormGroup>
            <Label>Password Requirements:</Label>
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
          </FormGroup>

          {error && (
            <ErrorDisplay
              error={error}
              stage={formData.stage}
              details={formData.details}
            />
          )}
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
          disabled={showManagerWarning}
        >
          Create Admin
        </LoadingButton>
      </ModalFooter>
    </Modal>
  );
};
