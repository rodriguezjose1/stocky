import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'colors', timestamps: true })
export class ColorModel extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  code: string;
}

export const ColorSchema = SchemaFactory.createForClass(ColorModel);
