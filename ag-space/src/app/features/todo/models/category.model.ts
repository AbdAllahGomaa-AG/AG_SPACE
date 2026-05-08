/**
 * Category model matching Supabase schema
 */
export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * DTO for creating a new category
 */
export interface CreateCategoryRequest {
  name: string;
  color?: string;
  icon?: string;
}

/**
 * DTO for updating a category
 */
export interface UpdateCategoryRequest {
  name?: string;
  color?: string;
  icon?: string;
}

/**
 * Special "Uncategorized" constant for tasks without a category
 */
export const UNCATEGORIZED: Readonly<Category> = {
  id: 'uncategorized',
  user_id: '',
  name: 'Uncategorized',
  color: '#9ca3af', // gray-400
  icon: 'pi pi-tag',
  is_default: false,
  created_at: '',
  updated_at: '',
};
