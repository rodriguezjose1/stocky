// infrastructure/models/sale.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema()
class SaleDetailSchema {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  product_id: Types.ObjectId;

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

  @Prop({ type: [SaleDetailSchemaFactory], required: true })
  details: SaleDetailSchema[];
}

export const SaleSchema = SchemaFactory.createForClass(SaleModel);
