import { Category } from '../entities/category.entity';

export interface CategoryRepositoryPort {
  getCategoriesDropdown(): Promise<Category[]>;
  getCategoriesBy(query): Promise<Category[]>;
}
