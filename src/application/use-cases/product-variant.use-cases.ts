import { Inject, Injectable } from '@nestjs/common';
import { ProductVariant } from '../../domain/entities/product-variant.entity';
import { ProductVariantRepositoryPort } from '../../domain/ports/product-variant-repository.port';
import { Variant } from 'src/domain/entities/stock.entity';

@Injectable()
export class ProductVariantUseCases {
  constructor(
    @Inject('ProductVariantRepositoryPort')
    private productVariantRepository: ProductVariantRepositoryPort,
  ) {}

  async getAllProductVariants(): Promise<ProductVariant[]> {
    return this.productVariantRepository.findAll();
  }

  async getProductVariantById(id: string): Promise<ProductVariant | null> {
    return this.productVariantRepository.findById(id);
  }

  async createProductVariant(variant: ProductVariant): Promise<ProductVariant> {
    const createdProductVariant = await this.productVariantRepository.create(variant);

    return createdProductVariant;
  }

  async createManyProductVariants(productVariants: ProductVariant[]): Promise<ProductVariant[]> {
    const createdProductVariants = await this.productVariantRepository.createMany(productVariants);

    return createdProductVariants;
  }

  async updateProductVariant(id: string, variant: Partial<ProductVariant>): Promise<ProductVariant | null> {
    return this.productVariantRepository.update(id, variant);
  }

  async deleteProductVariant(id: string): Promise<boolean> {
    return this.productVariantRepository.delete(id);
  }

  async existsProductVariant(productVariantsDto: Variant[]): Promise<string | null> {
    return this.productVariantRepository.getProductProductVariant(productVariantsDto);
  }
}
