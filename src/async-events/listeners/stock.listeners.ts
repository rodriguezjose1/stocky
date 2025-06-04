import { OnEvent } from '@nestjs/event-emitter';
import { StockUseCases } from 'src/application/use-cases/stock.use-cases';
import { StockIncrementedEvent, StockDecrementedEvent, StockCreatedEvent } from '../events/stock.events';
import { Injectable } from '@nestjs/common';
import { ProductUseCases } from 'src/application/use-cases/product.use-cases';
import { ErrorNotificationService } from 'src/infrastructure/adapters/email-service/error-notification.service';

@Injectable()
export class StockListener {
  constructor(
    private stockUseCases: StockUseCases,
    private productUseCases: ProductUseCases,
    private readonly errorNotificationService: ErrorNotificationService,
  ) { }

  @OnEvent('stock.created')
  async handleStockCreated(event: StockCreatedEvent) {
    try {
      console.log('=== STOCK CREATED ===');
      console.log('Stock ID:', event.stockId);
      const stock = await this.stockUseCases.getStockById(event.stockId);
      if (!stock) {
        console.error('Stock not found:', event.stockId);
        await this.errorNotificationService.notifyError(
          new Error(`Stock not found: ${event.stockId}`),
          'StockListener.handleStockCreated',
          { stockId: event.stockId }
        );
        return;
      }

      console.log('Product ID:', stock.product);
      console.log('Variant ID:', stock.variant);
      console.log('Initial quantity:', stock.quantity);
      console.log('Cost price:', stock.costPrice);

      if (stock.quantity > 0) {
        console.log('Setting hasStock to true for product:', stock.product);
        await this.productUseCases.updatePartialProduct(
          stock.product,
          {
            hasStock: true,
          },
        );
      }
      console.log('=== END STOCK CREATED ===\n');
    } catch (error) {
      console.error('Error in StockListener.handleStockCreated:', error);
      await this.errorNotificationService.notifyError(
        error,
        'StockListener.handleStockCreated',
        { stockId: event.stockId }
      );
    }
  }

  @OnEvent('stock.incremented')
  async handleStockIncremented(event: StockIncrementedEvent) {
    try {
      console.log('=== STOCK INCREMENTED ===');
      console.log('Stock ID:', event.stockId);
      const stock = await this.stockUseCases.getStockById(event.stockId);
      if (!stock) {
        console.error('Stock not found:', event.stockId);
        await this.errorNotificationService.notifyError(
          new Error(`Stock not found: ${event.stockId}`),
          'StockListener.handleStockIncremented',
          { stockId: event.stockId }
        );
        return;
      }

      console.log('Product ID:', event.productId);
      console.log('Variant ID:', stock.variant);
      console.log('Previous quantity:', stock.quantity - event.quantity);
      console.log('Change amount:', event.quantity);
      console.log('Current quantity:', stock.quantity);
      console.log('Cost price:', stock.costPrice);

      // If quantity is negative, check total stock for the product
      if (stock.quantity <= 0) {
        console.log('Stock quantity is 0 or negative, checking total stock for product');
        const allStocks = await this.stockUseCases.getStockByProductId(event.productId);
        if (allStocks) {
          const totalStock = allStocks.reduce((sum, s) => sum + s.quantity, 0);
          console.log('Total stock for product:', totalStock);
          if (totalStock <= 0) {
            console.log('Setting hasStock to false for product:', event.productId);
            await this.productUseCases.updatePartialProduct(
              event.productId,
              {
                hasStock: false,
              },
            );
          }
        }
      } else if (stock.quantity > 0) {
        console.log('Setting hasStock to true for product:', event.productId);
        await this.productUseCases.updatePartialProduct(
          event.productId,
          {
            hasStock: true,
          },
        );
      }
      console.log('=== END STOCK INCREMENTED ===\n');
    } catch (error) {
      console.error('Error in StockListener.handleStockIncremented:', error);
      await this.errorNotificationService.notifyError(
        error,
        'StockListener.handleStockIncremented',
        { stockId: event.stockId, productId: event.productId }
      );
    }
  }

  @OnEvent('stock.decremented')
  async handleStockUpdated(event: StockDecrementedEvent) {
    try {
      console.log('=== STOCK DECREMENTED ===');
      console.log('Product ID:', event.productId);
      const stock = await this.stockUseCases.getStockByProductId(event.productId);
      if (!stock) {
        console.error('Stock not found for product:', event.productId);
        await this.errorNotificationService.notifyError(
          new Error(`Stock not found for product: ${event.productId}`),
          'StockListener.handleStockUpdated',
          { productId: event.productId }
        );
        return;
      }

      console.log('Stocks affected:', stock.length);
      stock.forEach((s, index) => {
        console.log(`Stock ${index + 1}:`);
        console.log('- Variant ID:', s.variant);
        console.log('- Previous quantity:', s.quantity + event.quantity);
        console.log('- Change amount:', -event.quantity);
        console.log('- Current quantity:', s.quantity);
        console.log('- Cost price:', s.costPrice);
      });

      let total = 0;
      stock.forEach((stock) => {
        total += stock.quantity;
      });
      console.log('Total stock after decrement:', total);

      if (total === 0) {
        console.log('Setting hasStock to false for product:', event.productId);
        await this.productUseCases.updatePartialProduct(
          event.productId,
          {
            hasStock: false,
          },
        );
      }
      console.log('=== END STOCK DECREMENTED ===\n');
    } catch (error) {
      console.error('Error in StockListener.handleStockUpdated:', error);
      await this.errorNotificationService.notifyError(
        error,
        'StockListener.handleStockUpdated',
        { productId: event.productId }
      );
    }
  }
}
