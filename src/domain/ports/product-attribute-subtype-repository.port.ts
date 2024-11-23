import { ProductAttributeSubtype } from '../entities/product-attribute-subtype.entity';

export interface ProductAttributeSubtypeRepositoryPort {
  getByType(type: string, subtype?: string): Promise<any[]>;
  getById(id: string): Promise<ProductAttributeSubtype>;
  getByValue(value: string): Promise<ProductAttributeSubtype>;
}
