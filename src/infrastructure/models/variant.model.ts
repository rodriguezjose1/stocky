import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'variants', timestamps: true })
export class VariantModel extends Document {
  @Prop({ type: String, required: true })
  size: string;

  @Prop({ type: String, required: true })
  color: string;

  @Prop({ type: String, required: true })
  size_label: string;

  @Prop({ type: String, required: true })
  color_label: string;

}

export const VariantSchema = SchemaFactory.createForClass(VariantModel);
