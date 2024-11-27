import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CartItem, CartItemSchema } from './cart-item.model';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'carts' })
export class CartModel extends Document {
  @Prop({ type: SchemaTypes.ObjectId })
  userId: Types.ObjectId;

  @Prop([CartItemSchema])
  items: CartItem[];

  @Prop()
  total_reseller: number;

  @Prop()
  total_retail: number;

  @Prop({ type: Boolean, default: true })
  active: boolean;
}

export const CartSchema = SchemaFactory.createForClass(CartModel);
