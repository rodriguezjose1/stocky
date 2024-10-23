// sale.module.ts
import { Module } from '@nestjs/common';
import { CartUseCases } from 'src/application/use-cases/cart.use-cases';
import { MongooseCartRepositoryAdapter } from 'src/infrastructure/adapters/mongoose/mongoose-cart-repository.adapter';
import { CartController } from 'src/interfaces/http/cart.controller';
import { ProductModule } from './product.module';
import { VariantModule } from './variant.module';

@Module({
  imports: [ProductModule, VariantModule],
  providers: [
    {
      provide: 'CartRepositoryPort',
      useClass: MongooseCartRepositoryAdapter,
    },
    CartUseCases,
  ],
  controllers: [CartController],
  exports: [CartUseCases],
})
export class CartModule {}
