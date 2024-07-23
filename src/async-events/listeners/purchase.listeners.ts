import { OnEvent } from '@nestjs/event-emitter';
import { StockUseCases } from 'src/application/use-cases/stock.use-cases';
import { PurchaseCreatedEvent } from '../events/purchase.events';
import { PurchasesUseCase } from 'src/application/use-cases/purchase.use-cases';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PurchaseListener {
  constructor(
    private stockUseCases: StockUseCases,
    private purchaseUseCases: PurchasesUseCase,
  ) {}

  @OnEvent('stock.created')
  async handlePurchaseCreated(event: PurchaseCreatedEvent) {
    console.log('Purchase created:', event.purchaseId);
    const purchase = await this.purchaseUseCases.findById(event.purchaseId);

    // if the purchase does not exist, save log to handle it
    if (!purchase) {
      console.log('Purchase not found:', event.purchaseId);
      return;
    }

    for (const detail of purchase.details) {
      await this.stockUseCases.incrementStock(detail.product_id, {
        quantity: detail.quantity,
      });
    }
  }
}
