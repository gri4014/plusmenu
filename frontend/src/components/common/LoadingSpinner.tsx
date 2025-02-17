import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const SpinnerContainer = styled.div<SpinnerProps>`
  display: inline-block;
  width: ${({ size = 'md' }) => {
    switch (size) {
      case 'sm':
        return '16px';
      case 'lg':
        return '48px';
      default:
        return '32px';
    }
  }};
  height: ${({ size = 'md' }) => {
    switch (size) {
      case 'sm':
        return '16px';
      case 'lg':
        return '48px';
      default:
        return '32px';
    }
  }};
`;

const SpinnerCircle = styled.div<SpinnerProps>`
  width: 100%;
  height: 100%;
  border: ${({ size = 'md' }) => {
    switch (size) {
      case 'sm':
        return '2px';
      case 'lg':
        return '6px';
      default:
        return '4px';
    }
  }} solid ${({ theme }) => theme.colors.background};
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.div`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
`;

export const LoadingSpinner: React.FC<SpinnerProps> = ({ size, className, text }) => (
  <LoadingContainer>
    <SpinnerContainer size={size} className={className}>
      <SpinnerCircle size={size} />
    </SpinnerContainer>
    {text && <LoadingText>{text}</LoadingText>}
  </LoadingContainer>
);

export default LoadingSpinner;
