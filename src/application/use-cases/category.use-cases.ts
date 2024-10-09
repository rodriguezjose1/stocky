// application/use-cases/category-use-cases.ts
import { Inject, Injectable } from '@nestjs/common';
import { CategoryRepositoryPort } from '../../domain/ports/category-repository.port';
import { Category } from 'src/domain/entities/category.entity';

@Injectable()
export class CategoryUseCases {
  constructor(
    @Inject('CategoryRepositoryPort')
    private categoryRepository: CategoryRepositoryPort,
  ) {}

  async getCategoriesDropdown(): Promise<Category[]> {
    const categories = await this.categoryRepository.getCategoriesDropdown();

    return this.buildCategoryTree(categories);
  }

  async getCategoriesBy(query): Promise<Category[]> {
    const categories = await this.categoryRepository.getCategoriesBy(query);
    return categories;
  }

  private buildCategoryTree(categories: Category[]): any {
    const categoryMap = new Map<string, any>();

    // Crear un mapa de categorías
    categories.forEach((category) => {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        children: [],
      });
    });

    // Construir la estructura de árbol
    const categoryTree = [];
    categories.forEach((category) => {
      if (category.parent) {
        const parent = categoryMap.get(category.parent);
        if (parent) {
          parent.children.push(categoryMap.get(category.id));
        }
      } else {
        categoryTree.push(categoryMap.get(category.id));
      }
    });

    return categoryTree;
  }
}
