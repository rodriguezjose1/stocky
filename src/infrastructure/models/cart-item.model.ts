import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { Image, ImageSchema, Prices, PricesSchema, WholesaleData, WholesaleDataSchema } from './product.model';
import { VariantModel, VariantSchema } from './variant.model';
import { AppliedPriceType, AppliedPriceTypeEnum } from 'src/domain/entities/sale.entity';

@Schema({ _id: false })
export class ProductBrief extends Document {
  @Prop({ type: SchemaTypes.ObjectId })
  _id: Types.ObjectId;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  code: string;

  @Prop({ type: PricesSchema })
  prices: Prices;

  @Prop({ type: [ImageSchema] })
  pictures: Image[];
  
  @Prop({ type: WholesaleDataSchema, default: { is_wholesaler: false, package_type: null } })
  wholesale_data: WholesaleData;
}

export const ProductBriefSchema = SchemaFactory.createForClass(ProductBrief);

// interface ProductBrief
interface IProductBrief {
  _id: Types.ObjectId;
  name: string;
  code: string;
  prices: Prices;
  pictures: Image[];
  wholesale_data: WholesaleData;
}

@Schema({ _id: false })
export class CartItem extends Document {
  @Prop({ type: ProductBriefSchema })
  product: IProductBrief;

  @Prop({ type: VariantSchema, default: null })
  variant: VariantModel;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'StockModel' })
  stock: Types.ObjectId;

  @Prop()
  quantity: number;

  @Prop({ type: Boolean, default: false })
  is_wholesale_package: boolean;

  @Prop({ type: Number, default: 0 })
  predefined_quantity: number;

  @Prop({ type: String, enum: AppliedPriceTypeEnum, default: AppliedPriceTypeEnum.RETAIL })
  applied_price_type: AppliedPriceType;

  @Prop({ type: [{
    variant: { type: VariantSchema },
    quantity: Number
  }], default: [] })
  wholesale_variants: {
    variant: VariantModel; 
    quantity: number;
  }[];
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
