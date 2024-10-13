// infrastructure/models/product.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

interface Attributes {
  brand: string;
}

@Schema({ _id: false })
class AttributeSchema {
  @Prop({ required: true })
  brand: string;
}

interface Image {
  url: string;
  alt_text: string;
}

@Schema({ _id: false })
class ImageSchema {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  alt_text: string;
}

interface Prices {
  cost?: number;
  retail: number;
  reseller: number;
}

@Schema({ _id: false })
class PricesSchema {
  @Prop({ required: false })
  cost?: number;

  @Prop({ required: true })
  retail: number;

  @Prop({ required: true })
  reseller: number;
}

@Schema({ timestamps: true, collection: 'products' })
export class ProductModel extends Document {
  @Prop({ required: true, type: [[SchemaTypes.ObjectId]], ref: 'CategoryModel' })
  categories_filter: Types.ObjectId[][];

  @Prop({ required: true, type: [SchemaTypes.ObjectId], ref: 'CategoryModel' })
  categories: Types.ObjectId[];

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: AttributeSchema, required: true })
  attributes: Attributes;

  @Prop({ type: [ImageSchema] })
  pictures: Image[];

  @Prop({ type: PricesSchema, required: true })
  prices: Prices;

  stock: any;
  variant: any;
  stocks: any;
}

export const ProductSchema = SchemaFactory.createForClass(ProductModel);
