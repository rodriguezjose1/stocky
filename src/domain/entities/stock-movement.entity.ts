export enum StockMovementType {
  INCREMENT = 'INCREMENT',
  DECREMENT = 'DECREMENT',
  MODIFICATION = 'MODIFICATION'
}

export interface StockMovement {
  id?: string;
  productId: string;
  variantId: string;
  type: StockMovementType;
  previousQuantity: number;
  newQuantity: number;
  difference: number;
  costPrice: number;
  date: Date;
  reason?: string;
  userId?: string;
  referenceId?: string; // ID of the related operation (sale, purchase, etc.)
} 