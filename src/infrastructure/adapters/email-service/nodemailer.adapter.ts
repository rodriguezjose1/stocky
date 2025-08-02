// infrastructure/adapters/nodemailer.service.ts
import { InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { IEmailService } from 'src/domain/ports/email-service.port';

export class NodemailerService implements IEmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Registrar el helper startsWith para detectar usuarios invitados
    Handlebars.registerHelper('startsWith', function(str, prefix) {
      return str && str.startsWith(prefix);
    });

    // Registrar el helper multiply para calcular totales
    Handlebars.registerHelper('multiply', function(a, b) {
      return a * b;
    });
  }

  // Función para cargar y compilar templates
  private async loadTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    const templatePath = path.join(__dirname, '../../../../src/infrastructure/adapters/email-service/templates', `${templateName}.hbs`);
    const templateSource = await fs.promises.readFile(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateSource);
    return compiledTemplate(data);
  }

  async sendEmail(to: string, subject: string, template: string, data): Promise<void> {
    const html = await this.loadTemplate(template, data);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new InternalServerErrorException('Error sending email');
    }
  }
}
