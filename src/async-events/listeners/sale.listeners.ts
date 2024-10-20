import { OnEvent } from '@nestjs/event-emitter';
import { StockUseCases } from 'src/application/use-cases/stock.use-cases';
import { SaleCreatedEvent, SaleUpdatedEvent } from '../events/sale.events';
import { SalesUseCase } from 'src/application/use-cases/sale.use-cases';
import { Injectable } from '@nestjs/common';
import { SaleStatus } from 'src/domain/entities/sale.entity';

@Injectable()
export class SaleListener {
  constructor(
    private stockUseCases: StockUseCases,
    private saleUseCases: SalesUseCase,
  ) {}

  @OnEvent('sale.created')
  async handleSaleCreated(event: SaleCreatedEvent) {
    console.log('Sale created:', event.saleId);
    const sale = await this.saleUseCases.findById(event.saleId);

    // if the sale does not exist, save log to handle it
    if (!sale) {
      console.log('Sale not found:', event.saleId);
      return;
    }

    const stocksUpdated = [];

    for (const detail of sale.details) {
      const decremented = await this.stockUseCases.decrementStock(detail.variantId, {
        quantity: detail.quantity,
      });

      stocksUpdated.push(...decremented);
    }

    await this.saleUseCases.updateSale(event.saleId, { stocksUpdated });
  }

  @OnEvent('sale.updated.status')
  async handleSaleUpdatedStatus(event: SaleUpdatedEvent) {
    console.log('Sale updated status:', event.saleId);
    const sale = await this.saleUseCases.findById(event.saleId);

    if (!sale) {
      console.log('Sale not found:', event.saleId);
      return;
    }

    if (sale.status === SaleStatus.REJECTED) {
      for (const stockUpdated of sale.stocksUpdated) {
        await this.stockUseCases.incrementStock(stockUpdated.stock, {
          quantity: stockUpdated.quantity,
        });
      }
    }
  }
}
