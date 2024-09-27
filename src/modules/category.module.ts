// sale.module.ts
import { Module } from '@nestjs/common';
import { MongooseCategoryRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-category-repository.adapter';

@Module({
  providers: [
    {
      provide: 'CategoryRepositoryPort',
      useClass: MongooseCategoryRepositoryAdapter,
    },
  ],
  controllers: [],
  exports: [],
})
export class CategoryModule {}
