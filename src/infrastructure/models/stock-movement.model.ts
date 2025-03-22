import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { StockMovementType } from '../../domain/entities/stock-movement.entity';

@Schema({ timestamps: true })
export class StockMovement extends Document {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true })
  variantId: string;

  @Prop({ required: true, enum: StockMovementType })
  type: StockMovementType;

  @Prop({ required: true })
  previousQuantity: number;

  @Prop({ required: true })
  newQuantity: number;

  @Prop({ required: true })
  difference: number;

  @Prop({ required: true })
  costPrice: number;

  @Prop({ required: true, default: Date.now })
  date: Date;

  @Prop()
  reason?: string;

  @Prop()
  userId?: string;

  @Prop()
  referenceId?: string;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement); 