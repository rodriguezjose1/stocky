import { PostProductAttributeDto, ProductAttribute } from '../entities/product-attribute.entity';

export interface ProductAttributeRepositoryPort {
  getByType(type: string, subtype?: string): Promise<any[]>;
  getById(id: string): Promise<ProductAttribute>;
  getByValue(value: string): Promise<ProductAttribute>;
  getByLabel(label: string): Promise<ProductAttribute>;
  create(productAttribute: PostProductAttributeDto): Promise<ProductAttribute>;
}
