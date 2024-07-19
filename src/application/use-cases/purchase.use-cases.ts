// application/use-cases/create-purchase.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import {
  Purchase,
  PurchaseDetail,
} from '../../domain/entities/purchase.entity';
import { PurchaseRepositoryPort } from '../../domain/ports/purchase-repository.port';

@Injectable()
export class CreatePurchaseUseCase {
  constructor(
    @Inject('PurchaseRepositoryPort')
    private purchaseRepository: PurchaseRepositoryPort,
  ) {}

  async createPurchase(purchaseData: {
    date: string;
    details: { product_id: string; quantity: number; unit_price: number }[];
  }): Promise<Purchase> {
    const purchase = new Purchase(
      undefined, // El ID se generará en la base de datos
      new Date(purchaseData.date),
      purchaseData.details.map(
        (detail) =>
          new PurchaseDetail(
            detail.product_id,
            detail.quantity,
            detail.unit_price,
          ),
      ),
    );

    return this.purchaseRepository.create(purchase);
  }

  async findAll(): Promise<Purchase[]> {
    return this.purchaseRepository.findAll();
  }
}
