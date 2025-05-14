import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SaleModel, SaleSchema } from '../models/sale.model';
import { StockModel, StockSchema } from '../models/stock.model';
import { ProductModel, ProductSchema } from '../models/product.model';
import { VariantModel, VariantSchema } from '../models/variant.model';
import { ProductAttributeModel, ProductAttributeSchema } from '../models/product-attribute.model';
import { CartModel, CartSchema } from '../models/cart.model.model';
import { UpdateCartVariantsScript } from './update-cart-variants';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true, 
      envFilePath: process.env.NODE_ENV === 'dev' ? `.env_${process.env.NODE_ENV}` : undefined 
    }),
    DatabaseModule.forRootAsync(),
    MongooseModule.forFeature([
      { name: SaleModel.name, schema: SaleSchema },
      { name: StockModel.name, schema: StockSchema },
      { name: ProductModel.name, schema: ProductSchema },
      { name: VariantModel.name, schema: VariantSchema },
      { name: ProductAttributeModel.name, schema: ProductAttributeSchema },
      { name: CartModel.name, schema: CartSchema },
    ]),
  ],
  providers: [
    UpdateCartVariantsScript,
  ],
})
export class MigrationModule {} 