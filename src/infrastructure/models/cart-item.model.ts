import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ProductModel, ProductSchema } from './product.model';
import { VariantModel, VariantSchema } from './variant.model';
import { Document } from 'mongoose';

@Schema()
export class CartItem extends Document {
  @Prop({ type: ProductSchema })
  product: ProductModel;

  @Prop({ type: VariantSchema, ref: 'VariantModel' })
  variant: VariantModel;

  @Prop()
  quantity: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
