// infrastructure/adapters/mongoose-product-repository.adapter.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Product } from '../../domain/entities/product.entity';
import { ProductRepositoryPort } from '../../domain/ports/product-repository.port';
import { ProductModel, ProductSchema } from '../models/product.model';

@Injectable()
export class MongooseProductRepositoryAdapter implements ProductRepositoryPort {
  private productModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.productModel = this.connection.model(ProductModel.name, ProductSchema);
  }

  async findAll(): Promise<Product[]> {
    const products = await this.productModel.find().exec();
    return products.map((product) => this.mapToEntity(product));
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
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, this.mapToModel(product), { new: true })
      .exec();
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
      productModel.description,
      productModel.price,
    );
  }

  private mapToModel(product: Partial<Product>): Partial<ProductModel> {
    return {
      name: product.name,
      description: product.description,
      price: product.price,
    };
  }
}
