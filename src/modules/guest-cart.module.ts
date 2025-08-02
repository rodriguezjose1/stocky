import { Module } from '@nestjs/common';
import { GuestCartUseCases } from 'src/application/use-cases/guest-cart.use-cases';
import { MongooseCartRepositoryAdapter } from 'src/infrastructure/adapters/mongoose/mongoose-cart-repository.adapter';
import { GuestCartController } from 'src/interfaces/http/guest-cart.controller';
import { ProductModule } from './product.module';
import { VariantModule } from './variant.module';
import { StockModule } from './stock.module';

@Module({
  imports: [ProductModule, VariantModule, StockModule],
  providers: [
    {
      provide: 'CartRepositoryPort',
      useClass: MongooseCartRepositoryAdapter,
    },
    GuestCartUseCases,
  ],
  controllers: [GuestCartController],
  exports: [GuestCartUseCases],
})
export class GuestCartModule {} 