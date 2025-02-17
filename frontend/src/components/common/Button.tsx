import styled from 'styled-components';

interface ButtonProps {
  $variant?: 'primary' | 'secondary' | 'danger' | 'warning';
  $fullWidth?: boolean;
  $size?: 'sm' | 'md' | 'lg';
}

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ $size = 'md', theme }) => {
    switch ($size) {
      case 'sm':
        return `${theme.spacing.xs} ${theme.spacing.sm}`;
      case 'lg':
        return `${theme.spacing.md} ${theme.spacing.lg}`;
      default:
        return `${theme.spacing.sm} ${theme.spacing.md}`;
    }
  }};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};
  font-weight: ${({ theme }) => theme.typography.fontWeights.medium};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all ${({ theme }) => theme.transitions.default};
  
  ${({ $variant = 'primary', theme }) => {
    switch ($variant) {
      case 'primary':
        return `
          background-color: ${theme.colors.primary};
          color: ${theme.colors.background};

          &:hover:not(:disabled) {
            opacity: 0.9;
          }

          &:active:not(:disabled) {
            transform: scale(0.98);
          }
        `;
      case 'danger':
        return `
          background-color: ${theme.colors.error};
          color: ${theme.colors.background};

          &:hover:not(:disabled) {
            opacity: 0.9;
          }

          &:active:not(:disabled) {
            transform: scale(0.98);
          }
        `;
      case 'warning':
        return `
          background-color: ${theme.colors.warning};
          color: ${theme.colors.text.primary};

          &:hover:not(:disabled) {
            opacity: 0.9;
          }

          &:active:not(:disabled) {
            transform: scale(0.98);
          }
        `;
      default:
        return `
          background-color: transparent;
          color: ${theme.colors.primary};
          border: 1px solid ${theme.colors.border};

          &:hover:not(:disabled) {
            background-color: ${theme.colors.inputBg};
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.background},
                0 0 0 4px ${({ theme }) => theme.colors.primary}40;
  }
`;
