import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { ProductVariantRepositoryPort } from '../../../domain/ports/product-variant-repository.port';
import { ProductVariantModel, ProductVariantSchema } from '../../models/product-variant.model';
import { ProductVariant } from 'src/domain/entities/product-variant.entity';
import { Variant } from 'src/domain/entities/stock.entity';

@Injectable()
export class MongooseProductVariantRepositoryAdapter implements ProductVariantRepositoryPort {
  private productVariantModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.productVariantModel = this.connection.model(ProductVariantModel.name, ProductVariantSchema);
  }

  async findAll(): Promise<ProductVariant[]> {
    const variants = await this.productVariantModel.find().exec();
    return variants.map((variant) => this.mapToEntity(variant));
  }

  async getProductProductVariant(productVariantsDto: Variant[]): Promise<string | null> {
    const or = productVariantsDto.map((variant) => ({
      attribute_type: variant.attributeType,
      attribute_value: variant.attributeValue,
    }));
    const productVariants = await this.productVariantModel.find({
      $or: or,
    });

    return productVariants.length === productVariantsDto.length ? productVariants[0].variant_id.toString() : null;
  }

  async findById(id: string): Promise<ProductVariant | null> {
    const variant = await this.productVariantModel.findById(id).exec();
    return variant ? this.mapToEntity(variant) : null;
  }

  async create(variant: ProductVariant): Promise<ProductVariant> {
    const newVariant = new this.productVariantModel(variant);
    const savedVariant = await newVariant.save();
    return this.mapToEntity(savedVariant);
  }

  async createMany(productVariants: ProductVariant[]): Promise<ProductVariant[]> {
    const savedProductVariants = await this.productVariantModel.create(productVariants);

    return savedProductVariants.map((variant) => this.mapToEntity(variant));
  }

  async update(id: string, variant: Partial<ProductVariant>): Promise<ProductVariant | null> {
    const updatedVariant = await this.productVariantModel.findByIdAndUpdate(id, variant, { new: true }).exec();
    return updatedVariant ? this.mapToEntity(updatedVariant) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.productVariantModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  private mapToEntity(productVariantModel: ProductVariantModel): ProductVariant {
    return new ProductVariant(
      productVariantModel._id.toString(),
      productVariantModel.variant_id.toString(),
      productVariantModel.attribute_type.toString(),
      productVariantModel.attribute_value,
    );
  }
}
