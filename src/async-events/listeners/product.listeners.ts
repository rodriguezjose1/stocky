import { OnEvent } from '@nestjs/event-emitter';
import { StockUseCases } from 'src/application/use-cases/stock.use-cases';

import { ProductCreatedEvent } from '../events/product.events';
import { ProductUseCases } from 'src/application/use-cases/product.use-cases';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductListener {
  constructor(
    private stockUseCases: StockUseCases,
    private productUseCases: ProductUseCases,
  ) {}

  @OnEvent('product.created')
  async handleProductCreated(event: ProductCreatedEvent) {
    if (!event.productId) {
      console.log('Invalid event', event);
      return;
    }
    console.log('Product created:', event.productId);
    const product = await this.productUseCases.getProductById(event.productId);

    // if the product does not exist, save log to handle it
    if (!product) {
      console.log('Product not found:', event.productId);
      return;
    }

    await this.stockUseCases.createStock({
      id: undefined,
      product_id: event.productId,
      quantity: 0,
    });
  }
}
