import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ collection: 'categories' })
export class CategoryModel extends Document {
  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'Category' })
  root: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'Category' })
  parent: Types.ObjectId;

  @Prop({ type: String, required: true })
  path: string;
}

export const CategorySchema = SchemaFactory.createForClass(CategoryModel);
