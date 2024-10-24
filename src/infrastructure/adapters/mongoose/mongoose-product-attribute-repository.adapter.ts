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

  getByType(type: string, subtype?: string): Promise<any[]> {
    const filter: any = { type };
    if (subtype) {
      filter.subtype = subtype;
    }
    return this.productAttributeModel.find(filter);
  }

  mapToEntity(productAttributeModel: ProductAttributeModel): ProductAttribute {
    return {
      id: productAttributeModel._id.toString(),
      type: productAttributeModel.type,
      subtype: productAttributeModel.subtype,
      value: productAttributeModel.value,
    };
  }
}
