// domain/ports/purchase-repository.port.ts
import { ReqGetStocksDto, ResGetStocksDto, Stock } from '../entities/stock.entity';

export interface StockRepositoryPort {
  findAll(query: ReqGetStocksDto): Promise<ResGetStocksDto>;
  findById(id: string): Promise<Stock | null>;
  create(stock: Stock, session): Promise<Stock>;
  update(id: string, stock: Partial<Stock>): Promise<Stock | null>;
  delete(id: string): Promise<boolean>;
  getByProductId(productId: string): Promise<Stock[] | null>;
  incrementStock(id: string, quantity: number, session): Promise<Stock | null>;
  decrementStock(id: string, quantity: number): Promise<Stock | null>;
  getStockByVariantIdAndProductId(variantId: string, productId: string): Promise<Stock[]>;
  getByVariantAndProductAndCostPriceWithQuantity(productId: string, variantId: string, costPrice: number): Promise<Stock | null>;
  getQuantityByVariantId(productId: string, variantId: string): Promise<number>;
}
