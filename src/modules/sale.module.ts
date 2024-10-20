// sale.module.ts
import { Module } from '@nestjs/common';
import { SalesUseCase } from '../application/use-cases/sale.use-cases';
import { MongooseSaleRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-sale-repository.adapter';
import { SaleController } from '../interfaces/http/sale.controller';
import { StockModule } from './stock.module';
import { ERROR_HANDLER_PORT } from '../domain/ports/error-handler.port';
import { NestErrorHandlerAdapter } from '../infrastructure/adapters/nest-error-handler.adapter';
import { ProductModule } from './product.module';

@Module({
  imports: [StockModule, ProductModule],
  providers: [
    {
      provide: 'SaleRepositoryPort',
      useClass: MongooseSaleRepositoryAdapter,
    },
    {
      provide: ERROR_HANDLER_PORT,
      useClass: NestErrorHandlerAdapter,
    },
    SalesUseCase,
  ],
  controllers: [SaleController],
  exports: [SalesUseCase],
})
export class SaleModule {}
