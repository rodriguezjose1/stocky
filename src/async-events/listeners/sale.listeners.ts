import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CartUseCases } from 'src/application/use-cases/cart.use-cases';
import { SalesUseCase } from 'src/application/use-cases/sale.use-cases';
import { StockUseCases } from 'src/application/use-cases/stock.use-cases';
import { SaleStatus } from 'src/domain/entities/sale.entity';
import { SaleCreatedEvent, SaleUpdatedEvent } from '../events/sale.events';
import { ErrorNotificationService } from 'src/infrastructure/adapters/email-service/error-notification.service';
import { MovementSource, StockMovementStatus, StockMovementType } from 'src/infrastructure/models/stock-movement.model';
import { StockMovementUseCases } from 'src/application/use-cases/stock-movement.use-cases';
import { NotificationUseCases } from 'src/application/use-cases/notification.use-cases';

@Injectable()
export class SaleListener {
  constructor(
    private stockUseCases: StockUseCases,
    private saleUseCases: SalesUseCase,
    private cartUseCases: CartUseCases,
    private stockMovementUseCases: StockMovementUseCases,
    private readonly errorNotificationService: ErrorNotificationService,
    private notificationUseCases: NotificationUseCases,
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
        if (!detail.isWholesalePackage || (detail.isWholesalePackage && !detail.wholesaleVariants.length)) {
          decremented = await this.stockUseCases.decrementStock(detail.productId, detail.variantId, {
            quantity: detail.quantity,
            appliedPriceType: detail.appliedPriceType
          }, sale.id, sale.user.id);
          stocksUpdated.push(...decremented);
        } else {
          for (const wholesaleVariant of detail.wholesaleVariants) {
            decremented = await this.stockUseCases.decrementStock(detail.productId, wholesaleVariant.variant.variantId, {
              quantity: wholesaleVariant.quantity,
              appliedPriceType: detail.appliedPriceType
            }, sale.id, sale.user.id);
            stocksUpdated.push(...decremented);
          }
        }
      }

      // Actualizar carrito solo si existe cartId
      if (sale.cartId) {
        try {
          await this.cartUseCases.updateCart({ _id: sale.cartId, active: false });
          console.log('Cart updated successfully:', sale.cartId);
        } catch (error) {
          console.error('Error updating cart:', error);
          // No es crítico si falla la actualización del carrito
          await this.errorNotificationService.notifyError(
            error,
            'SaleListener.handleSaleCreated.updateCart',
            { saleId: event.saleId, cartId: sale.cartId }
          );
        }
      } else {
        console.log('No cartId found in sale, skipping cart update');
      }

      try {
        await this.saleUseCases.updateSale(event.saleId, { stocksUpdated });
        console.log('Sale updated with stocksUpdated successfully');
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
        // Restaurar stock cuando se rechaza la venta
        for (const stockUpdated of sale.stocksUpdated) {
          await this.stockUseCases.incrementStock(stockUpdated.stock, {
            quantity: stockUpdated.quantity,
          }, { type: StockMovementType.IN, source: MovementSource.SALE, status: StockMovementStatus.REJECTED, saleId: sale.id, clientId: sale.user.id, appliedPriceType: stockUpdated.appliedPriceType });
        }
        
        // Enviar email de rechazo
        await this.notificationUseCases.handleSaleRejected(event.saleId);
      } else if (sale.status === SaleStatus.APPROVED) {
        // Cambiar estado del movimiento de stock a aprobado
        await this.stockMovementUseCases.udpateStockMovementStatusBySaleId(sale.id, StockMovementStatus.CONFIRMED);
        
        // Enviar email de aprobación
        await this.notificationUseCases.handleSaleApproved(event.saleId);
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
