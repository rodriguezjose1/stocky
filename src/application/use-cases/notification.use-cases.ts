import { Inject, Injectable } from '@nestjs/common';
import { IEmailService } from 'src/domain/ports/email-service.port';
import { SalesUseCase } from './sale.use-cases';
import { UserUseCases } from './user.use-cases';

const sbjAdmin = 'Nueva compra realizada';
const sbjCustomer = 'Gracias por tu compra';

@Injectable()
export class NotificationUseCases {
  constructor(
    @Inject('EmailService') private readonly emailService: IEmailService,
    private userUseCases: UserUseCases,
    private saleUseCases: SalesUseCase,
  ) {}

  private parseDate(date: Date) {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
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
      total: sale.details.reduce((acc, detail) => acc + detail.prices.reseller * detail.quantity, 0),
    };

    const customer = await this.userUseCases.getUserById(sale.user.id);
    const admins = await this.userUseCases.findOnlyRoleAdmins();

    await this.emailService.sendEmail(customer.email, sbjCustomer, 'purchase-template', dataSale);

    for (const admin of admins) {
      await this.emailService.sendEmail(admin.email, sbjAdmin, 'sale-template', dataSale);
    }
  }
}
