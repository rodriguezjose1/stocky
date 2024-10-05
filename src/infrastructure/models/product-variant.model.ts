import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ collection: 'productvariants', timestamps: true })
export class ProductVariantModel extends Document {
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'VariantModel' })
  variant_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  attribute_type: string;

  @Prop({ type: String, required: true })
  attribute_value: string;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariantModel);
