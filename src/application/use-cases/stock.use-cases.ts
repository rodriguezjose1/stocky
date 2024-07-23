import { Inject, Injectable } from '@nestjs/common';
import { SaleDetail } from 'src/domain/entities/sale.entity';
import { InsufficientStockException } from 'src/domain/exceptions/insufficient-stock.exception';
import { Stock } from '../../domain/entities/stock.entity';
import { StockRepositoryPort } from '../../domain/ports/stock-repository.port';

@Injectable()
export class StockUseCases {
  constructor(
    @Inject('StockRepositoryPort')
    private stockRepository: StockRepositoryPort,
  ) {}

  async getAllStocks(): Promise<Stock[]> {
    return this.stockRepository.findAll();
  }

  async getStockById(id: string): Promise<Stock | null> {
    return this.stockRepository.findById(id);
  }

  async createStock(stock: Stock): Promise<Stock> {
    const createdStock = await this.stockRepository.create(stock);

    return createdStock;
  }

  async updateStock(id: string, stock: Partial<Stock>): Promise<Stock | null> {
    return this.stockRepository.update(id, stock);
  }

  async deleteStock(id: string): Promise<boolean> {
    return this.stockRepository.delete(id);
  }

  async incrementStock(productId, { quantity }) {
    const stock = await this.stockRepository.getByProductId(productId);
    if (stock) {
      await this.stockRepository.incrementStock(stock.id, quantity);
    }
  }

  async decrementStock(productId, { quantity }) {
    const stock = await this.stockRepository.getByProductId(productId);
    if (stock) {
      await this.stockRepository.decrementStock(stock.id, quantity);
    }
  }

  public async checkStock(details: SaleDetail[]): Promise<void> {
    for (const detail of details) {
      const stock = await this.stockRepository.getByProductId(
        detail.product_id,
      );
      if (!stock) {
        throw new Error(`Product with id ${detail.product_id} not found`);
      }
      if (stock.quantity < detail.quantity) {
        throw new InsufficientStockException(
          detail.product_id,
          detail.quantity,
          stock.quantity,
        );
      }
    }
  }
}
