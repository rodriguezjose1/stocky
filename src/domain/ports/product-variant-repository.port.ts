import { ProductVariant } from '../entities/product-variant.entity';
import { Variant } from '../entities/stock.entity';

export interface ProductVariantRepositoryPort {
  findAll(): Promise<ProductVariant[]>;
  findById(id: string): Promise<ProductVariant | null>;
  create(productVariant: ProductVariant): Promise<ProductVariant>;
  createMany(productVariants: ProductVariant[]): Promise<ProductVariant[]>;
  update(id: string, productVariant: Partial<ProductVariant>): Promise<ProductVariant | null>;
  delete(id: string): Promise<boolean>;
  getProductProductVariant(productVariansDto: Variant[]): Promise<string | null>;
}
