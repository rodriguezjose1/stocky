// interfaces/http/categorie.controller.ts
import { Controller, Get } from '@nestjs/common';
import { CategoryUseCases } from '../../application/use-cases/category.use-cases';

@Controller('categories')
export class CategoryController {
  constructor(private categoriesUseCases: CategoryUseCases) {}

  @Get('/dropdown')
  async getAllCategories() {
    const categories = await this.categoriesUseCases.getCategoriesDropdown();

    return {
      categories,
    };
  }
}
