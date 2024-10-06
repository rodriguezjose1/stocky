// application/use-cases/create-sale.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { Sale, SaleDetail, SaleStatus } from 'src/domain/entities/sale.entity';
import { SaleRepositoryPort } from '../../domain/ports/sale-repository.port';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SaleCreatedEvent, SaleUpdatedEvent } from 'src/async-events/events/sale.events';
import { StockUseCases } from './stock.use-cases';
import { ERROR_HANDLER_PORT, ErrorHandlerPort } from 'src/domain/ports/error-handler.port';

@Injectable()
export class SalesUseCase {
  constructor(
    @Inject('SaleRepositoryPort')
    private saleRepository: SaleRepositoryPort,
    private eventEmitter: EventEmitter2,
    private stockUseCases: StockUseCases,
    @Inject(ERROR_HANDLER_PORT) private errorHandler: ErrorHandlerPort,
  ) {}

  async createSale(saleData: Sale) {
    try {
      await this.stockUseCases.checkStock(saleData.details);

      const sale = new Sale(
        null,
        new Date(saleData.date),
        SaleStatus.PENDING,
        saleData.details.map((detail) => new SaleDetail(detail.product_id, detail.variant_id, detail.quantity, detail.unit_price)),
      );

      const createdSale = await this.saleRepository.create(sale);

      this.eventEmitter.emit('sale.created', new SaleCreatedEvent(createdSale.id));

      return createdSale;
    } catch (error) {
      console.log(error);
      throw this.errorHandler.handleError(error);
    }
  }

  async findAll(): Promise<Sale[]> {
    return this.saleRepository.findAll();
  }

  async findById(id: string): Promise<Sale | null> {
    return this.saleRepository.findById(id);
  }

  async deleteSale(id: string): Promise<boolean> {
    return this.saleRepository.delete(id);
  }

  async updateSale(id: string, sale: Partial<Sale>): Promise<Sale | null> {
    const updatedSale = await this.saleRepository.update(id, sale);

    if (updatedSale && sale.status) this.handleSaleStatusChange(sale.status, updatedSale.id);

    return updatedSale;
  }

  private handleSaleStatusChange(newStatus: SaleStatus, saleId: string): void {
    const isNewStatusValid = newStatus !== SaleStatus.PENDING;

    if (isNewStatusValid) {
      this.eventEmitter.emit('sale.updated.status', new SaleUpdatedEvent(saleId));
    }
  }
}
