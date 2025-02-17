import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Label } from '../common/Label';
import { Button } from '../common/Button';
import { LoadingButton } from '../common/LoadingButton';
import { Checkbox } from '../common/Checkbox';
import { DataType, DATA_TYPE_LABELS } from '../../types/parameters';
import { Parameter, CreateParameterPayload } from '../../types/parameters';

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ theme }) => theme.colors.inputBg};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateParameterPayload) => Promise<void>;
  parameter?: Parameter;
  title: string;
}

export const ParameterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  parameter,
  title
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [dataType, setDataType] = useState<DataType>(DataType.TEXT);
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<{
    name?: string;
    dataType?: string;
    minValue?: string;
    maxValue?: string;
    general?: string;
  }>({});

  useEffect(() => {
    if (parameter) {
      setName(parameter.name);
      setDataType(parameter.data_type);
      setMinValue(parameter.min_value?.toString() ?? '');
      setMaxValue(parameter.max_value?.toString() ?? '');
      setIsActive(parameter.is_active);
    }
  }, [parameter]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Parameter name is required';
    }

    if (isNumericType) {
      if (minValue && maxValue) {
        const min = Number(minValue);
        const max = Number(maxValue);
        if (min >= max) {
          newErrors.minValue = 'Minimum value must be less than maximum value';
          newErrors.maxValue = 'Maximum value must be greater than minimum value';
        }
      }

      if (dataType === DataType.INTEGER) {
        if (minValue && !Number.isInteger(Number(minValue))) {
          newErrors.minValue = 'Minimum value must be an integer';
        }
        if (maxValue && !Number.isInteger(Number(maxValue))) {
          newErrors.maxValue = 'Maximum value must be an integer';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload: CreateParameterPayload = {
        name,
        data_type: dataType,
        is_active: isActive
      };

      if (dataType === DataType.INTEGER || dataType === DataType.FLOAT || dataType === DataType.SCALE) {
        if (minValue) payload.min_value = Number(minValue);
        if (maxValue) payload.max_value = Number(maxValue);
      }

      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error('Failed to submit parameter:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to submit parameter. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isNumericType = dataType === DataType.INTEGER || dataType === DataType.FLOAT || dataType === DataType.SCALE;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Title>{title}</Title>
      <Form onSubmit={handleSubmit}>
        {errors.general && <ErrorMessage>{errors.general}</ErrorMessage>}
        
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
        </div>

        <div>
          <Label htmlFor="dataType">Type</Label>
          <Select
            id="dataType"
            value={dataType}
            onChange={(e) => setDataType(e.target.value as DataType)}
          >
            {Object.entries(DATA_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          {errors.dataType && <ErrorMessage>{errors.dataType}</ErrorMessage>}
        </div>

        {isNumericType && (
          <>
            <div>
              <Label htmlFor="minValue">Minimum Value</Label>
              <Input
                id="minValue"
                type="number"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
              />
              {errors.minValue && <ErrorMessage>{errors.minValue}</ErrorMessage>}
            </div>

            <div>
              <Label htmlFor="maxValue">Maximum Value</Label>
              <Input
                id="maxValue"
                type="number"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
              />
              {errors.maxValue && <ErrorMessage>{errors.maxValue}</ErrorMessage>}
            </div>
          </>
        )}

        <div>
          <Label htmlFor="isActive">Status</Label>
          <Checkbox
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            label={isActive ? "Active" : "Inactive"}
          />
        </div>

        <ButtonGroup>
          <Button type="button" $variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton type="submit" loading={isLoading}>
            {parameter ? 'Update' : 'Create'}
          </LoadingButton>
        </ButtonGroup>
      </Form>
    </Modal>
  );
};
