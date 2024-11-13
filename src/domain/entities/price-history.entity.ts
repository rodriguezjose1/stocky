import { Prices } from './product.entity';

// domain/entities/price-history.entity.ts
export class PriceHistory {
  constructor(
    public id: string,
    public productId: string,
    public previousPrice: Prices,
    public newPrice: Prices,
    public modifiedAt: Date,
    public modifiedBy: string,
    public comments?: string,
  ) {}
}
