import { Inject, Injectable } from '@nestjs/common';
import { ProductAttribute } from '../../domain/entities/product-attribute.entity';
import { ProductAttributeRepositoryPort } from '../../domain/ports/product-attribute-repository.port';

@Injectable()
export class ProductAttributeUseCases {
  constructor(
    @Inject('ProductAttributeRepositoryPort')
    private productAttributeRepository: ProductAttributeRepositoryPort,
  ) {}

  async getProductAttributes(type: string, subtype?: string): Promise<ProductAttribute[]> {
    return this.productAttributeRepository.getByType(type, subtype);
  }

  async getProductAttributeById(id: string): Promise<ProductAttribute> {
    return this.productAttributeRepository.getById(id);
  }

  async getProductAttributeByValue(value: string): Promise<ProductAttribute> {
    return this.productAttributeRepository.getByValue(value);
  }
}
