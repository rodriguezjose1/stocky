import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UpdateSalesVariantDataScript } from './update-sales-variant-data';
import { SaleSchema } from '../models/sale.model';
import { SaleModel } from '../models/sale.model';
import { UpdateCartVariantsScript } from './update-cart-variants';
import { CartSchema } from '../models/cart.model.model';
import { CartModel } from '../models/cart.model.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SaleModel.name, schema: SaleSchema },
      { name: CartModel.name, schema: CartSchema },
    ]),
  ],
  providers: [
    UpdateSalesVariantDataScript,
    UpdateCartVariantsScript,
  ],
  exports: [
    UpdateSalesVariantDataScript,
    UpdateCartVariantsScript,
  ],
})
export class ScriptsModule {} 