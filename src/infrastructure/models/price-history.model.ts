import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { Prices, PricesSchema } from './product.model';

@Schema({ collection: 'price_history', timestamps: true })
export class PriceHistoryModel extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'ProductModel', required: true })
  productId: Types.ObjectId;

  @Prop({ type: PricesSchema, required: true })
  previousPrice: Prices;

  @Prop({ type: PricesSchema, required: true })
  newPrice: Prices;

  @Prop({ type: Date, default: Date.now })
  modifiedAt: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'UserModel', required: true })
  modifiedBy: Types.ObjectId;

  @Prop({ type: Number, required: true })
  percentage: number;

  @Prop({ type: String })
  comments: string;
}

export const PriceHistorySchema = SchemaFactory.createForClass(PriceHistoryModel);
