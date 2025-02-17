import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { useRestaurantAuth } from '@/contexts/RestaurantAuthContext';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.inputBg};
`;

const StyledCard = styled(Card)`
  max-width: 400px;
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const StyledForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const StyledCardHeader = styled(CardHeader)`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const StyledCardTitle = styled(CardTitle)`
  font-size: 1.75rem;
  letter-spacing: -0.5px;
`;

const CheckboxContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const ErrorContainer = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  text-align: center;
  min-height: 20px;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const RestaurantLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useRestaurantAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    rememberMe: false,
  });

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'login':
        if (!value) return 'Login is required';
        if (value.length < 3) return 'Login must be at least 3 characters';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (type !== 'checkbox') {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error,
        submit: '', // Clear submit error when user types
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(key => {
      if (key !== 'rememberMe') {
        const error = validateField(key, formData[key as keyof typeof formData] as string);
        if (error) newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await login(formData.login, formData.password, formData.rememberMe);
      navigate('/restaurant/dashboard');
    } catch (err) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('401')) {
          errorMessage = 'Invalid credentials. Please check your login and password.';
        } else if (err.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection.';
        }
      }
      
      setErrors(prev => ({
        ...prev,
        submit: errorMessage,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <StyledCard>
        <StyledCardHeader>
          <StyledCardTitle>Restaurant Login</StyledCardTitle>
        </StyledCardHeader>
        <CardContent>
          <StyledForm onSubmit={handleSubmit}>
            <Input
              label="Login"
              type="text"
              name="login"
              value={formData.login}
              onChange={handleChange}
              placeholder="Enter your login"
              autoComplete="username"
              required
              inputSize="lg"
              error={errors.login}
              aria-invalid={!!errors.login}
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              inputSize="lg"
              error={errors.password}
              aria-invalid={!!errors.password}
            />
            <CheckboxContainer>
              <Checkbox
                label="Remember me"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
            </CheckboxContainer>
            <ErrorContainer>
              {errors.submit}
            </ErrorContainer>
            <Button 
              type="submit" 
              $fullWidth 
              disabled={isLoading}
              $size="lg"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </StyledForm>
        </CardContent>
      </StyledCard>
    </LoginContainer>
  );
};

export default RestaurantLoginPage;
