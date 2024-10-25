// infrastructure/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { NodemailerService } from './nodemailer.adapter';

@Module({
  providers: [
    {
      provide: 'EmailService',
      useClass: NodemailerService,
    },
  ],
  exports: ['EmailService'],
})
export class MailModule {}
