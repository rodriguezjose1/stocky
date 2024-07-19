import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({ collection: 'stock', timestamps: true })
export class StockModel extends Document {
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'Product' })
  product_id: string;

  @Prop({ required: true })
  quantity: number;
}

export const StockSchema = SchemaFactory.createForClass(StockModel);
