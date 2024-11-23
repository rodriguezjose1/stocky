import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CartUseCases } from 'src/application/use-cases/cart.use-cases';
import { SalesUseCase } from 'src/application/use-cases/sale.use-cases';
import { StockUseCases } from 'src/application/use-cases/stock.use-cases';
import { SaleStatus } from 'src/domain/entities/sale.entity';
import { SaleCreatedEvent, SaleUpdatedEvent } from '../events/sale.events';

@Injectable()
export class SaleListener {
  constructor(
    private stockUseCases: StockUseCases,
    private saleUseCases: SalesUseCase,
    private cartUseCases: CartUseCases,
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
      const decremented = await this.stockUseCases.decrementStock(detail.productId, detail.variantId, {
        quantity: detail.quantity,
      });

      stocksUpdated.push(...decremented);
    }

    await this.cartUseCases.updateCart({ _id: sale.cartId, active: false });

    await this.saleUseCases.updateSale(event.saleId, { stocksUpdated });

    // TODO: fix this with correct data
    // notify to admin to accept o reject the sale
    // await this.notificationUseCases.notifyUser('rodriguezjosee8@gmail.com', `New sale: ${sale.id}`);
    // // notify to customer about the sale
    // await this.notificationUseCases.notifyUser('stocky.arg@gmail.com', `Your sale: ${sale.id}`);
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
