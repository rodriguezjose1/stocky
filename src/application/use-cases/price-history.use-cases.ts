import { Inject, Injectable } from '@nestjs/common';
import { PriceHistory } from '../../domain/entities/price-history.entity';
import { PriceHistoryRepositoryPort } from '../../domain/ports/pirce-history.port';

@Injectable()
export class PriceHistoryUseCases {
  constructor(
    @Inject('PriceHistoryRepositoryPort')
    private priceHistoryRepository: PriceHistoryRepositoryPort,
  ) {}

  async getAllPriceHistories(): Promise<PriceHistory[]> {
    return this.priceHistoryRepository.findAll();
  }

  async getPriceHistoryByProductId(productId: string): Promise<PriceHistory[]> {
    return this.priceHistoryRepository.findByProductId(productId);
  }

  async createPriceHistory(priceHistory: PriceHistory): Promise<PriceHistory> {
    return this.priceHistoryRepository.create(priceHistory);
  }

  async deletePriceHistory(id: string): Promise<boolean> {
    return this.priceHistoryRepository.delete(id);
  }
}
