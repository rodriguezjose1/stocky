// infrastructure/models/purchase.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema()
class PurchaseDetailSchema {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  product_id: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unit_price: number;
}

const PurchaseDetailSchemaFactory = SchemaFactory.createForClass(PurchaseDetailSchema);

@Schema({ collection: 'purchases', timestamps: true })
export class PurchaseModel extends Document {
  @Prop({ required: true })
  date: Date;

  @Prop({ type: [PurchaseDetailSchemaFactory], required: true })
  details: PurchaseDetailSchema[];
}

export const PurchaseSchema = SchemaFactory.createForClass(PurchaseModel);
