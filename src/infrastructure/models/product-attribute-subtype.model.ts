import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'productattributesubtypes', timestamps: true })
export class ProductAttributeSubtypeModel extends Document {
  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, required: true })
  label_type: string;

  @Prop({ type: String, required: true })
  value: string;
}

export const ProductAttributeSubtypeSchema = SchemaFactory.createForClass(ProductAttributeSubtypeModel);
