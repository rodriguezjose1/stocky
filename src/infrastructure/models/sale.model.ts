// infrastructure/models/sale.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { SaleStatus } from 'src/domain/entities/sale.entity';

@Schema()
class StocksUpdated {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  stock: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  cost_price: number;
}

interface IStocksUpated {
  stock: Types.ObjectId;
  quantity: number;
  cost_price: number;
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
