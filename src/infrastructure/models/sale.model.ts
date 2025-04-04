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

  @Prop({
    type: {
      cost: Number,
      retail: Number,
      reseller: Number,
      wholesale: {
        half_dozen: Number,
        dozen: Number,
      }
    }
  })
  prices: {
    cost?: number;
    retail?: number;
    reseller?: number;
    wholesale?: {
      half_dozen: number;
      dozen: number;
    };
  };
}

interface IStocksUpated {
  stock: Types.ObjectId;
  quantity: number;
  prices: {
    cost?: number;
    retail?: number;
    reseller?: number;
    wholesale?: number | {
      half_dozen: number;
      dozen: number;
    };
  };
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
export class VariantDataSchema {
  @Prop({ type: String })
  product_name?: string;

  @Prop({ type: String })
  product_code?: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  variant_id: Types.ObjectId;

  @Prop({ type: [VariantAttributeSchema] })
  variant_attributes?: VariantAttribute[];
}

interface VariantData {
  product_name: string;
  product_code: string;
  variant_id: Types.ObjectId;
  variant_attributes: VariantAttribute[];
}
@Schema({ _id: false })
export class WholesaleVariantSchema {
  @Prop({ type: VariantDataSchema })
  variant: VariantData;

  @Prop({ required: true })
  quantity: number;
}

interface WholesaleVariant {
  variant: VariantData;
  quantity: number;
}
@Schema()
export class SaleDetailSchema {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  product: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, default: null })
  variant: Types.ObjectId;

  @Prop({ type: VariantDataSchema, default: null })
  variant_data: VariantData;

  @Prop({ required: true })
  quantity: number;

  @Prop({ type: PricesSchema, required: true })
  prices: Prices;

  @Prop({ type: Boolean, default: false })
  is_wholesale_package: boolean;

  @Prop({ type: Number, default: 0 })
  predefined_quantity: number;

  @Prop({
    type: [WholesaleVariantSchema], default: []
  })
  wholesale_variants: WholesaleVariant[];
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
