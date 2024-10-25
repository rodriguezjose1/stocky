// sale.module.ts
import { Module } from '@nestjs/common';
import { NotificationUseCases } from 'src/application/use-cases/notification.use-cases';
import { MailModule } from 'src/infrastructure/adapters/email-service/mail.module';

@Module({
  imports: [MailModule],
  providers: [NotificationUseCases],
  controllers: [],
  exports: [NotificationUseCases],
})
export class NotificationModule {}
