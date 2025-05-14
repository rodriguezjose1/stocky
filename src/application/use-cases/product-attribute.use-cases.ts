import { Inject, Injectable } from '@nestjs/common';
import { PostProductAttributeDto, ProductAttribute } from '../../domain/entities/product-attribute.entity';
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

  // todo: this is bad, it needs to be refactored
  async getProductAttributeByLabel(label: string): Promise<ProductAttribute> {
    return this.productAttributeRepository.getByLabel(label);
  }

  async createProductAttribute(productAttribute: PostProductAttributeDto): Promise<ProductAttribute> {
    productAttribute.value = this.getValue(productAttribute.label);
    return this.productAttributeRepository.create(productAttribute);
  }

  private getValue(input: string): string {
    return input.toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
}
