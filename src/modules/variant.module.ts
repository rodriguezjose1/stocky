// sale.module.ts
import { Module } from '@nestjs/common';
import { MongooseVariantRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-variant-repository.adapter';
import { VariantUseCases } from 'src/application/use-cases/variant.use-cases';
import { ProductAttributeModule } from './product-attribute.module';
@Module({
  imports: [ProductAttributeModule],
  providers: [
    VariantUseCases,
    {
      provide: 'VariantRepositoryPort',
      useClass: MongooseVariantRepositoryAdapter,
    },
  ],
  controllers: [],
  exports: [VariantUseCases],
})
export class VariantModule {}
