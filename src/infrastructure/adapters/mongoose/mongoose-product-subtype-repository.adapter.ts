import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { ProductAttributeSubtype } from 'src/domain/entities/product-attribute-subtype.entity';
import { ProductAttributeSubtypeRepositoryPort } from '../../../domain/ports/product-attribute-subtype-repository.port';
import { ProductAttributeSubtypeModel, ProductAttributeSubtypeSchema } from '../../models/product-attribute-subtype.model';

@Injectable()
export class MongooseProductAttributeSubtypeRepositoryAdapter implements ProductAttributeSubtypeRepositoryPort {
  private productAttributeModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.productAttributeModel = this.connection.model(ProductAttributeSubtypeModel.name, ProductAttributeSubtypeSchema);
  }

  async getByType(type: string, subtype?: string): Promise<any[]> {
    const filter: any = { type };
    if (subtype) {
      filter.subtype = subtype;
    }
    const productAttributes = await this.productAttributeModel.find(filter).exec();
    return productAttributes.map((productAttribute) => this.mapToEntity(productAttribute));
  }

  async getById(id: string): Promise<ProductAttributeSubtype> {
    const productAttributeSubtype = await this.productAttributeModel.findById(id).exec();
    return this.mapToEntity(productAttributeSubtype);
  }

  async getByValue(value: string): Promise<ProductAttributeSubtype> {
    const productAttributeSubtype = await this.productAttributeModel.findOne({ value }).exec();
    return this.mapToEntity(productAttributeSubtype);
  }

  mapToEntity(productAttributeModel: Partial<ProductAttributeSubtypeModel>): ProductAttributeSubtype {
    return {
      id: productAttributeModel._id.toString(),
      type: productAttributeModel.type,
      value: productAttributeModel.value,
      label: productAttributeModel.label,
    };
  }
}
