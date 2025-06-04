import { IsEnum, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { StockMovementType, MovementSource, StockMovementStatus } from '../../infrastructure/models/stock-movement.model';

export class CreateStockMovementDto {
  @IsMongoId()
  productId: string;

  @IsMongoId()
  @IsOptional()
  variantId?: string;

  @IsMongoId()
  stock: string;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsNumber()
  quantity: number;

  @IsNumber()
  stockBefore: number;

  @IsNumber()
  stockAfter: number;

  @IsEnum(MovementSource)
  source: MovementSource;

  @IsEnum(StockMovementStatus)
  @IsOptional()
  status?: StockMovementStatus;

  @IsMongoId()
  @IsOptional()
  saleId?: string;

  @IsMongoId()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  appliedPriceType?: string;
} 