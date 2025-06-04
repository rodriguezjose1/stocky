import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import { AppliedPriceTypeEnum } from 'src/domain/entities/sale.entity';
import { Prices, PricesSchema } from './product.model';
import { StockMovement as StockMovementEntity } from 'src/domain/entities/stock-movement.entity';

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum SaleType {
  PUBLIC = 'public',
  RESELLER = 'reseller',
  WHOLESALE = 'wholesale'
}

export enum MovementSource {
  MANUAL = 'MANUAL',
  SALE = 'SALE',
  ADJUSTMENT = 'adjustment'
}

export enum StockMovementStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED'
}

@Schema({ timestamps: true })
export class StockMovement extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'ProductModel' })
  product_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'VariantModel' })
  variant_id: Types.ObjectId;
  
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'StockModel' })
  stock: Types.ObjectId

  @Prop({ required: true, enum: StockMovementType })
  type: StockMovementType;

  @Prop({ required: true })
  quantity: number;

  // Precios
  @Prop({ type: PricesSchema, required: true })
  prices: Prices

  @Prop({ enum: AppliedPriceTypeEnum, required: false })
  applied_price_type: AppliedPriceTypeEnum;

  // Ganancia
  @Prop({ type: Number, required: false, default: 0 })
  profit_unit: number;

  @Prop({ type: Number, required: false, default: 0 })
  total_profit: number;

  // Trazabilidad
  @Prop({ type: SchemaTypes.ObjectId, required: false, default: null, ref: 'UserModel' })
  operator_id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'SaleModel' })
  sale_id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: false, default: null, ref: 'UserModel' })
  client_id: Types.ObjectId;

  // Stock
  @Prop({ required: true, type: Number })
  stock_before: number;

  @Prop({ required: true, type: Number })
  stock_after: number;

  // Información de tiempo
  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ required: true, type: Number })
  year: number;

  @Prop({ required: true, type: Number })
  month: number;

  @Prop({ required: true, type: Number })
  week: number;

  // Información adicional
  @Prop({ required: true, enum: MovementSource })
  source: MovementSource;

  @Prop({ required: false, enum: StockMovementStatus, default: null })
  status: StockMovementStatus;

  @Prop({ required: false, type: String })
  notes: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  mapToEntity(): StockMovementEntity {
    return {
      id: this._id.toString(),
      productId: this.product_id.toString(),
      variantId: this.variant_id?.toString(),
      stock: this.stock.toString(),
      type: this.type,
      quantity: this.quantity,
      stockBefore: this.stock_before,
      stockAfter: this.stock_after,
      source: this.source,
      status: this.status,
      saleId: this.sale_id?.toString(),
      clientId: this.client_id?.toString(),
      notes: this.notes,
      prices: this.prices,
      appliedPriceType: this.applied_price_type,
      week: this.week,
      month: this.month,
      year: this.year,
      date: this.date,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static mapToModel(entity: Partial<StockMovementEntity>): Partial<StockMovement> {
    const model: Partial<StockMovement> = {};
    
    if (entity.productId) model.product_id = new Types.ObjectId(entity.productId);
    if (entity.variantId) model.variant_id = new Types.ObjectId(entity.variantId);
    if (entity.stock) model.stock = new Types.ObjectId(entity.stock);
    if (entity.type) model.type = entity.type;
    if (entity.quantity !== undefined) model.quantity = entity.quantity;
    if (entity.stockBefore !== undefined) model.stock_before = entity.stockBefore;
    if (entity.stockAfter !== undefined) model.stock_after = entity.stockAfter;
    if (entity.source) model.source = entity.source;
    if (entity.status) model.status = entity.status;
    if (entity.saleId) model.sale_id = new Types.ObjectId(entity.saleId);
    if (entity.clientId) model.client_id = new Types.ObjectId(entity.clientId);
    if (entity.notes) model.notes = entity.notes;
    if (entity.prices) model.prices = entity.prices;
    if (entity.appliedPriceType) model.applied_price_type = entity.appliedPriceType as AppliedPriceTypeEnum;
    if (entity.week) model.week = entity.week;
    if (entity.month) model.month = entity.month;
    if (entity.year) model.year = entity.year;
    if (entity.operatorId) model.operator_id = new Types.ObjectId(entity.operatorId);
    if (entity.date) model.date = entity.date;
    
    return model;
  }

  static mapToUpdateManyModel(entity: Partial<StockMovementEntity>): Partial<StockMovement> {
    const model: Partial<StockMovement> = {};
    
    // For updateMany, we only include fields that should be updated
    if (entity.status !== undefined) model.status = entity.status;
    if (entity.notes !== undefined) model.notes = entity.notes;
    if (entity.prices !== undefined) model.prices = entity.prices;
    if (entity.appliedPriceType !== undefined) model.applied_price_type = entity.appliedPriceType as AppliedPriceTypeEnum;
    if (entity.operatorId !== undefined) model.operator_id = new Types.ObjectId(entity.operatorId);
    
    return model;
  }

  static mapUpdateManyResultToEntities(result: any): StockMovementEntity[] {
    if (!result || !result.modifiedCount) {
      return [];
    }

    // Si el resultado incluye los documentos modificados
    if (result.modifiedDocuments) {
      return result.modifiedDocuments.map(doc => doc.mapToEntity());
    }

    // Si solo tenemos el conteo de documentos modificados
    return [];
  }
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);

StockMovementSchema.methods.mapToEntity = function() {
  return {
    id: this._id.toString(),
    productId: this.product_id.toString(),
    variantId: this.variant_id?.toString(),
    stock: this.stock.toString(),
    type: this.type,
    quantity: this.quantity,
    stockBefore: this.stock_before,
    stockAfter: this.stock_after,
    source: this.source,
    status: this.status,
    saleId: this.sale_id?.toString(),
    clientId: this.client_id?.toString(),
    notes: this.notes,
    prices: this.prices,
    appliedPriceType: this.applied_price_type,
    week: this.week,
    month: this.month,
    year: this.year,
    date: this.date,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Índices para mejorar el rendimiento de las consultas
StockMovementSchema.index({ product_id: 1, variant_id: 1 });
StockMovementSchema.index({ date: 1 });
StockMovementSchema.index({ year: 1, month: 1 });
StockMovementSchema.index({ location_id: 1 });
StockMovementSchema.index({ type: 1 });
StockMovementSchema.index({ source: 1 }); 