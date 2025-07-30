// sale.module.ts
import { Module } from '@nestjs/common';
import { SalesUseCase } from '../application/use-cases/sale.use-cases';
import { ERROR_HANDLER_PORT } from '../domain/ports/error-handler.port';
import { MongooseSaleRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-sale-repository.adapter';
import { NestErrorHandlerAdapter } from '../infrastructure/adapters/nest-error-handler.adapter';
import { SaleController } from '../interfaces/http/sale.controller';
import { CartModule } from './cart.module';
import { ProductAttributeSubtypeModule } from './product-attribute-subtype.module';
import { ProductAttributeModule } from './product-attribute.module';
import { ProductModule } from './product.module';
import { StockModule } from './stock.module';
import { UserModule } from './user.module';
import { VariantModule } from './variant.module';
import { GuestSaleUseCases } from 'src/application/use-cases/guest-sale.use-cases';
import { MongooseCartRepositoryAdapter } from 'src/infrastructure/adapters/mongoose/mongoose-cart-repository.adapter';
@Module({
  imports: [StockModule, ProductModule, CartModule, UserModule, VariantModule, ProductAttributeModule, ProductAttributeSubtypeModule],
  providers: [
    {
      provide: 'CartRepositoryPort',
      useClass: MongooseCartRepositoryAdapter,
    },
    {
      provide: 'ERROR_HANDLER_PORT',
      useClass: NestErrorHandlerAdapter,
    },
    {
      provide: 'SaleRepositoryPort',
      useClass: MongooseSaleRepositoryAdapter,
    },
    {
      provide: ERROR_HANDLER_PORT,
      useClass: NestErrorHandlerAdapter,
    },
    SalesUseCase,
    GuestSaleUseCases,
  ],
  controllers: [SaleController],
  exports: [SalesUseCase, GuestSaleUseCases],
})
export class SaleModule {}
