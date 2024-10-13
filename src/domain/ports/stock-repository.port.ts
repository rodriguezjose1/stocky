// domain/ports/purchase-repository.port.ts
import { ReqGetStocksDto, ResGetStocksDto, Stock } from '../entities/stock.entity';

export interface StockRepositoryPort {
  findAll(query: ReqGetStocksDto): Promise<ResGetStocksDto>;
  findById(id: string): Promise<Stock | null>;
  create(stock: Stock): Promise<Stock>;
  update(id: string, stock: Partial<Stock>): Promise<Stock | null>;
  delete(id: string): Promise<boolean>;
  getByProductId(productId: string): Promise<Stock[] | null>;
  incrementStock(id: string, quantity: number): Promise<Stock | null>;
  decrementStock(id: string, quantity: number): Promise<Stock | null>;
  getStockByVariantId(variantId: string): Promise<Stock[]>;
  getByVariantAndCostPriceWithQuantity(variantId: string, costPrice: number): Promise<Stock | null>;
  getQuantityByVariantId(variantId: string): Promise<number>;
}
