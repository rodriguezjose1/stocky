import { Injectable, Inject } from '@nestjs/common';
import { StockMovement, StockMovementType } from '../../domain/entities/stock-movement.entity';
import { StockMovementRepositoryPort } from '../../domain/ports/stock-movement-repository.port';

@Injectable()
export class StockMovementUseCases {
  constructor(
    @Inject('StockMovementRepositoryPort')
    private stockMovementRepository: StockMovementRepositoryPort,
  ) {}

  async createStockMovement(movement: StockMovement): Promise<StockMovement> {
    return this.stockMovementRepository.create(movement);
  }

  async getMovementsByProductId(productId: string): Promise<StockMovement[]> {
    return this.stockMovementRepository.findByProductId(productId);
  }

  async getMovementsByVariantId(variantId: string): Promise<StockMovement[]> {
    return this.stockMovementRepository.findByVariantId(variantId);
  }

  async getMovementsByProductAndVariant(productId: string, variantId: string): Promise<StockMovement[]> {
    return this.stockMovementRepository.findByProductIdAndVariantId(productId, variantId);
  }

  async getMovementById(id: string): Promise<StockMovement | null> {
    return this.stockMovementRepository.findById(id);
  }

  async createIncrementMovement(
    productId: string,
    variantId: string,
    previousQuantity: number,
    newQuantity: number,
    costPrice: number,
    reason?: string,
    userId?: string,
    referenceId?: string,
  ): Promise<StockMovement> {
    const movement: StockMovement = {
      productId,
      variantId,
      type: StockMovementType.INCREMENT,
      previousQuantity,
      newQuantity,
      difference: newQuantity - previousQuantity,
      costPrice,
      date: new Date(),
      reason,
      userId,
      referenceId,
    };

    return this.createStockMovement(movement);
  }

  async createDecrementMovement(
    productId: string,
    variantId: string,
    previousQuantity: number,
    newQuantity: number,
    costPrice: number,
    reason?: string,
    userId?: string,
    referenceId?: string,
  ): Promise<StockMovement> {
    const movement: StockMovement = {
      productId,
      variantId,
      type: StockMovementType.DECREMENT,
      previousQuantity,
      newQuantity,
      difference: newQuantity - previousQuantity,
      costPrice,
      date: new Date(),
      reason,
      userId,
      referenceId,
    };

    return this.createStockMovement(movement);
  }

  async createModificationMovement(
    productId: string,
    variantId: string,
    previousQuantity: number,
    newQuantity: number,
    costPrice: number,
    reason?: string,
    userId?: string,
    referenceId?: string,
  ): Promise<StockMovement> {
    const movement: StockMovement = {
      productId,
      variantId,
      type: StockMovementType.MODIFICATION,
      previousQuantity,
      newQuantity,
      difference: newQuantity - previousQuantity,
      costPrice,
      date: new Date(),
      reason,
      userId,
      referenceId,
    };

    return this.createStockMovement(movement);
  }
} 