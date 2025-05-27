import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UpdateSalesVariantDataScript } from './update-sales-variant-data';
import { SaleSchema } from '../models/sale.model';
import { SaleModel } from '../models/sale.model';
import { UpdateCartVariantsScript } from './update-cart-variants';
import { CartSchema } from '../models/cart.model.model';
import { CartModel } from '../models/cart.model.model';
import { ProductModel } from '../models/product.model';
import { VariantModel } from '../models/variant.model';
import { ProductAttributeModel } from '../models/product-attribute.model';
import { ProductSchema } from '../models/product.model';
import { ProductAttributeSchema } from '../models/product-attribute.model';
import { VariantSchema } from '../models/variant.model';
import { UpdateVariantLabelsMigration } from './update-variant-labels';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SaleModel.name, schema: SaleSchema },
      { name: CartModel.name, schema: CartSchema },
      { name: ProductModel.name, schema: ProductSchema },
      { name: VariantModel.name, schema: VariantSchema },
      { name: ProductAttributeModel.name, schema: ProductAttributeSchema },
    ]),
  ],
  providers: [
    UpdateSalesVariantDataScript,
    UpdateCartVariantsScript,
    UpdateVariantLabelsMigration,
  ],
  exports: [
    UpdateSalesVariantDataScript,
    UpdateCartVariantsScript,
    UpdateVariantLabelsMigration,
  ],
})
export class ScriptsModule {} 