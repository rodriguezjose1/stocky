import { Inject, Injectable } from '@nestjs/common';
import { IEmailService } from 'src/domain/ports/email-service.port';
import { SalesUseCase } from './sale.use-cases';
import { UserUseCases } from './user.use-cases';

const sbjAdmin = 'Nueva compra realizada';
const sbjCustomer = 'Gracias por tu compra';
const sbjApproved = 'Tu venta ha sido aprobada';
const sbjRejected = 'Tu venta ha sido rechazada';

@Injectable()
export class NotificationUseCases {
  constructor(
    @Inject('EmailService') private readonly emailService: IEmailService,
    private userUseCases: UserUseCases,
    private saleUseCases: SalesUseCase,
  ) {}

  private parseDate(date: Date) {
    // Convertir a zona horaria de Argentina (UTC-3)
    const argentinaDate = new Date(date.toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
    
    // Formatear con ceros a la izquierda para mejor legibilidad
    const day = argentinaDate.getDate().toString().padStart(2, '0');
    const month = (argentinaDate.getMonth() + 1).toString().padStart(2, '0');
    const year = argentinaDate.getFullYear();
    const hours = argentinaDate.getHours().toString().padStart(2, '0');
    const minutes = argentinaDate.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  async handleSaleCreated(saleId: string) {
    console.log('Sale created:', saleId);
    const sale = await this.saleUseCases.findById(saleId);

    // if the sale does not exist, save log to handle it
    if (!sale) {
      console.log('Sale not found:', saleId);
      return;
    }

    const dataSale = {
      ...sale,
      date: this.parseDate(new Date(sale.date)),
      total: sale.details.reduce((acc, detail) => {
        // Para productos normales usar retail, para mayoristas usar wholesale
        const price = detail.variantData ? detail.prices.retail : detail.prices.wholesale;
        return acc + (price * detail.quantity);
      }, 0),
    };

    // Siempre usar datos del sale.user (guest user)
    const customerEmail = sale.user.email;
    const customerName = `${sale.user.name} ${sale.user.lastname}`;
    
    console.log('Guest user sale:', customerName, customerEmail);

    const admins = await this.userUseCases.findOnlyRoleAdmins();

    // Enviar email al cliente
    await this.emailService.sendEmail(customerEmail, sbjCustomer, 'purchase-template', dataSale);

    // Enviar email a los admins
    for (const admin of admins) {
      await this.emailService.sendEmail(admin.email, sbjAdmin, 'sale-template', dataSale);
    }
  }

  async handleSaleApproved(saleId: string) {
    console.log('Sale approved:', saleId);
    const sale = await this.saleUseCases.findById(saleId);

    if (!sale) {
      console.log('Sale not found:', saleId);
      return;
    }

    const dataSale = {
      ...sale,
      date: this.parseDate(new Date()),
      total: sale.details.reduce((acc, detail) => {
        // Para productos normales usar retail, para mayoristas usar wholesale
        const price = detail.variantData ? detail.prices.retail : detail.prices.wholesale;
        return acc + (price * detail.quantity);
      }, 0),
    };

    // Enviar email al cliente
    const customerEmail = sale.user.email;
    await this.emailService.sendEmail(customerEmail, sbjApproved, 'sale-approved-template', dataSale);

    // Enviar email a los admins para registro
    const admins = await this.userUseCases.findOnlyRoleAdmins();
    for (const admin of admins) {
      await this.emailService.sendEmail(admin.email, 'Venta Aprobada - Registro Administrativo', 'admin-sale-approved-template', dataSale);
    }
  }

  async handleSaleRejected(saleId: string) {
    console.log('Sale rejected:', saleId);
    const sale = await this.saleUseCases.findById(saleId);

    if (!sale) {
      console.log('Sale not found:', saleId);
      return;
    }

    const dataSale = {
      ...sale,
      date: this.parseDate(new Date()),
      total: sale.details.reduce((acc, detail) => {
        // Para productos normales usar retail, para mayoristas usar wholesale
        const price = detail.variantData ? detail.prices.retail : detail.prices.wholesale;
        return acc + (price * detail.quantity);
      }, 0),
    };

    // Enviar email al cliente
    const customerEmail = sale.user.email;
    await this.emailService.sendEmail(customerEmail, sbjRejected, 'sale-rejected-template', dataSale);

    // Enviar email a los admins para registro
    const admins = await this.userUseCases.findOnlyRoleAdmins();
    for (const admin of admins) {
      await this.emailService.sendEmail(admin.email, 'Venta Rechazada - Registro Administrativo', 'admin-sale-rejected-template', dataSale);
    }
  }
}
