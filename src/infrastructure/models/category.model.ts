import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

interface IAncestor {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

@Schema({ _id: false })
class Ancestor {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'CategoryModel' })
  _id: Types.ObjectId;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  slug: string;
}

const AncestorSchema = SchemaFactory.createForClass(Ancestor);

@Schema({ collection: 'categories' })
export class CategoryModel extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: SchemaTypes.ObjectId, default: null })
  parent: Types.ObjectId;

  @Prop({ type: [AncestorSchema] })
  ancestors: IAncestor[];

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'CategoryModel' })
  children: Types.ObjectId[];
}

export const CategorySchema = SchemaFactory.createForClass(CategoryModel);
