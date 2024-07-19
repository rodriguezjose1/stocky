// purchase.module.ts
import { Module } from '@nestjs/common';
import { CreatePurchaseUseCase } from './application/use-cases/purchase.use-cases';
import { MongoosePurchaseRepositoryAdapter } from './infrastructure/adapters/mongoose-purchase-repository.adapter';
import { PurchaseController } from './interfaces/http/purchase.controller';

@Module({
  providers: [
    {
      provide: 'PurchaseRepositoryPort',
      useClass: MongoosePurchaseRepositoryAdapter,
    },
    CreatePurchaseUseCase,
  ],
  controllers: [PurchaseController],
})
export class PurchaseModule {}
