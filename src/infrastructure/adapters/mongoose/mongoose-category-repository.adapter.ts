import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CategoryRepositoryPort } from '../../../domain/ports/category-repository.port';
import { CategoryModel, CategorySchema } from '../../models/category.model';
import { Ancestor, Category } from 'src/domain/entities/category.entity';

@Injectable()
export class MongooseCategoryRepositoryAdapter implements CategoryRepositoryPort {
  private categoryModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.categoryModel = this.connection.model(CategoryModel.name, CategorySchema);
  }

  async getCategoriesDropdown(): Promise<Category[]> {
    const categories = await this.categoryModel.find().populate('children').exec();
    return categories.map((category) => this.mapToEntity(category));
  }

  async getCategoriesBy(query): Promise<Category[]> {
    const categories = await this.categoryModel.find(query).exec();
    return categories.map((category) => this.mapToEntity(category));
  }

  private mapToEntity(categoryModel: CategoryModel): Category {
    return {
      id: categoryModel._id.toString(),
      name: categoryModel.name,
      slug: categoryModel.slug,
      parent: categoryModel.parent?.toString(),
      ancestors: categoryModel.ancestors.map((ancestor) => new Ancestor(ancestor._id.toString(), ancestor.name, ancestor.slug)),
      children: categoryModel.children,
    };
  }
}
