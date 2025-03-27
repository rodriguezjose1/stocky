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
export class ImageSchema {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  alt_text: string;
}

export interface Prices {
  cost?: number;
  retail: number;
  reseller: number;
  wholesale?: number;
}

@Schema({ _id: false })
export class PricesSchema {
  @Prop({ required: false })
  cost?: number;

  @Prop({ required: true })
  retail: number;

  @Prop({ required: true })
  reseller: number;

  @Prop({ required: false })
  wholesale?: number;
}

interface Percentages {
  reseller: number;
  retail: number;
  wholesale?: number;
}

@Schema({ _id: false })
class PercentagesSchema {
  @Prop({ required: true })
  retail: number;

  @Prop({ required: true })
  reseller: number;

  @Prop({ required: false })
  wholesale?: number;
}

@Schema({ _id: false })
class WholesaleDataSchema {
  @Prop({ type: Boolean, default: false })
  is_wholesaler: boolean;

  @Prop({ type: [Number], default: [] })
  predefined_quantities: number[];

  @Prop({ type: String, enum: ['simple', 'complex'], default: 'simple' })
  package_type: string;
}

interface WholesaleData {
  is_wholesaler: boolean;
  predefined_quantities: number[];
  package_type: string;
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

  @Prop({ type: PercentagesSchema, required: true })
  percentages: Percentages;

  @Prop({ type: Boolean, required: true, default: false })
  has_stock: boolean;

  @Prop({ type: SchemaTypes.ObjectId, required: true, default: false })
  size_type: Types.ObjectId;

  // TODO: move sizes and colors to other table to avoid add specifc fields
  @Prop({ type: [String], default: [] })
  sizes: string[];

  @Prop({ type: [String], default: [] })
  colors: string[];

  @Prop({ type: WholesaleDataSchema, required: true, default: { is_wholesaler: false, predefined_quantities: [], package_type: 'simple' } })
  wholesale_data: WholesaleData;

  stocks: any;
  quantity: any;
  createdAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(ProductModel);
