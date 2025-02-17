import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { MenuItem, CreateMenuItemData, UpdateMenuItemData } from '../../types/menuItem';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Label } from '../common/Label';
import { DataType } from '../../types/common';
import { ParameterListItem } from './ParameterListItem';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ImagePreviewContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const ImagePreview = styled.div<{ $active?: boolean }>`
  position: relative;
  width: 100px;
  height: 100px;
  cursor: pointer;
  border: 2px solid ${({ theme, $active }) => 
    $active ? theme.colors.primary : 'transparent'};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: border-color 0.3s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const DeleteImageButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.error};
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  z-index: 1;

  &:hover {
    opacity: 0.9;
  }
`;

const CategorySelect = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.background};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
`;

const ParametersSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Checkbox = styled.input`
  margin: 0;
  cursor: pointer;
`;

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMenuItemData | UpdateMenuItemData, images: File[]) => Promise<void>;
  item?: MenuItem;
  title: string;
  categories: Array<{ id: string; name: string }>;
  parameters: Array<{
    id: string;
    name: string;
    type: DataType;
    min_value?: number;
    max_value?: number;
    required?: boolean;
    is_active: boolean;
  }>;
  isSubmitting: boolean;
  restaurantId: string;
}

export const MenuItemModal: React.FC<MenuItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
  title,
  categories,
  parameters,
  isSubmitting,
  restaurantId
}) => {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price ? parseFloat(String(item.price)).toFixed(2) : '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    item?.category_ids || []
  );
  const [parameterValues, setParameterValues] = useState<Record<string, any>>(
    item?.parameters || {}
  );
  const [selectedParameters, setSelectedParameters] = useState<Set<string>>(
    new Set(item ? Object.keys(item.parameters || {}) : [])
  );
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (item) {
      const urls = item.image_urls || (item.image_url ? [item.image_url] : []);
      setPreviewUrls(urls);
    }
  }, [item]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + previewUrls.length > 8) {
      alert('Максимум 8 изображений');
      return;
    }

    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setImages(prev => [...prev, ...files]);
  }, [previewUrls.length]);

  const handleDeleteImage = useCallback((index: number) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setImages(prev => prev.filter((_, i) => i !== index));
    if (currentImageIndex >= index && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  }, [currentImageIndex]);

  const handleImageSelect = useCallback((index: number) => {
    setCurrentImageIndex(index);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategories.length) {
      alert('Выберите хотя бы одну категорию');
      return;
    }
    if (!name.trim()) {
      alert('Название обязательно');
      return;
    }
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      alert('Введите корректную цену больше 0');
      return;
    }

    // Format data - only include selected parameter values
    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      price: priceValue,
      category_ids: selectedCategories,
      parameters: Object.fromEntries(
        Object.entries(parameterValues)
          .filter(([key]) => selectedParameters.has(key))
          .map(([key, value]) => {
            const parameter = parameters.find(p => p.id === key);
            if (!parameter) return [key, value];

            // Convert values based on parameter type
            switch (parameter.type) {
              case DataType.INTEGER:
                return [key, parseInt(String(value)) || 0];
              case DataType.FLOAT:
                return [key, parseFloat(String(value)) || 0];
              case DataType.SCALE:
                return [key, parseInt(String(value)) || 0];
              case DataType.BOOLEAN:
                return [key, Boolean(value)];
              default:
                return [key, value];
            }
          })
      ),
      is_active: isActive,
      restaurant_id: restaurantId
    };

    try {
      await onSubmit(data, images);
    } catch (error) {
      alert('Не удалось сохранить позицию меню: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 style={{ marginBottom: '1rem' }}>{title}</h2>
      <Form onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="name">Название</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Описание</Label>
          <Input
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="price">Цена</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={e => {
              const value = e.target.value;
              // Only allow numbers and up to 2 decimal places
              if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                if (value === '') {
                  setPrice('');
                } else {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    setPrice(numValue.toFixed(2));
                  }
                }
              }
            }}
            required
          />
        </div>

        <div>
          <Label htmlFor="categories">Категории</Label>
          <CategorySelect
            id="categories"
            multiple
            value={selectedCategories}
            onChange={e => {
              const options = Array.from(e.target.selectedOptions);
              setSelectedCategories(options.map(option => option.value));
            }}
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </CategorySelect>
        </div>

        <div>
          <Label>Изображения (максимум 8)</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={previewUrls.length >= 8}
          />
          <ImagePreviewContainer>
            {previewUrls.map((url, index) => (
              <ImagePreview 
                key={url} 
                onClick={() => handleImageSelect(index)}
                $active={index === currentImageIndex}
              >
                <PreviewImage src={url} alt={`Предпросмотр ${index + 1}`} />
                <DeleteImageButton
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteImage(index);
                  }}
                >
                  ×
                </DeleteImageButton>
              </ImagePreview>
            ))}
          </ImagePreviewContainer>
        </div>

        {parameters.length > 0 && (() => {
          const activeParameters = parameters.filter(p => p.is_active === true);
          return activeParameters.length > 0 ? (
            <ParametersSection>
              <h3>ПАРАМЕТРЫ</h3>
              {activeParameters.map(parameter => (
                <ParameterListItem
                  key={parameter.id}
                  id={parameter.id}
                  name={parameter.name}
                  type={parameter.type}
                  value={parameterValues[parameter.id]}
                  min_value={parameter.min_value}
                  max_value={parameter.max_value}
                  isSelected={selectedParameters.has(parameter.id)}
                  onToggle={(id) => {
                    setSelectedParameters(prev => {
                      const next = new Set(prev);
                      if (next.has(id)) {
                        next.delete(id);
                        // Also remove the value when unselecting
                        const newValues = { ...parameterValues };
                        delete newValues[id];
                        setParameterValues(newValues);
                      } else {
                        next.add(id);
                      }
                      return next;
                    });
                  }}
                  onChange={(id, value, type) => {
                    setParameterValues(prev => ({
                      ...prev,
                      [id]: value
                    }));
                  }}
                />
              ))}
            </ParametersSection>
          ) : null;
        })()}

        <CheckboxContainer>
          <Checkbox
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
          />
          <Label htmlFor="isActive">Активно</Label>
        </CheckboxContainer>

        <Button type="submit" $variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </Form>
    </Modal>
  );
};
