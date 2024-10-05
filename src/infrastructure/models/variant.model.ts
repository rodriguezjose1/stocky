import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ collection: 'variants', timestamps: true })
export class VariantModel extends Document {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  product_id: Types.ObjectId;
}

export const VariantSchema = SchemaFactory.createForClass(VariantModel);
