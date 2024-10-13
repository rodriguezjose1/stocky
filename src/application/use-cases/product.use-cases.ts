// application/use-cases/product-use-cases.ts
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateProductDto, FilterProductsDto, Product, ResGetProductsDto } from '../../domain/entities/product.entity';
import { ProductRepositoryPort } from '../../domain/ports/product-repository.port';
import { CategoryUseCases } from './category.use-cases';
import { Category } from 'src/domain/entities/category.entity';
import { Types } from 'mongoose';

@Injectable()
export class ProductUseCases {
  constructor(
    @Inject('ProductRepositoryPort')
    private productRepository: ProductRepositoryPort,
    private eventEmitter: EventEmitter2,
    private categoryUseCases: CategoryUseCases,
  ) {}

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const products = await this.productRepository.getByCategory(categoryId);
    return products;
  }

  async getAllProducts(query): Promise<ResGetProductsDto> {
    return this.productRepository.findAll(query);
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.productRepository.findById(id);
  }

  async getProductByIdAdmin(id: string, filter): Promise<Product | null> {
    return this.productRepository.findByIdAdmin(id, filter);
  }

  async createProduct(product: CreateProductDto): Promise<Product> {
    const categoryIds = product.categories; // IDs de las categorías seleccionadas

    // Obtener las categorías y sus ancestros
    // TODO: move to dao
    const categories = await this.categoryUseCases.getCategoriesBy({ _id: { $in: categoryIds.map((id) => new Types.ObjectId(id)) } });

    // Construir el categoryPaths
    const categoryPaths = this.buildCategoryPaths(categories);

    const createdProduct = await this.productRepository.create({ ...product, categories: categoryIds, categories_filter: categoryPaths });
    // this.eventEmitter.emit(
    //   'product.created',
    //   new ProductCreatedEvent(createdProduct.id),
    // );

    return createdProduct;
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product | null> {
    return this.productRepository.update(id, product);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.productRepository.delete(id);
  }

  async filterProducts(filterDto: FilterProductsDto): Promise<ResGetProductsDto> {
    return this.productRepository.filterProducts(filterDto);
  }

  private buildCategoryPaths(categories: Category[]): string[][] {
    const paths: string[][] = [];

    categories.forEach((category) => {
      const path = this.getFullPath(category);
      paths.push(path);
    });

    return paths;
  }

  private getFullPath(category: Category): string[] {
    const path: string[] = category.ancestors.map((ancestor) => ancestor.id); // Agregar los ancestros
    path.push(category.id); // Agregar la categoría actual
    return path;
  }
}
