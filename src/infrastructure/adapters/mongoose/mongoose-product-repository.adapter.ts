// infrastructure/adapters/mongoose-product-repository.adapter.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Product, ReqGetProductsDto, ResGetProductsDto } from '../../../domain/entities/product.entity';
import { ProductRepositoryPort } from '../../../domain/ports/product-repository.port';
import { ProductModel, ProductSchema } from '../../models/product.model';
import { Ancestor } from 'src/domain/entities/category.entity';

@Injectable()
export class MongooseProductRepositoryAdapter implements ProductRepositoryPort {
  private productModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.productModel = this.connection.model(ProductModel.name, ProductSchema);
  }

  async findAll({ page, limit }: ReqGetProductsDto): Promise<ResGetProductsDto> {
    const offset = (page - 1) * limit;
    const products = await this.productModel.find().populate('categories').limit(limit).skip(offset).exec();
    const total = await this.productModel.countDocuments().exec();
    return {
      products: products.map((product) => this.mapToEntity(product, true)),
      total,
    };
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.productModel.findById(id).exec();
    return product ? this.mapToEntity(product) : null;
  }

  async create(product: Product): Promise<Product> {
    const newProduct = new this.productModel(product);
    const savedProduct = await newProduct.save();
    return this.mapToEntity(savedProduct);
  }

  async update(id: string, product: Partial<Product>): Promise<Product | null> {
    const updatedProduct = await this.productModel.findByIdAndUpdate(id, product, { new: true }).exec();
    return updatedProduct ? this.mapToEntity(updatedProduct) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.productModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  async getByCategory(categoryId: string): Promise<Product[]> {
    const products = await this.productModel.aggregate([{ $unwind: '$categories_filter' }, { $match: { categories: new Types.ObjectId(categoryId) } }]);
    return products.map((product) => this.mapToEntity(product));
  }

  private mapToEntity(productModel: ProductModel, withPopulate = false): Product {
    let categories = null;
    if (withPopulate) {
      categories = productModel.categories.map((category: any) => ({
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
        // parent: category.parent?.toString(),
      }));
    } else {
      categories = productModel.categories?.map((category) => category.toString());
    }
    return new Product(
      productModel._id.toString(),
      productModel.name,
      productModel.description,
      productModel.code,
      // productModel.categories?.map((category) => category.map((c) => c._id.toString())),
      categories,
      productModel.attributes,
      productModel.pictures,
      productModel.prices,
    );
  }
}
