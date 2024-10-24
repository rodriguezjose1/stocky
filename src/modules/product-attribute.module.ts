// sale.module.ts
import { Module } from '@nestjs/common';
import { MongooseProductAttributeRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-product-attribute-repository.adapter';
import { ProductAttributeController } from 'src/interfaces/http/product-attribute.controller';
import { ProductAttributeUseCases } from 'src/application/use-cases/product-attribute.use-cases';

@Module({
  providers: [
    {
      provide: 'ProductAttributeRepositoryPort',
      useClass: MongooseProductAttributeRepositoryAdapter,
    },
    ProductAttributeUseCases,
  ],
  controllers: [ProductAttributeController],
  exports: [],
})
export class ProductAttributeModule {}
