import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ collection: 'stock', timestamps: true })
export class StockModel extends Document {
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'ProductModel' })
  product_id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'VariantModel' })
  variant_id: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  cost_price: number;

  @Prop({ required: true })
  date: Date;

  productVariant: any;
  product: any;
}

export const StockSchema = SchemaFactory.createForClass(StockModel);
