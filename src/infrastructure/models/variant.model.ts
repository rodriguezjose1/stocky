import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ collection: 'variants', timestamps: true })
export class VariantModel extends Document {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  product: Types.ObjectId;

  @Prop({ type: String, required: true })
  size: string;

  @Prop({ type: String, required: true })
  color: string;
}

export const VariantSchema = SchemaFactory.createForClass(VariantModel);
