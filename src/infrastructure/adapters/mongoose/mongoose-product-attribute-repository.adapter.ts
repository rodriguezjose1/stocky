import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { ProductAttribute } from 'src/domain/entities/product-attribute.entity';
import { ProductAttributeRepositoryPort } from '../../../domain/ports/product-attribute-repository.port';
import { ProductAttributeModel, ProductAttributeSchema } from '../../models/product-attribute.model';

@Injectable()
export class MongooseProductAttributeRepositoryAdapter implements ProductAttributeRepositoryPort {
  private productAttributeModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.productAttributeModel = this.connection.model(ProductAttributeModel.name, ProductAttributeSchema);
  }

  async getByType(type: string, subtype?: string): Promise<any[]> {
    const filter: any = { type };
    if (subtype) {
      filter.subtype = subtype;
    }

    let productAttributes = [];
    if (type !== 'size') {
      productAttributes = await this.productAttributeModel.find(filter).sort({ label: 1 }).exec();
    } else {
      productAttributes = await this.productAttributeModel.find(filter).exec();
    }

    return productAttributes.map((productAttribute) => this.mapToEntity(productAttribute));
  }

  async getById(id: string): Promise<ProductAttribute> {
    const productAttribute = await this.productAttributeModel.findById(id).exec();
    return this.mapToEntity(productAttribute);
  }

  async getByValue(value: string): Promise<ProductAttribute> {
    const productAttribute = await this.productAttributeModel.findOne({ value }).exec();
    return productAttribute ? this.mapToEntity(productAttribute) : null;
  }

  mapToEntity(productAttributeModel: ProductAttributeModel): ProductAttribute {
    return {
      id: productAttributeModel._id.toString(),
      type: productAttributeModel.type,
      subtype: productAttributeModel.subtype,
      value: productAttributeModel.value,
      label: productAttributeModel.label,
    };
  }
}
