import { OnEvent } from '@nestjs/event-emitter';
import { StockUseCases } from 'src/application/use-cases/stock.use-cases';
import { PurchaseCreatedEvent } from '../events/purchase.events';
import { PurchasesUseCase } from 'src/application/use-cases/purchase.use-cases';
import { Injectable } from '@nestjs/common';
import { ErrorNotificationService } from 'src/infrastructure/adapters/email-service/error-notification.service';

@Injectable()
export class PurchaseListener {
  constructor(
    private stockUseCases: StockUseCases,
    private purchaseUseCases: PurchasesUseCase,
    private readonly errorNotificationService: ErrorNotificationService,
  ) {}

  // @OnEvent('stock.created')
  @OnEvent('purchase.created')
  async handlePurchaseCreated(event: PurchaseCreatedEvent) {
    try {
      console.log('Purchase created:', event.purchaseId);
      const purchase = await this.purchaseUseCases.findById(event.purchaseId);

      // if the purchase does not exist, save log to handle it
      if (!purchase) {
        console.error('Purchase not found:', event.purchaseId);
        await this.errorNotificationService.notifyError(
          new Error(`Purchase not found: ${event.purchaseId}`),
          'PurchaseListener.handlePurchaseCreated',
          { purchaseId: event.purchaseId }
        );
        return;
      }

      for (const detail of purchase.details) {
        await this.stockUseCases.incrementStock(detail.product_id, {
          quantity: detail.quantity,
        });
      }
    } catch (error) {
      console.error('Error in PurchaseListener.handlePurchaseCreated:', error);
      await this.errorNotificationService.notifyError(
        error,
        'PurchaseListener.handlePurchaseCreated',
        { purchaseId: event.purchaseId }
      );
    }
  }
}
