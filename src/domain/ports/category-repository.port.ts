import { Category } from '../entities/category.entity';

export interface CategoryRepositoryPort {
  getAll(): Promise<Category[]>;
  getById(id: string): Promise<Category>;
  create(data: { name: string; code: string; active: boolean; sizeTypes?: string[] }): Promise<Category>;
  getCategoriesDropdown(): Promise<Category[]>;
  getCategoriesBy(query): Promise<Category[]>;
}
