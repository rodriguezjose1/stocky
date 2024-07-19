import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StockCreatedEvent } from 'src/async-events/events/stock.events';
import { Stock } from '../../domain/entities/stock.entity';
import { StockRepositoryPort } from '../../domain/ports/stock-repository.port';

@Injectable()
export class StockUseCases {
  constructor(
    @Inject('StockRepositoryPort')
    private stockRepository: StockRepositoryPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getAllStocks(): Promise<Stock[]> {
    return this.stockRepository.findAll();
  }

  async getStockById(id: string): Promise<Stock | null> {
    return this.stockRepository.findById(id);
  }

  async createStock(stock: Stock): Promise<Stock> {
    const createdStock = await this.stockRepository.create(stock);

    this.eventEmitter.emit(
      'stock.created',
      new StockCreatedEvent(createdStock.id),
    );

    return createdStock;
  }

  async updateStock(id: string, stock: Partial<Stock>): Promise<Stock | null> {
    return this.stockRepository.update(id, stock);
  }

  async deleteStock(id: string): Promise<boolean> {
    return this.stockRepository.delete(id);
  }

  async updateProductStock(productId, quantity) {
    const stock = await this.stockRepository.getByProductId(productId);
    if (stock) {
      await this.stockRepository.incrementStock(stock.id, quantity);
    }
  }
}
