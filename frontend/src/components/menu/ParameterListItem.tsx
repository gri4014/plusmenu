import React from 'react';
import styled from 'styled-components';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { DataType } from '../../types/common';

const ListItem = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.sm} 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ParameterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ParameterName = styled.span`
  font-weight: 500;
`;

const ParameterType = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
`;

const ToggleButton = styled(Button)`
  min-width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ParameterField = styled.div<{ $isVisible: boolean }>`
  max-height: ${({ $isVisible }) => ($isVisible ? '500px' : '0')};
  opacity: ${({ $isVisible }) => ($isVisible ? '1' : '0')};
  overflow: hidden;
  transition: all 0.3s ease;
  margin-top: ${({ $isVisible, theme }) => ($isVisible ? theme.spacing.sm : '0')};
`;

const ScaleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ScaleValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
`;

const ValidationMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

interface ParameterListItemProps {
  id: string;
  name: string;
  type: DataType;
  value: any;
  min_value?: number;
  max_value?: number;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onChange: (id: string, value: any, type: DataType) => void;
}

export const ParameterListItem: React.FC<ParameterListItemProps> = ({
  id,
  name,
  type,
  value,
  min_value,
  max_value,
  isSelected,
  onToggle,
  onChange,
}) => {
  const handleChange = (newValue: any) => {
    onChange(id, newValue, type);
  };

  const renderField = () => {
    switch (type) {
      case DataType.BOOLEAN:
        return (
          <Input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleChange(e.target.checked)}
          />
        );

      case DataType.INTEGER:
      case DataType.FLOAT:
        return (
          <>
            <Input
              type="number"
              value={value ?? ''}
              min={min_value}
              max={max_value}
              step={type === DataType.FLOAT ? 0.01 : 1}
              onChange={(e) => handleChange(type === DataType.FLOAT ? parseFloat(e.target.value) : parseInt(e.target.value))}
            />
            {(min_value !== undefined || max_value !== undefined) && (
              <ScaleValue>
                Диапазон: {min_value ?? '-∞'} до {max_value ?? '∞'}
              </ScaleValue>
            )}
          </>
        );

      case DataType.SCALE:
        const scaleMin = min_value ?? 0;
        const scaleMax = max_value ?? 100;
        return (
          <ScaleContainer>
            <ScaleValue>Текущее значение: {value ?? scaleMin}</ScaleValue>
            <Input
              type="range"
              value={value ?? scaleMin}
              min={scaleMin}
              max={scaleMax}
              onChange={(e) => handleChange(parseInt(e.target.value))}
            />
            <ScaleValue>от {scaleMin} до {scaleMax}</ScaleValue>
          </ScaleContainer>
        );

      case DataType.TEXT:
      default:
        return (
          <Input
            type="text"
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        );
    }
  };

  return (
    <ListItem>
      <Header>
        <ParameterInfo>
          <ParameterName>{name}</ParameterName>
          <ParameterType>({type.toLowerCase()})</ParameterType>
        </ParameterInfo>
        <ToggleButton
          type="button"
          onClick={() => onToggle(id)}
          $variant={isSelected ? 'danger' : 'primary'}
        >
          {isSelected ? '−' : '+'}
        </ToggleButton>
      </Header>
      <ParameterField $isVisible={isSelected}>
        {renderField()}
      </ParameterField>
    </ListItem>
  );
};
