import { DomainException } from './domain-exception';

export class InsufficientStockException extends DomainException {
  constructor(
    productId: string,
    requestedQuantity: number,
    availableStock: number,
  ) {
    super(
      `Insufficient stock for product ${productId}. Requested: ${requestedQuantity}, Available: ${availableStock}`,
    );
    this.name = 'InsufficientStockException';
  }
}
