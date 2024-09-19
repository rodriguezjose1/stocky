import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ collection: 'users' })
export class UserModel extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  lastname: string;

  @Prop({ type: String, required: true, select: false })
  password: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'RoleModel' })
  roles: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(UserModel);
