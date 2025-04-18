import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CartUseCases } from 'src/application/use-cases/cart.use-cases';
import { SalesUseCase } from 'src/application/use-cases/sale.use-cases';
import { StockUseCases } from 'src/application/use-cases/stock.use-cases';
import { SaleStatus } from 'src/domain/entities/sale.entity';
import { SaleCreatedEvent, SaleUpdatedEvent } from '../events/sale.events';
import { ErrorNotificationService } from 'src/infrastructure/adapters/email-service/error-notification.service';

@Injectable()
export class SaleListener {
  constructor(
    private stockUseCases: StockUseCases,
    private saleUseCases: SalesUseCase,
    private cartUseCases: CartUseCases,
    private readonly errorNotificationService: ErrorNotificationService,
  ) { }

  @OnEvent('sale.created')
  async handleSaleCreated(event: SaleCreatedEvent) {
    try {
      console.log('Sale created:', event.saleId);
      const sale = await this.saleUseCases.findById(event.saleId);

      // if the sale does not exist, save log to handle it
      if (!sale) {
        console.error('Sale not found:', event.saleId);
        await this.errorNotificationService.notifyError(
          new Error(`Sale not found: ${event.saleId}`),
          'SaleListener.handleSaleCreated',
          { saleId: event.saleId }
        );
        return;
      }

      const stocksUpdated = [];

      for (const detail of sale.details) {
        let decremented;
        if (!detail.isWholesalePackage) {
          decremented = await this.stockUseCases.decrementStock(detail.productId, detail.variantId, {
            quantity: detail.quantity,
          });
          stocksUpdated.push(...decremented);
        } else {
          for (const wholesaleVariant of detail.wholesaleVariants) {
            decremented = await this.stockUseCases.decrementStock(detail.productId, wholesaleVariant.variant.variantId, {
              quantity: wholesaleVariant.quantity,
            });
            stocksUpdated.push(...decremented);
          }
        }
      }

      try {
        await this.cartUseCases.updateCart({ _id: sale.cartId, active: false });
      } catch (error) {
        console.error('Error updating cart:', error);
        await this.errorNotificationService.notifyError(
          error,
          'SaleListener.handleSaleCreated.updateCart',
          { saleId: event.saleId, cartId: sale.cartId }
        );
      }

      try {
        await this.saleUseCases.updateSale(event.saleId, { stocksUpdated });
      } catch (error) {
        console.error('Error updating sale:', error);
        await this.errorNotificationService.notifyError(
          error,
          'SaleListener.handleSaleCreated.updateSale',
          { saleId: event.saleId }
        );
      }

      // TODO: fix this with correct data
      // notify to admin to accept o reject the sale
      // await this.notificationUseCases.notifyUser('rodriguezjosee8@gmail.com', `New sale: ${sale.id}`);
      // // notify to customer about the sale
      // await this.notificationUseCases.notifyUser('stocky.arg@gmail.com', `Your sale: ${sale.id}`);
    } catch (error) {
      console.error('Error in SaleListener.handleSaleCreated:', error);
      await this.errorNotificationService.notifyError(
        error,
        'SaleListener.handleSaleCreated',
        { saleId: event.saleId }
      );
    }
  }

  @OnEvent('sale.updated.status')
  async handleSaleUpdatedStatus(event: SaleUpdatedEvent) {
    try {
      console.log('Sale updated status:', event.saleId);
      const sale = await this.saleUseCases.findById(event.saleId);

      if (!sale) {
        console.error('Sale not found:', event.saleId);
        await this.errorNotificationService.notifyError(
          new Error(`Sale not found: ${event.saleId}`),
          'SaleListener.handleSaleUpdatedStatus',
          { saleId: event.saleId }
        );
        return;
      }

      if (sale.status === SaleStatus.REJECTED) {
        for (const stockUpdated of sale.stocksUpdated) {
          await this.stockUseCases.incrementStock(stockUpdated.stock, {
            quantity: stockUpdated.quantity,
          });
        }
      }
    } catch (error) {
      console.error('Error in SaleListener.handleSaleUpdatedStatus:', error);
      await this.errorNotificationService.notifyError(
        error,
        'SaleListener.handleSaleUpdatedStatus',
        { saleId: event.saleId }
      );
    }
  }
}
