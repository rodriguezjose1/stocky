import { StockMovement } from '../entities/stock-movement.entity';
import { CreateStockMovementDto } from '../dtos/stock-movement.dto';
import { StockMovementStatus } from 'src/infrastructure/models/stock-movement.model';

export interface StockMovementRepositoryPort {
  create(movement: CreateStockMovementDto & { prices: any }): Promise<StockMovement>;
  findByProduct(
    product_id: string,
    variant_id?: string,
  ): Promise<StockMovement[]>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<StockMovement[]>;
  findByType(
    type: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StockMovement[]>;
  findBySale(sale_id: string): Promise<StockMovement[]>;
  findByClient(
    client_id: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StockMovement[]>;
  getStockHistory(
    product_id: string,
    variant_id: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StockMovement[]>;
  findById(id: string): Promise<StockMovement | null>;
  update(
    id: string,
    movement: Partial<StockMovement>,
  ): Promise<StockMovement | null>;
  delete(id: string): Promise<boolean>;
  updateStatusBySaleId(saleId: string, status: StockMovementStatus): Promise<StockMovement[]>;
} 