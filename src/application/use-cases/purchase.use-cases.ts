// application/use-cases/create-purchase.use-case.ts
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PurchaseCreatedEvent } from 'src/async-events/events/purchase.events';
import { Purchase, PurchaseDetail } from '../../domain/entities/purchase.entity';
import { PurchaseRepositoryPort } from '../../domain/ports/purchase-repository.port';

@Injectable()
export class PurchasesUseCase {
  constructor(
    @Inject('PurchaseRepositoryPort')
    private purchaseRepository: PurchaseRepositoryPort,
    private eventEmitter: EventEmitter2,
  ) {}

  async createPurchase(purchaseData: { date: string; details: { product_id: string; quantity: number; unit_price: number }[] }): Promise<Purchase> {
    const purchase = new Purchase(
      undefined, // El ID se generará en la base de datos
      new Date(purchaseData.date),
      purchaseData.details.map((detail) => new PurchaseDetail(detail.product_id, detail.quantity, detail.unit_price)),
    );

    const savedPurchase = await this.purchaseRepository.create(purchase);

    this.eventEmitter.emit('stock.created', new PurchaseCreatedEvent(savedPurchase.id));

    return savedPurchase;
  }

  async findAll(): Promise<Purchase[]> {
    return this.purchaseRepository.findAll();
  }

  async findById(id: string): Promise<Purchase | null> {
    return this.purchaseRepository.findById(id);
  }
}
