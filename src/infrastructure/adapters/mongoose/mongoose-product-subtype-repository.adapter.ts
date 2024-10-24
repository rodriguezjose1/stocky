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

  mapToEntity(productAttributeModel: ProductAttributeSubtypeModel): ProductAttributeSubtype {
    return {
      id: productAttributeModel._id.toString(),
      type: productAttributeModel.type,
      value: productAttributeModel.value,
    };
  }
}
