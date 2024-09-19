// purchase.module.ts
import { Module } from '@nestjs/common';
import { PurchasesUseCase } from '../application/use-cases/purchase.use-cases';
import { MongoosePurchaseRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-purchase-repository.adapter';
import { PurchaseController } from '../interfaces/http/purchase.controller';

@Module({
  providers: [
    {
      provide: 'PurchaseRepositoryPort',
      useClass: MongoosePurchaseRepositoryAdapter,
    },
    PurchasesUseCase,
  ],
  controllers: [PurchaseController],
  exports: [PurchasesUseCase],
})
export class PurchaseModule {}
