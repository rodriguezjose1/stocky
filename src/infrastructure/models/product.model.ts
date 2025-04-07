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

export interface Image {
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

interface WholesalePercentage {
  half_dozen: number;
  dozen: number;
}

@Schema({ _id: false })
class WholesalePercentageSchema {
  @Prop({ required: true })
  half_dozen: number;

  @Prop({ required: true })
  dozen: number;
}

export interface Prices {
  cost?: number;
  retail: number;
  reseller: number;
  wholesale?: WholesalePercentage;
}

@Schema({ _id: false })
export class PricesSchema {
  @Prop({ required: false })
  cost?: number;

  @Prop({ required: true })
  retail: number;

  @Prop({ required: true })
  reseller: number;

  @Prop({ required: false, type: WholesalePercentageSchema })
  wholesale?: WholesalePercentage;
}

interface Percentages {
  reseller: number;
  retail: number;
  wholesale?: WholesalePercentage;
}

@Schema({ _id: false })
class PercentagesSchema {
  @Prop({ required: true })
  retail: number;

  @Prop({ required: true })
  reseller: number;

  @Prop({ required: false, type: WholesalePercentageSchema })
  wholesale?: WholesalePercentage;
}

@Schema({ _id: false })
export class WholesaleDataSchema {
  @Prop({ type: Boolean, default: false })
  is_wholesaler: boolean;

  @Prop({ type: String, enum: ['simple', 'complex', null], default: null, })
  package_type: string;
}

export interface WholesaleData {
  is_wholesaler: boolean;
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

  @Prop({ type: WholesaleDataSchema, required: true, default: { is_wholesaler: false, package_type: null } })
  wholesale_data: WholesaleData;

  stocks: any;
  quantity: any;
  createdAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(ProductModel);
