// src/product/product.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductSeeder } from './product.seeder';
import {
  ProductModel,
  ProductSchema,
} from '../src/infrastructure/models/product.model';

@Module({
  imports: [
    // Registrar el esquema del producto
    MongooseModule.forFeature([
      { name: ProductModel.name, schema: ProductSchema },
    ]),
  ],
  providers: [ProductSeeder],
  exports: [ProductSeeder],
})
export class SeederModule {}
