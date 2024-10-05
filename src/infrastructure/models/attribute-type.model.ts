import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'attributetypes', timestamps: true })
export class AttributeTypeModel extends Document {
  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: String, required: true })
  name: string;
}

export const AttributeTypeSchema = SchemaFactory.createForClass(AttributeTypeModel);
