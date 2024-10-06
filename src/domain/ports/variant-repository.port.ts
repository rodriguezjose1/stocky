import { Filter } from 'src/infrastructure/adapters/mongoose/mongoose-variant-repository.adapter';
import { Variant } from '../entities/variant.entity';

export interface VariantRepositoryPort {
  findAll(): Promise<Variant[]>;
  findById(id: string): Promise<Variant | null>;
  findOneBy(filter: Filter): Promise<Variant | null>;
  create(stock: Variant): Promise<Variant>;
  update(id: string, stock: Partial<Variant>): Promise<Variant | null>;
  delete(id: string): Promise<boolean>;
}
