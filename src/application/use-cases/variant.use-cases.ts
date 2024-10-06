import { Inject, Injectable } from '@nestjs/common';
import { Variant } from '../../domain/entities/variant.entity';
import { VariantRepositoryPort } from '../../domain/ports/variant-repository.port';
import { Filter } from 'src/infrastructure/adapters/mongoose/mongoose-variant-repository.adapter';

@Injectable()
export class VariantUseCases {
  constructor(
    @Inject('VariantRepositoryPort')
    private variantRepository: VariantRepositoryPort,
  ) {}

  async getAllVariants(): Promise<Variant[]> {
    return this.variantRepository.findAll();
  }

  async getOneBy(filter: Filter): Promise<Variant> {
    return this.variantRepository.findOneBy(filter);
  }

  async getVariantById(id: string): Promise<Variant | null> {
    return this.variantRepository.findById(id);
  }

  async createVariant(variant: Variant): Promise<Variant> {
    const createdVariant = await this.variantRepository.create(variant);

    return createdVariant;
  }

  async updateVariant(id: string, variant: Partial<Variant>): Promise<Variant | null> {
    return this.variantRepository.update(id, variant);
  }

  async deleteVariant(id: string): Promise<boolean> {
    return this.variantRepository.delete(id);
  }
}
