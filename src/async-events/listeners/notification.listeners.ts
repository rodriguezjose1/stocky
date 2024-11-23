import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationUseCases } from 'src/application/use-cases/notification.use-cases';
import { SaleCreatedEvent } from '../events/sale.events';

@Injectable()
export class NotificationListener {
  constructor(private notificationUseCases: NotificationUseCases) {}

  @OnEvent('sale.created')
  async handleSaleCreated(event: SaleCreatedEvent) {
    await this.notificationUseCases.handleSaleCreated(event.saleId);
  }
}
