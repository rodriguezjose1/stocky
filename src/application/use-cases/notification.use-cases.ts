import { Inject, Injectable } from '@nestjs/common';
import { IEmailService } from 'src/domain/ports/email-service.port';

@Injectable()
export class NotificationUseCases {
  constructor(@Inject('EmailService') private readonly emailService: IEmailService) {}

  async notifyUser(email: string, message: string): Promise<void> {
    await this.emailService.sendEmail(email, 'Notification', message);
  }
}
