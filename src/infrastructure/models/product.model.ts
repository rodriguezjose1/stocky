// infrastructure/models/product.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ collection: 'products', timestamps: true })
export class ProductModel extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  code: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  brand: string;

  // todo: make table
  @Prop({ required: true, type: [SchemaTypes.ObjectId], ref: 'Category' })
  categories: Types.ObjectId[];

  @Prop({ required: true, type: String })
  size: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  costPrice: number;

  @Prop({ required: true })
  publicPrice: number;

  @Prop({ required: true })
  resellerPrice: number;

  @Prop({ required: true })
  images: string[];
}

export const ProductSchema = SchemaFactory.createForClass(ProductModel);
