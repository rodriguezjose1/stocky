// domain/ports/product-repository.port.ts
import { FilterProductsDto, IncreasePrices, Product, ReqGetProductsDto, ResGetProductsDto } from '../entities/product.entity';

export interface ProductRepositoryPort {
  findAll(query: ReqGetProductsDto): Promise<ResGetProductsDto>;
  findById(id: string): Promise<Product | null>;
  create(product: Product): Promise<Product>;
  update(id: string, product: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  getByCategory(categoryId: string): Promise<Product[]>;
  filterProducts(filterDto: FilterProductsDto): Promise<ResGetProductsDto>;
  findByIdAdmin(id: string, filter): Promise<Product | null>;
  findByCodeOrName(filter): Promise<ResGetProductsDto>;
  findByCode(code: string): Promise<Product | null>;
  calculatePrices(costPrice, percentageReseller, percentageRetail, percentageWholesale): any;
  increasePrices(data: IncreasePrices): Promise<Product[]>;
  savePriceHistory(priceHistory: any): Promise<any>;
  updatePartial(id: string, product: Partial<Product>): Promise<Product | null>;
}
