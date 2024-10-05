// stock.module.ts
import { Module } from '@nestjs/common';
import { StockUseCases } from '../application/use-cases/stock.use-cases';
import { MongooseStockRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-stock-repository.adapter';
import { StockController } from '../interfaces/http/stock.controller';
import { ProductVariantModule } from './product-variant.module';
import { VariantModule } from './variant.module';

@Module({
  imports: [VariantModule, ProductVariantModule],
  providers: [
    StockUseCases,
    {
      provide: 'StockRepositoryPort',
      useClass: MongooseStockRepositoryAdapter,
    },
  ],
  controllers: [StockController],
  exports: [StockUseCases],
})
export class StockModule {}
