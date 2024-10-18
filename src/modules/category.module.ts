// sale.module.ts
import { Module } from '@nestjs/common';
import { CategoryUseCases } from 'src/application/use-cases/category.use-cases';
import { CategoryController } from 'src/interfaces/http/category.controller';
import { MongooseCategoryRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-category-repository.adapter';

@Module({
  providers: [
    {
      provide: 'CategoryRepositoryPort',
      useClass: MongooseCategoryRepositoryAdapter,
    },
    CategoryUseCases,
  ],
  controllers: [CategoryController],
  exports: [CategoryUseCases],
})
export class CategoryModule {}
