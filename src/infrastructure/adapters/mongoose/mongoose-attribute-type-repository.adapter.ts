import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { AttributeTypeRepositoryPort } from '../../../domain/ports/attribute-type-repository.port';
import { AttributeTypeModel, AttributeTypeSchema } from '../../models/attribute-type.model';

@Injectable()
export class MongooseAttributeTypeRepositoryAdapter implements AttributeTypeRepositoryPort {
  private attributeTypeModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.attributeTypeModel = this.connection.model(AttributeTypeModel.name, AttributeTypeSchema);
  }
}
