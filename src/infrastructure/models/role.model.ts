import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

@Schema({ _id: false })
export class Permissions {
  @Prop({ type: SchemaTypes.Mixed, required: true })
  allowedFields: any;
}

const PermissionsSchema = SchemaFactory.createForClass(Permissions);

@Schema({ collection: 'roles', timestamps: true })
export class RoleModel extends Document {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: PermissionsSchema, required: true })
  permissions: Permissions;
}

export const RoleSchema = SchemaFactory.createForClass(RoleModel);
