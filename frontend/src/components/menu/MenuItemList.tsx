import React, { useState } from 'react';
import styled from 'styled-components';
import { MenuItem } from '../../types/menuItem';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { DataType } from '../../types/common';

const ListContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const ItemCard = styled(Card)`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ImageGallery = styled.div`
  position: relative;
  width: 100%;
  height: 200px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  overflow: hidden;
`;

const GalleryImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: opacity 0.3s ease;
`;

const ImageError = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.inputBg};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const GalleryNav = styled.div`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing.sm};
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  z-index: 1;
  background: rgba(0, 0, 0, 0.5);
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

const GalleryDot = styled.button<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ theme, $active }) => 
    $active ? theme.colors.primary : 'rgba(255, 255, 255, 0.5)'};
  border: none;
  padding: 0;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ItemTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  margin: 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ItemPrice = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
`;

const ItemDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  flex-grow: 1;
`;

const ItemCategories = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const CategoryTag = styled.span`
  background-color: ${({ theme }) => theme.colors.inputBg};
  color: ${({ theme }) => theme.colors.text.secondary};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
`;

const ParameterList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ParameterTag = styled.span`
  background-color: ${({ theme }) => theme.colors.primary}10;
  color: ${({ theme }) => theme.colors.text.primary};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSizes.xs};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ParameterValue = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
`;

const ItemActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: auto;
`;

const NoItems = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSizes.md};
`;

interface MenuItemListProps {
  items: MenuItem[];
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
  isLoading: boolean;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onToggleActive: (itemId: string, isActive: boolean) => void;
}

export const MenuItemList: React.FC<MenuItemListProps> = ({
  items,
  categories,
  parameters,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive
}) => {
  const [currentImageIndexes, setCurrentImageIndexes] = useState<Record<string, number>>({});

  const handleImageChange = (itemId: string, index: number) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [itemId]: index
    }));
  };

  if (isLoading) {
    return (
      <ListContainer>
        {[1, 2, 3].map((i) => (
          <ItemCard key={i}>
            <ImageGallery>
              <LoadingSpinner />
            </ImageGallery>
          </ItemCard>
        ))}
      </ListContainer>
    );
  }

  if (items.length === 0) {
    return <NoItems>Позиции в меню не найдены</NoItems>;
  }

  const getCategoryNames = (categoryIds: string[]) => {
    return categoryIds
      .map(id => categories.find(cat => cat.id === id)?.name)
      .filter(Boolean);
  };

  const formatParameterValue = (value: any, type: DataType, param: { min_value?: number; max_value?: number }) => {
    const numericValue = typeof value === 'number' ? value : Number(value);
    
    switch (type) {
      case DataType.BOOLEAN:
        return value ? 'Да' : 'Нет';
      case DataType.INTEGER:
        return !isNaN(numericValue) ? Math.round(numericValue).toString() : '0';
      case DataType.FLOAT:
        return !isNaN(numericValue) ? numericValue.toFixed(2) : '0.00';
      case DataType.SCALE:
        const maxValue = param.max_value ?? 5;
        return !isNaN(numericValue) ? `${Math.round(numericValue)}/${maxValue}` : `0/${maxValue}`;
      default:
        return '';
    }
  };

  return (
    <ListContainer>
      {items.map(item => {
        const images = item.image_urls || [];
        const currentImageIndex = currentImageIndexes[item.id] || 0;
        const currentImage = images[currentImageIndex] || item.image_url;

        return (
          <ItemCard key={item.id}>
            {currentImage && (
              <ImageGallery>
                {currentImage ? (
                  <GalleryImage 
                    src={currentImage} 
                    alt={item.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = ImageError.styledComponentId || '';
                        errorDiv.textContent = 'Не удалось загрузить изображение';
                        parent.appendChild(errorDiv);
                      }
                    }}
                  />
                ) : (
                  <ImageError>Изображение отсутствует</ImageError>
                )}
                {images.length > 1 && (
                  <GalleryNav>
                    {images.map((_, index) => (
                      <GalleryDot
                        key={index}
                        $active={index === currentImageIndex}
                        onClick={() => handleImageChange(item.id, index)}
                      />
                    ))}
                  </GalleryNav>
                )}
              </ImageGallery>
            )}
            <ItemHeader>
              <ItemTitle>{item.name}</ItemTitle>
              <ItemPrice>
                {typeof item.price === 'string' 
                  ? parseFloat(item.price).toFixed(2) 
                  : item.price.toFixed(2)} ₽
              </ItemPrice>
            </ItemHeader>
            <ItemDescription>{item.description}</ItemDescription>
            <ItemCategories>
              {getCategoryNames(item.category_ids).map(name => (
                <CategoryTag key={name}>{name}</CategoryTag>
              ))}
            </ItemCategories>
            {parameters.length > 0 && item.parameters && (
              <ParameterList>
                {parameters
                  .filter(p => p.is_active && [DataType.INTEGER, DataType.FLOAT, DataType.SCALE].includes(p.type))
                  .map(param => {
                    const value = item.parameters?.[param.id];
                    if (value === undefined || value === null) return null;
                    const formattedValue = formatParameterValue(value, param.type, param);
                    if (!formattedValue) return null;
                    return (
                      <ParameterTag key={param.id}>
                        {param.name}:
                        <ParameterValue>
                          {formattedValue}
                        </ParameterValue>
                      </ParameterTag>
                    );
                  })}
              </ParameterList>
            )}
            <ItemActions>
              <Button
                type="button"
                $variant="secondary"
                onClick={() => onEdit(item)}
              >
                Изменить
              </Button>
              <Button
                type="button"
                $variant="danger"
                onClick={() => onDelete(item)}
              >
                Удалить
              </Button>
            </ItemActions>
          </ItemCard>
        );
      })}
    </ListContainer>
  );
};
