import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StockUseCases } from 'src/application/use-cases/stock.use-cases';
import { ProductUseCases } from 'src/application/use-cases/product.use-cases';
import { ErrorNotificationService } from 'src/infrastructure/adapters/email-service/error-notification.service';

import { ProductCreatedEvent } from '../events/product.events';

@Injectable()
export class ProductListener {
  constructor(
    private readonly stockUseCases: StockUseCases,
    private readonly productUseCases: ProductUseCases,
    private readonly errorNotificationService: ErrorNotificationService,
  ) {}

  @OnEvent('product.created')
  async handleProductCreated(payload: { id: string }) {
    try {
      console.log('Product created event received:', payload);
      const product = await this.productUseCases.getProductById(payload.id);
      if (!product) {
        console.error(`Product with id ${payload.id} not found`);
        return;
      }
      
      // Crear el stock inicial para el producto
      await this.stockUseCases.createStock({
        product: payload.id,
        quantity: product.quantity || 0,
        costPrice: product.prices?.cost || 0,
        date: new Date(),
        variant: {
          id: 'default',
          size: 'default',
          color: 'default'
        }
      });
    } catch (error) {
      console.error('Error in ProductListener.handleProductCreated:', error);
      await this.errorNotificationService.notifyError(
        error,
        'ProductListener.handleProductCreated',
        { productId: payload.id }
      );
    }
  }
}
