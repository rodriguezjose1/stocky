import { PriceHistory } from '../entities/price-history.entity';

export interface PriceHistoryRepositoryPort {
  findAll(): Promise<PriceHistory[]>;
  findByProductId(productId: string): Promise<PriceHistory[]>;
  create(priceHistory: PriceHistory): Promise<PriceHistory>;
  delete(id: string): Promise<boolean>;
}
