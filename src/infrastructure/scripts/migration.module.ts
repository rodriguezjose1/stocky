import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { UpdateSalesVariantDataScript } from './update-sales-variant-data';
import { MongooseModule } from '@nestjs/mongoose';
import { SaleModel, SaleSchema } from '../models/sale.model';
import { StockModel, StockSchema } from '../models/stock.model';
import { ProductModel, ProductSchema } from '../models/product.model';
import { VariantModel, VariantSchema } from '../models/variant.model';
import { ProductAttributeModel, ProductAttributeSchema } from '../models/product-attribute.model';

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
    ]),
  ],
  providers: [
    UpdateSalesVariantDataScript,
  ],
})
export class MigrationModule {} 