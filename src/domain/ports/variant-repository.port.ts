import { Variant } from '../entities/variant.entity';

export interface VariantRepositoryPort {
  findAll(): Promise<Variant[]>;
  findById(id: string): Promise<Variant | null>;
  create(stock: Variant): Promise<Variant>;
  update(id: string, stock: Partial<Variant>): Promise<Variant | null>;
  delete(id: string): Promise<boolean>;
}
