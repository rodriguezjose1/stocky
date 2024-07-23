// domain/ports/purchase-repository.port.ts
import { Sale } from '../entities/sale.entity';

export interface SaleRepositoryPort {
  create(purchase: Sale): Promise<Sale>;
  findAll(): Promise<Sale[]>;
  findById(id: string): Promise<Sale | null>;
  delete(id: string): Promise<boolean>;
  update(id: string, sale: Partial<Sale>): Promise<Sale | null>;
}
