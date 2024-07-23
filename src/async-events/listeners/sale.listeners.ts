import { OnEvent } from '@nestjs/event-emitter';
import { StockUseCases } from 'src/application/use-cases/stock.use-cases';
import { SaleCreatedEvent } from '../events/sale.events';
import { SalesUseCase } from 'src/application/use-cases/sale.use-cases';
import { Injectable } from '@nestjs/common';

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

    for (const detail of sale.details) {
      await this.stockUseCases.decrementStock(detail.product_id, {
        quantity: detail.quantity,
      });
    }
  }
}
