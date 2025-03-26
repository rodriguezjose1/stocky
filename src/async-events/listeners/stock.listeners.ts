import { OnEvent } from '@nestjs/event-emitter';
import { StockUseCases } from 'src/application/use-cases/stock.use-cases';
import { StockIncrementedEvent, StockDecrementedEvent, StockCreatedEvent } from '../events/stock.events';
import { Injectable } from '@nestjs/common';
import { ProductUseCases } from 'src/application/use-cases/product.use-cases';

@Injectable()
export class StockListener {
  constructor(
    private stockUseCases: StockUseCases,
    private productUseCases: ProductUseCases,
  ) {}

  @OnEvent('stock.created')
  async handleStockCreated(event: StockCreatedEvent) {
    console.log('=== STOCK CREATED ===');
    console.log('Stock ID:', event.stockId);
    const stock = await this.stockUseCases.getStockById(event.stockId);
    if (!stock) {
      console.log('Stock not found:', event.stockId);
      return;
    }

    console.log('Product ID:', stock.product);
    console.log('Variant ID:', stock.variant);
    console.log('Initial quantity:', stock.quantity);
    console.log('Cost price:', stock.costPrice);

    if (stock.quantity > 0) {
      console.log('Setting hasStock to true for product:', stock.product);
      await this.productUseCases.updateProduct(
        stock.product,
        {
          hasStock: true,
        },
        null,
      );
    }
    console.log('=== END STOCK CREATED ===\n');
  }

  @OnEvent('stock.incremented')
  async handleStockIncremented(event: StockIncrementedEvent) {
    console.log('=== STOCK INCREMENTED ===');
    console.log('Stock ID:', event.stockId);
    const stock = await this.stockUseCases.getStockById(event.stockId);
    if (!stock) {
      console.log('Stock not found:', event.stockId);
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
          await this.productUseCases.updateProduct(
            event.productId,
            {
              hasStock: false,
            },
            null,
          );
        }
      }
    } else if (stock.quantity > 0) {
      console.log('Setting hasStock to true for product:', event.productId);
      await this.productUseCases.updateProduct(
        event.productId,
        {
          hasStock: true,
        },
        null,
      );
    }
    console.log('=== END STOCK INCREMENTED ===\n');
  }

  @OnEvent('stock.decremented')
  async handleStockUpdated(event: StockDecrementedEvent) {
    console.log('=== STOCK DECREMENTED ===');
    console.log('Product ID:', event.productId);
    const stock = await this.stockUseCases.getStockByProductId(event.productId);
    if (!stock) {
      console.log('Stock not found for product:', event.productId);
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
      await this.productUseCases.updateProduct(
        event.productId,
        {
          hasStock: false,
        },
        null,
      );
    }
    console.log('=== END STOCK DECREMENTED ===\n');
  }
}
