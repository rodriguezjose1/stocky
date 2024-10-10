// infrastructure/adapters/mongoose-product-repository.adapter.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { FilterProductsDto, Product, ReqGetProductsDto, ResGetProductsDto } from '../../../../domain/entities/product.entity';
import { ProductRepositoryPort } from '../../../../domain/ports/product-repository.port';
import { ProductModel, ProductSchema } from '../../../models/product.model';
import { FilterProduct } from './filter-product';

@Injectable()
export class MongooseProductRepositoryAdapter implements ProductRepositoryPort {
  private productModel = Model<any>;
  constructor(
    @InjectConnection() private connection: Connection,
    private filterProduct: FilterProduct,
  ) {
    this.productModel = this.connection.model(ProductModel.name, ProductSchema);
  }

  async filterProducts(filterDto: FilterProductsDto): Promise<ResGetProductsDto> {
    const aggregatePipeline = this.filterProduct.filterProducts(filterDto);

    const result = await this.productModel.aggregate(aggregatePipeline).exec();

    const total = result[0]?.total?.total || 0;
    const products = result[0]?.products || [];

    return {
      products: products.map((product) => this.mapToEntity(product, true)),
      total,
    };
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
      undefined,
      productModel.stock
        ? {
            id: productModel.stock._id.toString(),
            quantity: productModel.stock.quantity,
            costPrice: productModel.stock.cost_price,
            date: productModel.stock.date,
          }
        : undefined,
      productModel.variant
        ? {
            id: productModel.variant._id.toString(),
            color: productModel.variant.color,
            size: productModel.variant.size,
          }
        : undefined,
    );
  }
}
