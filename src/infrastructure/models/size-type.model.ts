import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'sizetypes', timestamps: true })
export class SizeTypeModel extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  code: string;
}

export const SizeTypeSchema = SchemaFactory.createForClass(SizeTypeModel);
