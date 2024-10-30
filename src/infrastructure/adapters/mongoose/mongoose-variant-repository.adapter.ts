import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Variant } from 'src/domain/entities/variant.entity';
import { VariantRepositoryPort } from '../../../domain/ports/variant-repository.port';
import { VariantModel, VariantSchema } from '../../models/variant.model';

export interface Filter {
  size: string;
  color: string;
}

@Injectable()
export class MongooseVariantRepositoryAdapter implements VariantRepositoryPort {
  private variantModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.variantModel = this.connection.model(VariantModel.name, VariantSchema);
  }

  async findAll(): Promise<Variant[]> {
    const variants = await this.variantModel.find().exec();
    return variants.map((variant) => this.mapToEntity(variant));
  }

  async findOneBy(filter: Filter) {
    const variant = await this.variantModel.findOne(filter);

    return variant ? this.mapToEntity(variant) : null;
  }

  async findById(id: string): Promise<Variant | null> {
    const variant = await this.variantModel.findById(id).exec();
    return variant ? this.mapToEntity(variant) : null;
  }

  async create(variant: Variant, session): Promise<Variant> {
    const newVariant: any = await this.variantModel.create([this.mapToModel(variant)], { session });
    return this.mapToEntity(newVariant[0]);
  }

  async update(id: string, variant: Partial<Variant>): Promise<Variant | null> {
    const updatedVariant = await this.variantModel.findByIdAndUpdate(id, variant, { new: true }).exec();
    return updatedVariant ? this.mapToEntity(updatedVariant) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.variantModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  private mapToEntity(variantModel: VariantModel): Variant {
    return new Variant(variantModel._id.toString(), variantModel.size, variantModel.color);
  }

  private mapToModel(variant: Partial<Variant>): Partial<VariantModel> {
    return {
      size: variant.size,
      color: variant.color,
    };
  }
}
