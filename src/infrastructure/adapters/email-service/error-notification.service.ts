import { Injectable, Inject } from '@nestjs/common';
import { IEmailService } from 'src/domain/ports/email-service.port';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ErrorNotificationService {
  private readonly errorRecipients: string[];

  constructor(
    @Inject('EmailService') private readonly emailService: IEmailService,
    private readonly configService: ConfigService,
  ) {
    // Obtener los destinatarios desde la variable de entorno
    const recipientsEnv = this.configService.get<string>('ERROR_NOTIFICATION_RECIPIENTS');
    this.errorRecipients = recipientsEnv ? recipientsEnv.split(',').map(email => email.trim()) : [];
  }

  async notifyError(error: Error, context: string, additionalData?: any): Promise<void> {
    try {
      if (this.errorRecipients.length === 0) {
        console.warn('No error notification recipients configured. Set ERROR_NOTIFICATION_RECIPIENTS environment variable.');
        return;
      }

      const subject = `Error en ${context}`;
      const data = {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        context,
        additionalData: additionalData || {},
        timestamp: new Date().toISOString(),
      };

      // Enviar el email a todos los destinatarios
      await Promise.all(
        this.errorRecipients.map(recipient =>
          this.emailService.sendEmail(
            recipient,
            subject,
            'error-notification',
            data
          )
        )
      );
    } catch (emailError) {
      // Si falla el envío de email, al menos registramos el error original
      console.error('Error al enviar notificación de error:', emailError);
      console.error('Error original:', error);
    }
  }
} 