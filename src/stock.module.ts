// stock.module.ts
import { Module } from '@nestjs/common';
import { StockUseCases } from './application/use-cases/stock.use-cases';
import { MongooseStockRepositoryAdapter } from './infrastructure/adapters/mongoose-stock-repository.adapter';
import { StockController } from './interfaces/http/stock.controller';

@Module({
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
