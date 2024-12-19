// application/use-cases/product-use-cases.ts
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { Category } from 'src/domain/entities/category.entity';
import { CreateProductDto, FilterProductsDto, IncreasePrices, Product, ResGetProductsDto } from '../../domain/entities/product.entity';
import { ProductRepositoryPort } from '../../domain/ports/product-repository.port';
import { CategoryUseCases } from './category.use-cases';
import { ProductAttributeSubtypeUseCases } from './product-attribute-subtype.use-cases';
import { ProductAttributeUseCases } from './product-attribute.use-cases';
import { productErrors } from '../error.constants';

@Injectable()
export class ProductUseCases {
  constructor(
    @Inject('ProductRepositoryPort')
    private productRepository: ProductRepositoryPort,
    private productAttributesUseCases: ProductAttributeUseCases,
    private productAttributesSubtypeUseCases: ProductAttributeSubtypeUseCases,
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
    // TODO: move to dao and fix this
    const categories = await this.categoryUseCases.getCategoriesBy({ _id: { $in: categoryIds.map((id) => new Types.ObjectId(id)) } });

    product.sizeType = await this.getSizeType(product, categories);

    const productAttributeSubtypeSize = await this.productAttributesSubtypeUseCases.getProductAttributeSubtypeById(product.sizeType);
    const sizes = await this.productAttributesUseCases.getProductAttributes('size', productAttributeSubtypeSize.value);
    product.sizes = sizes.map((size) => size.label || size.value);

    // Construir el categoryPaths
    const categoryPaths = this.buildCategoryPaths(categories);

    const calculatePrices = await this.calculatePrices({
      costPrice: product.prices.cost,
      percentageReseller: product.percentages.reseller,
      percentageRetail: product.percentages.retail,
    });

    product.prices.reseller = calculatePrices.reseller;
    product.prices.retail = calculatePrices.retail;

    const createdProduct = await this.productRepository.create({ ...product, categories: categoryIds, categoriesFilter: categoryPaths });

    return createdProduct;
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product | null> {
    const productDB = await this.productRepository.findById(id);
    if (!productDB) {
      throw new BadRequestException(productErrors.productNotFound);
    }

    if (!this.areArraysEqual(product.categories, productDB.categories)) {
      const categories = await this.categoryUseCases.getCategoriesBy({ _id: { $in: product.categories.map((id) => new Types.ObjectId(id)) } });

      if (!categories.length) {
        throw new BadRequestException(productErrors.categoryNotFound);
      }

      product.sizeType = await this.getSizeType(product, categories);

      const categoryPaths = this.buildCategoryPaths(categories);
      product.categoriesFilter = categoryPaths;

      const productAttributeSubtypeSize = await this.productAttributesSubtypeUseCases.getProductAttributeSubtypeById(product.sizeType);
      const sizes = await this.productAttributesUseCases.getProductAttributes('size', productAttributeSubtypeSize.value);
      product.sizes = sizes.map((size) => size.label || size.value);
    }

    if (product.colors) {
      product.colors = this.getUniqueColors(productDB.colors, product.colors);
    }

    return this.productRepository.update(id, product);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.productRepository.delete(id);
  }

  async filterProducts(filterDto: FilterProductsDto): Promise<ResGetProductsDto> {
    return this.productRepository.filterProducts(filterDto);
  }

  async findByCodeOrName(filter): Promise<ResGetProductsDto> {
    return this.productRepository.findByCodeOrName(filter);
  }

  async calculatePrices({ costPrice, percentageReseller, percentageRetail }) {
    return this.productRepository.calculatePrices(costPrice, percentageReseller, percentageRetail);
  }

  async increasePrices(data: IncreasePrices) {
    return this.productRepository.increasePrices(data);
  }

  private buildCategoryPaths(categories: Category[] | string[]): string[][] {
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

  private areArraysEqual(incomingCategories, currentCategories): boolean {
    if (incomingCategories.length !== currentCategories.length) return false;

    const strArr1 = incomingCategories.map((item: any) => item.toString());
    const strArr2 = currentCategories.map((item: any) => item.toString());

    return strArr1.every((value, index) => value === strArr2[index]);
  }

  private getUniqueColors(colors: string[], newColors: string[]): string[] {
    const uniqueColors = new Set(colors);

    newColors.forEach((color) => uniqueColors.add(color));

    return Array.from(uniqueColors);
  }

  private async getSizeType(product, categories) {
    let sizeTypeId;
    if (categories[0].sizeTypes.length === 1) {
      sizeTypeId = categories[0].sizeTypes[0];
    } else {
      if (!product.sizeType) {
        throw new BadRequestException(productErrors.sizeTypeRequired);
      }
      if (!categories[0].sizeTypes.includes(product.sizeType)) {
        throw new BadRequestException(productErrors.invalidSizeType);
      }
      sizeTypeId = product.sizeType;
    }

    return sizeTypeId;
  }
}
