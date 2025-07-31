// domain/ports/purchase-repository.port.ts
import { Sale } from '../entities/sale.entity';

export interface SaleRepositoryPort {
  create(purchase: Sale): Promise<Sale>;
  findAll(filter): any;
  findById(id: string): Promise<Sale | null>;
  delete(id: string): Promise<boolean>;
  update(id: string, sale: Partial<Sale>): Promise<Sale | null>;
  findLastSale(): Promise<Sale | null>;
  findSellersWithSalesInCurrentWeek(): Promise<Sale[]>;
  findProductsBySellerId(sellerId: string): Promise<any>;
  findGroupedProductsInCurrentWeek(): Promise<any>;
  findMonthlySalesStats(month?: number, year?: number): Promise<{
    totalSales: number;
    totalTransactions: number;
    totalCosts: number;
    totalProfit: number;
    totalProductsSold: number;
    averageSaleAmount: number;
    averageProfitPerTransaction: number;
  }>;
  findMonthlySalesDetail(month?: number, year?: number): Promise<any[]>;
}
