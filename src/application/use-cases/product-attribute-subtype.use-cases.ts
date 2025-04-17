import { Inject, Injectable } from '@nestjs/common';
import { ProductAttributeSubtype } from '../../domain/entities/product-attribute-subtype.entity';
import { ProductAttributeSubtypeRepositoryPort } from '../../domain/ports/product-attribute-subtype-repository.port';

@Injectable()
export class ProductAttributeSubtypeUseCases {
  constructor(
    @Inject('ProductAttributeSubtypeRepositoryPort')
    private productAttributeSubtypeRepository: ProductAttributeSubtypeRepositoryPort,
  ) {}

  async getProductAttributeSubtypes(type: string, subtype?: string): Promise<ProductAttributeSubtype[]> {
    return this.productAttributeSubtypeRepository.getByType(type, subtype);
  }

  async getProductAttributeSubtypeById(id: string): Promise<ProductAttributeSubtype> {
    return this.productAttributeSubtypeRepository.getById(id);
  }

  async getProductAttributeSubtypeByValue(value: string): Promise<ProductAttributeSubtype> {
    return this.productAttributeSubtypeRepository.getByValue(value);
  }

  async createProductAttributeSubtype(data: { type: string; label_type: string; value: string }): Promise<ProductAttributeSubtype> {
    return this.productAttributeSubtypeRepository.create(data);
  }
}
