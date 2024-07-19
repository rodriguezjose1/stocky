// domain/ports/purchase-repository.port.ts
import { Purchase } from '../entities/purchase.entity';

export interface PurchaseRepositoryPort {
  create(purchase: Purchase): Promise<Purchase>;
  findAll(): Promise<Purchase[]>;
  // Otros métodos según sea necesario...
}
