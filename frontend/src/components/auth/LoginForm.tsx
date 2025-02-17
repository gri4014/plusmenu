import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';
import { useAuth } from '@/contexts/AuthContext';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.inputBg};
`;

const StyledCard = styled(Card)`
  animation: ${fadeIn} 0.6s ease-out;
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

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
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
        if (!value) return 'Введите логин';
        if (value.length < 3) return 'Логин должен содержать не менее 3 символов';
        return '';
      case 'password':
        if (!value) return 'Введите пароль';
        if (value.length < 8) return 'Пароль должен содержать не менее 8 символов';
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
      navigate('/dashboard');
    } catch (err) {
      let errorMessage = 'Произошла неожиданная ошибка. Пожалуйста, попробуйте снова.';
      
      if (err instanceof Error) {
        if (err.message.includes('401')) {
          errorMessage = 'Неверные учетные данные. Проверьте логин и пароль.';
        } else if (err.message.includes('Network')) {
          errorMessage = 'Ошибка сети. Проверьте подключение к интернету.';
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
          <StyledCardTitle>ПлюсМеню</StyledCardTitle>
        </StyledCardHeader>
        <CardContent>
          <StyledForm onSubmit={handleSubmit}>
            <Input
              label="Логин"
              type="text"
              name="login"
              value={formData.login}
              onChange={handleChange}
              placeholder="Введите логин"
              autoComplete="username"
              required
              inputSize="lg"
              error={errors.login}
              aria-invalid={!!errors.login}
            />
            <Input
              label="Пароль"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Введите пароль"
              autoComplete="current-password"
              required
              inputSize="lg"
              error={errors.password}
              aria-invalid={!!errors.password}
            />
            <CheckboxContainer>
              <Checkbox
                label="Запомнить меня"
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
              {isLoading ? 'Выполняется вход...' : 'Войти'}
            </Button>
          </StyledForm>
        </CardContent>
      </StyledCard>
    </LoginContainer>
  );
};

export default LoginForm;
