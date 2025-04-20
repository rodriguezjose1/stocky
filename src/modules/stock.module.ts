// stock.module.ts
import { Module } from '@nestjs/common';
import { StockUseCases } from '../application/use-cases/stock.use-cases';
import { MongooseStockRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-stock-repository.adapter';
import { StockController } from '../interfaces/http/stock.controller';
import { ProductModule } from './product.module';
import { VariantModule } from './variant.module';
import { ProductAttributeModule } from './product-attribute.module';

@Module({
  imports: [VariantModule, ProductModule, ProductAttributeModule],
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
