import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ collection: 'stock', timestamps: true })
export class StockModel extends Document {
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'ProductModel' })
  product: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'VariantModel' })
  variant: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  cost_price: number;

  @Prop({ default: new Date() })
  date: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'UserModel' })
  user_id: Types.ObjectId;
}

export const StockSchema = SchemaFactory.createForClass(StockModel);
