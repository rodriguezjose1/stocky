// infrastructure/models/sale.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { SaleStatus } from 'src/domain/entities/sale.entity';

@Schema({ _id: false })
export class UserDataSchema {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  lastname: string;
}

interface UserData {
  id: string;
  name: string;
  lastname: string;
}

export interface Prices {
  cost?: number;
  retail?: number;
  reseller?: number;
  wholesale?: number;
}

@Schema({ _id: false })
export class PricesSchema {
  @Prop({})
  cost?: number;

  @Prop({})
  retail?: number;

  @Prop({})
  reseller?: number;

  @Prop({})
  wholesale?: number;
}

@Schema()
class StocksUpdated {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  stock: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ type: PricesSchema })
  prices: Prices;
}

interface IStocksUpated {
  stock: Types.ObjectId;
  quantity: number;
  prices: Prices;
}

const StocksUpdatedSchema = SchemaFactory.createForClass(StocksUpdated);

@Schema({ _id: false })
export class VariantAttributeSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  value: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  key_label: string;
}

interface VariantAttribute {
  name: string;
  value: string;
  label: string;
  key_label: string;
}

@Schema({ _id: false })
class VarianDataSchema {
  @Prop({ type: String, required: true })
  product_name: string;

  @Prop({ type: String, required: true })
  product_code: string;

  @Prop({ type: [VariantAttributeSchema], required: true })
  variant_attributes: VariantAttribute[];
}

interface VariantData {
  product_name: string;
  product_code: string;
  variant_attributes: VariantAttribute[];
}

@Schema()
export class SaleDetailSchema {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  product: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  variant: Types.ObjectId;

  @Prop({ type: VarianDataSchema })
  variant_data: VariantData;

  @Prop({ required: true })
  quantity: number;

  @Prop({ type: PricesSchema, required: true })
  prices: Prices;
}

const SaleDetailSchemaFactory = SchemaFactory.createForClass(SaleDetailSchema);

@Schema({ collection: 'sales', timestamps: true })
export class SaleModel extends Document {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, enum: SaleStatus, default: SaleStatus.PENDING })
  status: SaleStatus;

  @Prop({ type: [SaleDetailSchemaFactory], required: true })
  details: SaleDetailSchema[];

  @Prop({ required: true, type: [StocksUpdatedSchema] })
  stocks_updated: IStocksUpated[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'CartModel', default: null })
  cart?: Types.ObjectId;

  @Prop({ type: UserDataSchema })
  user: UserData;

  @Prop({ required: true })
  weekCode: string;
}

export const SaleSchema = SchemaFactory.createForClass(SaleModel);
