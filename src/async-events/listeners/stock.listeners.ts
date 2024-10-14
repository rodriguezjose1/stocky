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
    console.log('Stock created:', event.stockId);
    const stock = await this.stockUseCases.getStockById(event.stockId);
    if (!stock) {
      console.log('Stock not found:', event.stockId);
      return;
    }

    if (stock.quantity > 0) {
      await this.productUseCases.updateProduct(stock.product, {
        hasStock: true,
      });
    }
  }

  @OnEvent('stock.incremented')
  async handleStockIncremented(event: StockIncrementedEvent) {
    console.log('Stock incremented:', event.stockId);
    const stock = await this.stockUseCases.getStockById(event.stockId);
    const product = await this.productUseCases.getProductById(stock.product);
    if (!stock) {
      console.log('Stock not found:', event.stockId);
      return;
    }

    if (stock.quantity > 0 && !product.hasStock) {
      await this.productUseCases.updateProduct(stock.product, {
        hasStock: true,
      });
    }
  }

  @OnEvent('stock.decremented')
  async handleStockUpdated(event: StockDecrementedEvent) {
    console.log('Stocks decremented for product:', event.productId);
    const stock = await this.stockUseCases.getStockByProductId(event.productId);
    if (!stock) {
      console.log('Stock not found for product:', event.productId);
      return;
    }

    let total = 0;
    stock.forEach((stock) => {
      total += stock.quantity;
    });

    if (total === 0) {
      await this.productUseCases.updateProduct(event.productId, {
        hasStock: false,
      });
    }
  }
}
