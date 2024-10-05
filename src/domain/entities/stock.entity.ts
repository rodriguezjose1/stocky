import { Product } from './product.entity';

export class Stock {
  constructor(
    public id: string,
    public productId: string,
    public variantId: string,
    public quantity: number,
    public costPrice: number,
    public date: Date,
    public product?: Partial<Product>,
    public productVariant?: Partial<Variant>[],
  ) {}
}

export class Variant {
  constructor(
    public attributeType: string,
    public attributeValue: string,
  ) {}
}

export class UpdateStockDto {
  constructor(
    public product_id: string,
    public variant: Variant[],
    public quantity: number,
    public cost_price: number,
    public date: Date,
  ) {}
}
