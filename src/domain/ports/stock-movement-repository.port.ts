import { StockMovement } from '../entities/stock-movement.entity';

export interface StockMovementRepositoryPort {
  create(movement: StockMovement): Promise<StockMovement>;
  findByProductId(productId: string): Promise<StockMovement[]>;
  findByVariantId(variantId: string): Promise<StockMovement[]>;
  findByProductIdAndVariantId(productId: string, variantId: string): Promise<StockMovement[]>;
  findById(id: string): Promise<StockMovement | null>;
} 