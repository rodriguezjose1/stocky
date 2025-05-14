import { StockMovementType, MovementSource, StockMovementStatus } from '../../infrastructure/models/stock-movement.model';

export interface StockMovement {
  id: string;
  productId: string;
  variantId?: string;
  stock: string;
  type: StockMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  source: MovementSource;
  saleId?: string;
  clientId?: string;
  notes?: string;
  prices?: any;
  appliedPriceType?: string;
  week?: number;
  month?: number;
  year?: number;
  createdAt?: Date;
  updatedAt?: Date;
  status?: StockMovementStatus;
  operatorId?: string;
  date?: Date;
} 