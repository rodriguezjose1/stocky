// sale.module.ts
import { Module } from '@nestjs/common';
import { NotificationUseCases } from 'src/application/use-cases/notification.use-cases';
import { MailModule } from 'src/infrastructure/adapters/email-service/mail.module';
import { NotificationController } from 'src/interfaces/http/notification.controller';
import { UserModule } from './user.module';
import { SaleModule } from './sale.module';

@Module({
  imports: [MailModule, UserModule, SaleModule],
  providers: [NotificationUseCases],
  controllers: [NotificationController],
  exports: [NotificationUseCases],
})
export class NotificationModule {}
