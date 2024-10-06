// infrastructure/models/sale.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { SaleStatus } from 'src/domain/entities/sale.entity';

@Schema()
class SaleDetailSchema {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  product_id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  variant_id: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unit_price: number;
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
}

export const SaleSchema = SchemaFactory.createForClass(SaleModel);
