// infrastructure/models/sale.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { SaleStatus } from 'src/domain/entities/sale.entity';

export interface Prices {
  cost?: number;
  retail?: number;
  reseller?: number;
}

@Schema({ _id: false })
export class PricesSchema {
  @Prop({})
  cost?: number;

  @Prop({})
  retail?: number;

  @Prop({})
  reseller?: number;
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

@Schema()
class SaleDetailSchema {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  product: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  variant: Types.ObjectId;

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
}

export const SaleSchema = SchemaFactory.createForClass(SaleModel);
