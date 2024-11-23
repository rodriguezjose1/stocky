// application/ports/email-service.interface.ts
export interface IEmailService {
  sendEmail(to: string, subject: string, template: string, data: any): Promise<void>;
}
