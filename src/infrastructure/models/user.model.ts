import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ collection: 'users', timestamps: true })
export class UserModel extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  lastname: string;

  @Prop({ type: String, required: true, select: false })
  password: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ type: String, default: '' })
  phone: string;

  @Prop({ type: Date, default: null })
  last_connection: Date;

  @Prop({ type: Date, default: null })
  birthdate: Date;

  @Prop({ type: String, default: '' })
  address: string;

  @Prop({ type: String, default: '' })
  dni: string;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'RoleModel' })
  roles: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
