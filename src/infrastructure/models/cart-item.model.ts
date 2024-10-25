import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ProductModel, ProductSchema } from './product.model';
import { VariantModel, VariantSchema } from './variant.model';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema()
export class CartItem extends Document {
  @Prop({ type: ProductSchema })
  product: ProductModel;

  @Prop({ type: VariantSchema })
  variant: VariantModel;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'StockModel' })
  stock: Types.ObjectId;

  @Prop()
  quantity: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
