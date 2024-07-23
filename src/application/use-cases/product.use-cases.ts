// application/use-cases/product-use-cases.ts
import { Inject, Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { ProductRepositoryPort } from '../../domain/ports/product-repository.port';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductCreatedEvent } from 'src/async-events/events/product.events';

@Injectable()
export class ProductUseCases {
  constructor(
    @Inject('ProductRepositoryPort')
    private productRepository: ProductRepositoryPort,
    private eventEmitter: EventEmitter2,
  ) {}

  async getAllProducts(): Promise<Product[]> {
    return this.productRepository.findAll();
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.productRepository.findById(id);
  }

  async createProduct(product: Product): Promise<Product> {
    const createdProduct = await this.productRepository.create(product);
    this.eventEmitter.emit(
      'product.created',
      new ProductCreatedEvent(createdProduct.id),
    );

    return createdProduct;
  }

  async updateProduct(
    id: string,
    product: Partial<Product>,
  ): Promise<Product | null> {
    return this.productRepository.update(id, product);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.productRepository.delete(id);
  }
}
