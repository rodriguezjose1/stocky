// domain/ports/product-repository.port.ts
import { FilterProductsDto, Product, ReqGetProductsDto, ResGetProductsDto } from '../entities/product.entity';

export interface ProductRepositoryPort {
  findAll(query: ReqGetProductsDto): Promise<ResGetProductsDto>;
  findById(id: string): Promise<Product | null>;
  create(product: Product): Promise<Product>;
  update(id: string, product: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  getByCategory(categoryId: string): Promise<Product[]>;
  filterProducts(filterDto: FilterProductsDto): Promise<ResGetProductsDto>;
  findByIdAdmin(id: string, filter): Promise<Product | null>;
}
