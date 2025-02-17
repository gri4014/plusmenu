import styled from 'styled-components';

interface CardProps {
  padding?: 'sm' | 'md' | 'lg';
  width?: string;
}

export const Card = styled.div<CardProps>`
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: ${({ theme, padding = 'md' }) => {
    switch (padding) {
      case 'sm':
        return theme.spacing.md;
      case 'lg':
        return theme.spacing.xl;
      default:
        return theme.spacing.lg;
    }
  }};
  width: ${({ width = 'auto' }) => width};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  text-align: center;
`;

export const CardTitle = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  margin: 0;
`;

export const CardSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  margin: 0;
`;

export const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const CardFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;
