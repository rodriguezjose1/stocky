// sale.module.ts
import { Module } from '@nestjs/common';
import { MongooseProductVariantRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-product-variant-repository.adapter';
import { ProductVariantUseCases } from 'src/application/use-cases/product-variant.use-cases';

@Module({
  providers: [
    ProductVariantUseCases,
    {
      provide: 'ProductVariantRepositoryPort',
      useClass: MongooseProductVariantRepositoryAdapter,
    },
  ],
  controllers: [],
  exports: [ProductVariantUseCases],
})
export class ProductVariantModule {}
