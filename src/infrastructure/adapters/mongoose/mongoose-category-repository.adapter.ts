import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CategoryRepositoryPort } from '../../../domain/ports/category-repository.port';
import { CategoryModel, CategorySchema } from '../../models/category.model';

@Injectable()
export class MongooseCategoryRepositoryAdapter
  implements CategoryRepositoryPort
{
  private categoryModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.categoryModel = this.connection.model(
      CategoryModel.name,
      CategorySchema,
    );
  }
}
