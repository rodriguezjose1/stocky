// sale.module.ts
import { Module } from '@nestjs/common';
import { MongooseProductAttributeRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-product-attribute-repository.adapter';
import { ProductAttributeController } from 'src/interfaces/http/product-attribute.controller';
import { ProductAttributeUseCases } from 'src/application/use-cases/product-attribute.use-cases';
import { ProductAttributeSubtypeUseCases } from 'src/application/use-cases/product-attribute-subtype.use-cases';
import { MongooseProductAttributeSubtypeRepositoryAdapter } from 'src/infrastructure/adapters/mongoose/mongoose-product-subtype-repository.adapter';

@Module({
  providers: [
    {
      provide: 'ProductAttributeRepositoryPort',
      useClass: MongooseProductAttributeRepositoryAdapter,
    },
    ProductAttributeUseCases,
    {
      provide: 'ProductAttributeSubtypeRepositoryPort',
      useClass: MongooseProductAttributeSubtypeRepositoryAdapter,
    },
    ProductAttributeSubtypeUseCases,
  ],
  controllers: [ProductAttributeController],
  exports: [],
})
export class ProductAttributeModule {}
