import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'productattributes', timestamps: true })
export class ProductAttributeModel extends Document {
  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, default: null })
  subtype: string;

  @Prop({ type: String, required: true })
  value: string;
}

export const ProductAttributeSchema = SchemaFactory.createForClass(ProductAttributeModel);
