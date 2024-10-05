// sale.module.ts
import { Module } from '@nestjs/common';
import { MongooseVariantRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-variant-repository.adapter';
import { VariantUseCases } from 'src/application/use-cases/variant.use-cases';

@Module({
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
