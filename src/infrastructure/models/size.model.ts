import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'sizes', timestamps: true })
export class SizeModel extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  code: string;
}

export const SizeSchema = SchemaFactory.createForClass(SizeModel);
