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

  getByType(type: string, subtype?: string): Promise<any[]> {
    const filter: any = { type };
    if (subtype) {
      filter.subtype = subtype;
    }
    return this.productAttributeModel.find(filter);
  }

  async getById(id: string): Promise<ProductAttributeSubtype> {
    const productAttributeSubtype = await this.productAttributeModel.findById(id).exec();
    return this.mapToEntity(productAttributeSubtype);
  }

  async getByValue(value: string): Promise<ProductAttributeSubtype> {
    const productAttributeSubtype = await this.productAttributeModel.findOne({ value }).exec();
    return this.mapToEntity(productAttributeSubtype);
  }

  async create(data: { type: string; label_type: string; value: string }): Promise<ProductAttributeSubtype> {
    const productAttributeSubtype = await this.productAttributeModel.create(data);
    return this.mapToEntity(productAttributeSubtype);
  }

  mapToEntity(productAttributeModel: ProductAttributeSubtypeModel): ProductAttributeSubtype {
    return {
      id: productAttributeModel._id.toString(),
      type: productAttributeModel.type,
      value: productAttributeModel.value,
    };
  }
}
