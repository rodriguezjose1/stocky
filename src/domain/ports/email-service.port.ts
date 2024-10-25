// application/ports/email-service.interface.ts
export interface IEmailService {
  sendEmail(to: string, subject: string, content: string): Promise<void>;
}
