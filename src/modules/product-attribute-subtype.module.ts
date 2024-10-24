// sale.module.ts
import { Module } from '@nestjs/common';
import { MongooseProductAttributeSubtypeRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-product-subtype-repository.adapter';
import { ProductAttributeSubtypeController } from 'src/interfaces/http/product-attribute-subtype.controller';
import { ProductAttributeSubtypeUseCases } from 'src/application/use-cases/product-attribute-subtype.use-cases';

@Module({
  providers: [
    {
      provide: 'ProductAttributeSubtypeRepositoryPort',
      useClass: MongooseProductAttributeSubtypeRepositoryAdapter,
    },
    ProductAttributeSubtypeUseCases,
  ],
  controllers: [ProductAttributeSubtypeController],
  exports: [],
})
export class ProductAttributeSubtypeModule {}
