import React, { useState, useEffect } from 'react';
import { useRestaurantAuth } from '../../contexts/RestaurantAuthContext';
import { PageContainer } from '../../components/common/PageContainer';
import { Button } from '../../components/common/Button';
import { CategoryList } from '../../components/menu/CategoryList';
import { CategoryModal } from '../../components/menu/CategoryModal';
import { DeleteCategoryModal } from '../../components/menu/DeleteCategoryModal';
import { DeleteMenuItemModal } from '../../components/menu/DeleteMenuItemModal';
import { MenuItemList } from '../../components/menu/MenuItemList';
import { MenuItemModal } from '../../components/menu/MenuItemModal';
import { categoryService } from '../../services/categories';
import menuItemService from '../../services/menuItems';
import { restaurantParametersService } from '../../services/parameters';
import { Category } from '../../types/category';
import { DataType } from '../../types/common';
import { Parameter } from '../../types/parameters';
import { MenuItem, CreateMenuItemData, UpdateMenuItemData } from '../../types/menuItem';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import styled from 'styled-components';

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSizes.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const MenuManagementContent: React.FC = () => {
  const { admin } = useRestaurantAuth();
  
  // Category state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Menu item state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | undefined>();
  const [isMenuItemModalOpen, setIsMenuItemModalOpen] = useState(false);
  const [isDeleteMenuItemModalOpen, setIsDeleteMenuItemModalOpen] = useState(false);
  const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItem | null>(null);
  const [isMenuItemLoading, setIsMenuItemLoading] = useState(true);
  const [isMenuItemSubmitting, setIsMenuItemSubmitting] = useState(false);
  const [menuItemError, setMenuItemError] = useState<string | null>(null);
  const [parameters, setParameters] = useState<Array<{
    id: string;
    name: string;
    type: DataType;
    min_value?: number;
    max_value?: number;
    required?: boolean;
    is_active: boolean;
  }>>([]);

  // Fetch data
  const fetchData = async () => {
    if (!admin?.restaurantId) return;

    try {
      // Fetch categories
      setCategoryError(null);
      const categoriesData = await categoryService.getCategories();
      if (!categoriesData.success) {
        throw new Error(categoriesData.error || 'Не удалось загрузить категории');
      }
      setCategories(categoriesData.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategoryError(error instanceof Error ? error.message : 'Не удалось загрузить категории');
    } finally {
      setIsCategoryLoading(false);
    }

    try {
      // Fetch menu items (include both active and inactive)
      setMenuItemError(null);
      const menuItemsData = await menuItemService.getMenuItems({ is_active: undefined });
      if (!menuItemsData.success) {
        throw new Error(menuItemsData.error || 'Не удалось загрузить позиции меню');
      }
      setMenuItems(menuItemsData.data || []);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      setMenuItemError(error instanceof Error ? error.message : 'Не удалось загрузить позиции меню');
    } finally {
      setIsMenuItemLoading(false);
    }

    try {
      // Fetch parameters
      const parametersData = await restaurantParametersService.getParameters();
      if (!parametersData.success) {
        throw new Error(parametersData.error || 'Не удалось загрузить параметры');
      }
      console.log('Raw parameters from API:', parametersData.data);
      const mappedParameters = (parametersData.data || []).map((p: Parameter) => ({
        id: p.id,
        name: p.name,
        type: p.data_type,
        min_value: p.min_value || undefined,
        max_value: p.max_value || undefined,
        required: false, // All parameters are optional
        is_active: p.is_active
      }));
      console.log('Mapped parameters:', mappedParameters);
      setParameters(mappedParameters);
    } catch (error) {
      console.error('Failed to fetch parameters:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [admin?.restaurantId]);

  // Category handlers
  const handleCreateCategory = async (data: { name: string; is_active: boolean }) => {
    if (!admin?.restaurantId) return;
    
    try {
      setCategoryError(null);
      setIsCategorySubmitting(true);
      const result = await categoryService.createCategory(admin.restaurantId, data);
      if (!result.success) {
        throw new Error(result.error || 'Не удалось создать категорию');
      }
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create category:', error);
      setCategoryError(error instanceof Error ? error.message : 'Не удалось создать категорию');
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleUpdateCategory = async (data: { name: string; is_active: boolean }) => {
    if (!selectedCategory || !admin?.restaurantId) return;
    
    try {
      setCategoryError(null);
      setIsCategorySubmitting(true);
      const result = await categoryService.updateCategory(admin.restaurantId, selectedCategory.id, data);
      if (!result.success) {
        throw new Error(result.error || 'Не удалось обновить категорию');
      }
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update category:', error);
      setCategoryError(error instanceof Error ? error.message : 'Не удалось обновить категорию');
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      setCategoryError(null);
      setIsCategorySubmitting(true);
      const result = await categoryService.deleteCategory(categoryToDelete.id);
      if (!result.success) {
        throw new Error(result.error || 'Не удалось удалить категорию');
      }
      setIsDeleteCategoryModalOpen(false);
      setCategoryToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      setCategoryError(error instanceof Error ? error.message : 'Не удалось удалить категорию');
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  // Menu item handlers
  const handleCreateMenuItem = async (data: CreateMenuItemData, images: File[]) => {
    if (!admin?.restaurantId) return;

    try {
      setMenuItemError(null);
      setIsMenuItemSubmitting(true);
      const menuItemData = {
        ...data,
        restaurant_id: admin.restaurantId
      };
      await menuItemService.createMenuItem(menuItemData, images);
      setIsMenuItemModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create menu item:', error);
      setMenuItemError(error instanceof Error ? error.message : 'Не удалось создать позицию меню');
    } finally {
      setIsMenuItemSubmitting(false);
    }
  };

  const handleUpdateMenuItem = async (data: UpdateMenuItemData, images: File[]) => {
    if (!selectedMenuItem || !admin?.restaurantId) return;

    try {
      setMenuItemError(null);
      setIsMenuItemSubmitting(true);
      const menuItemData = {
        ...data,
        restaurant_id: admin.restaurantId
      };
      await menuItemService.updateMenuItem(selectedMenuItem.id, menuItemData, images);
      setIsMenuItemModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update menu item:', error);
      setMenuItemError(error instanceof Error ? error.message : 'Не удалось обновить позицию меню');
    } finally {
      setIsMenuItemSubmitting(false);
    }
  };

  const handleDeleteMenuItem = async () => {
    if (!menuItemToDelete) return;
    
    try {
      setMenuItemError(null);
      setIsMenuItemSubmitting(true);
      const result = await menuItemService.deleteMenuItem(menuItemToDelete.id);
      if (!result.success) {
        throw new Error(result.error || 'Не удалось удалить позицию меню');
      }
      setIsDeleteMenuItemModalOpen(false);
      setMenuItemToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      setMenuItemError(error instanceof Error ? error.message : 'Не удалось удалить позицию меню');
    } finally {
      setIsMenuItemSubmitting(false);
    }
  };

  const handleToggleMenuItem = async (itemId: string, isActive: boolean) => {
    if (!admin?.restaurantId) return;

    try {
      setMenuItemError(null);
      // Optimistically update the UI
      setMenuItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId 
            ? { ...item, is_active: isActive }
            : item
        )
      );

      const result = await menuItemService.updateMenuItem(
        itemId, 
        { 
          is_active: isActive,
          restaurant_id: admin.restaurantId 
        }, 
        []
      );

      if (!result.success) {
        // Revert the optimistic update if the API call fails
        setMenuItems(prevItems => 
          prevItems.map(item => 
            item.id === itemId 
              ? { ...item, is_active: !isActive }
              : item
          )
        );
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Failed to update menu item status:', error);
      setMenuItemError(error instanceof Error ? error.message : 'Не удалось обновить статус позиции меню');
    }
  };

  return (
    <ErrorBoundary>
      <PageContainer>
        <Section>
          <SectionHeader>
            <SectionTitle>Категории меню</SectionTitle>
            <Button 
              type="button" 
              onClick={() => {
                setSelectedCategory(undefined);
                setIsCategoryModalOpen(true);
              }}
            >
              Добавить категорию
            </Button>
          </SectionHeader>

          {categoryError && <ErrorMessage>{categoryError}</ErrorMessage>}

          <CategoryList
            categories={categories}
            onEdit={category => {
              setSelectedCategory(category);
              setIsCategoryModalOpen(true);
            }}
            onDelete={category => {
              setCategoryToDelete(category);
              setIsDeleteCategoryModalOpen(true);
            }}
            onToggleActive={async (categoryId, isActive) => {
              if (!admin?.restaurantId) return;
              try {
                setCategoryError(null);
                const result = await categoryService.updateCategory(admin.restaurantId, categoryId, { is_active: isActive });
                if (!result.success) {
                  throw new Error(result.error || 'Не удалось обновить статус категории');
                }
                fetchData();
              } catch (error) {
                console.error('Failed to update category status:', error);
                setCategoryError(error instanceof Error ? error.message : 'Не удалось обновить статус категории');
              }
            }}
            onUpdateOrder={async (categoryId, order) => {
              if (!admin?.restaurantId) return;
              try {
                setCategoryError(null);
                const result = await categoryService.updateCategory(admin.restaurantId, categoryId, { display_order: order });
                if (!result.success) {
                  throw new Error(result.error || 'Не удалось обновить порядок категории');
                }
                fetchData();
              } catch (error) {
                console.error('Failed to update category order:', error);
                setCategoryError(error instanceof Error ? error.message : 'Не удалось обновить порядок категории');
              }
            }}
            isLoading={isCategoryLoading}
          />

          <CategoryModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            onSubmit={selectedCategory ? handleUpdateCategory : handleCreateCategory}
            category={selectedCategory}
            title={selectedCategory ? 'Редактировать категорию' : 'Добавить категорию'}
            isSubmitting={isCategorySubmitting}
          />

          <DeleteCategoryModal
            isOpen={isDeleteCategoryModalOpen}
            onClose={() => {
              setIsDeleteCategoryModalOpen(false);
              setCategoryToDelete(null);
            }}
            onConfirm={handleDeleteCategory}
            categoryName={categoryToDelete?.name || ''}
            isSubmitting={isCategorySubmitting}
          />
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>Позиции меню</SectionTitle>
            <Button 
              type="button" 
              onClick={() => {
                setSelectedMenuItem(undefined);
                setIsMenuItemModalOpen(true);
              }}
            >
              Добавить позицию
            </Button>
          </SectionHeader>

          {menuItemError && <ErrorMessage>{menuItemError}</ErrorMessage>}

          <MenuItemList
            items={menuItems}
            categories={categories}
            parameters={parameters}
            isLoading={isMenuItemLoading}
            onEdit={item => {
              setSelectedMenuItem(item);
              setIsMenuItemModalOpen(true);
            }}
            onDelete={item => {
              setMenuItemToDelete(item);
              setIsDeleteMenuItemModalOpen(true);
            }}
            onToggleActive={handleToggleMenuItem}
          />

          <MenuItemModal
            isOpen={isMenuItemModalOpen}
            onClose={() => setIsMenuItemModalOpen(false)}
            onSubmit={(data, images) => {
              if (selectedMenuItem) {
                return handleUpdateMenuItem(data, images);
              } else {
                return handleCreateMenuItem(data as CreateMenuItemData, images);
              }
            }}
            item={selectedMenuItem}
            title={selectedMenuItem ? 'Редактировать позицию' : 'Добавить позицию'}
            categories={categories}
            parameters={parameters}
            isSubmitting={isMenuItemSubmitting}
            restaurantId={admin?.restaurantId || ''}
          />

          <DeleteMenuItemModal
            isOpen={isDeleteMenuItemModalOpen}
            onClose={() => {
              setIsDeleteMenuItemModalOpen(false);
              setMenuItemToDelete(null);
            }}
            onConfirm={handleDeleteMenuItem}
            itemName={menuItemToDelete?.name || ''}
            isSubmitting={isMenuItemSubmitting}
          />
        </Section>
      </PageContainer>
    </ErrorBoundary>
  );
};

export const MenuManagementPage: React.FC = () => {
  return <MenuManagementContent />;
};
