import { Controller, Param, Post } from '@nestjs/common';
import { NotificationUseCases } from '../../application/use-cases/notification.use-cases';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationUseCases) {}

  @Post('async-events/sale-created/:saleId')
  async handleSaleCreated(@Param('saleId') saleId: string) {
    return this.notificationService.handleSaleCreated(saleId);
  }
}
