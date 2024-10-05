// infrastructure/adapters/mongoose-product-repository.adapter.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Product, ReqGetProductsDto, ResGetProductsDto } from '../../../domain/entities/product.entity';
import { ProductRepositoryPort } from '../../../domain/ports/product-repository.port';
import { ProductModel, ProductSchema } from '../../models/product.model';

@Injectable()
export class MongooseProductRepositoryAdapter implements ProductRepositoryPort {
  private productModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.productModel = this.connection.model(ProductModel.name, ProductSchema);
  }

  async findAll({ page, limit }: ReqGetProductsDto): Promise<ResGetProductsDto> {
    const offset = (page - 1) * limit;
    const products = await this.productModel.find().limit(limit).skip(offset).exec();
    const total = await this.productModel.countDocuments().exec();
    return {
      products: products.map((product) => this.mapToEntity(product)),
      total,
    };
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.productModel.findById(id).exec();
    return product ? this.mapToEntity(product) : null;
  }

  async create(product: Product): Promise<Product> {
    const newProduct = new this.productModel(this.mapToModel(product));
    const savedProduct = await newProduct.save();
    return this.mapToEntity(savedProduct);
  }

  async update(id: string, product: Partial<Product>): Promise<Product | null> {
    const updatedProduct = await this.productModel.findByIdAndUpdate(id, this.mapToModel(product), { new: true }).exec();
    return updatedProduct ? this.mapToEntity(updatedProduct) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.productModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  private mapToEntity(productModel: ProductModel): Product {
    return new Product(
      productModel._id.toString(),
      productModel.name,
      productModel.code,
      productModel.description,
      productModel.brand,
      productModel.categories?.map((category) => category.toString()) || [],
      productModel.quantity,
      productModel.size,
      productModel.costPrice,
      productModel.resellerPrice,
      productModel.publicPrice,
      productModel.images,
    );
  }

  private mapToModel(product: Partial<Product>): Partial<ProductModel> {
    return {
      name: product.name,
      code: product.code,
      description: product.description,
      brand: product.brand,
      categories: product.categories.map((category) => new Types.ObjectId(category)),
      quantity: product.quantity,
      size: product.size,
      costPrice: product.costPrice,
      publicPrice: product.publicPrice,
      resellerPrice: product.resellerPrice,
      images: product.images,
    };
  }
}
