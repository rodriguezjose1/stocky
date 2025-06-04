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
  ) { }

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
    // Check if a product with the same code already exists
    const existingProduct = await this.productRepository.findByCode(product.code);
    if (existingProduct) {
      throw new BadRequestException(productErrors.duplicateProductCode);
    }

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

    this.validateWholesaleData(product);

    const calculatePrices = await this.calculatePrices({
      costPrice: product.prices.cost,
      percentageReseller: product.percentages.reseller,
      percentageRetail: product.percentages.retail,
      percentageWholesale: product.percentages.wholesale,
    });

    product.prices.reseller = calculatePrices.reseller;
    product.prices.retail = calculatePrices.retail;
    product.prices.wholesale = calculatePrices.wholesale;

    const createdProduct = await this.productRepository.create({ ...product, categories: categoryIds, categoriesFilter: categoryPaths });

    return createdProduct;
  }

  async updateProduct(id: string, product: Partial<Product>, user): Promise<Product | null> {
    const productDB = await this.productRepository.findById(id);
    if (!productDB) {
      throw new BadRequestException(productErrors.productNotFound);
    }

    // if percentages was changed, update prices
    if (product.percentages.reseller !== productDB.percentages.reseller ||
      product.percentages.retail !== productDB.percentages.retail ||
      product.percentages.wholesale !== productDB.percentages.wholesale) {
      await this.updatePrices(product);
    }

    if (product.wholesaleData.isWholesaler !== productDB.wholesaleData.isWholesaler) {
      await this.updatePrices(product);

      if (!product.wholesaleData.isWholesaler) {
        product.percentages.wholesale.half_dozen = 0;
        product.percentages.wholesale.dozen = 0;
      }
    }

    if (product.prices && product.prices.cost !== productDB.prices.cost ||
      (product.percentages.reseller !== productDB.percentages.reseller ||
        product.percentages.retail !== productDB.percentages.retail ||
        product.percentages.wholesale.half_dozen  !== productDB.percentages.wholesale.half_dozen ||
        product.percentages.wholesale.dozen !== productDB.percentages.wholesale.dozen)
    ) {
      await this.updatePrices(product);

      await this.productRepository.savePriceHistory({
        productId: productDB.id,
        previousPrice: productDB.prices,
        newPrice: product.prices,
        modfifiedAt: new Date(),
        modifiedBy: user ? user.id : null,
        percentage: this.calculatePercentageIncrease(productDB.prices.cost, product.prices.cost),
      });
    }

    let isUpdatedCategories = false;
    if (product.categories && !this.areArraysEqual(product.categories, productDB.categories)) {
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
      isUpdatedCategories = true;
    }

    if (product.sizeType && !isUpdatedCategories) {
      const productAttributeSubtypeSize = await this.productAttributesSubtypeUseCases.getProductAttributeSubtypeById(product.sizeType);
      const sizes = await this.productAttributesUseCases.getProductAttributes('size', productAttributeSubtypeSize.value);
      product.sizes = sizes.map((size) => size.label || size.value);
    }

    if (product.colors) {
      product.colors = this.getUniqueColors(productDB.colors, product.colors);
    }

    if (!product.pictures?.length) {
      product.pictures = productDB.pictures;
    }

    return this.productRepository.update(id, product);
  }

  private async updatePrices(product: Partial<Product>) {
    const calculatedPrices = await this.calculatePrices({
      costPrice: product.prices.cost,
      percentageReseller: product.percentages.reseller,
      percentageRetail: product.percentages.retail,
      percentageWholesale: product.percentages.wholesale,
    });

    product.prices.reseller = calculatedPrices.reseller;
    product.prices.retail = calculatedPrices.retail;
    product.prices.wholesale = calculatedPrices.wholesale;
  }

  async updatePartialProduct(id: string, product: Partial<Product>): Promise<Product | null> {
    // Verificar si el producto existe
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new BadRequestException(productErrors.productNotFound);
    }

    // Si se está actualizando el código, verificar que no exista otro producto con el mismo código
    if (product.code && product.code !== existingProduct.code) {
      const productWithSameCode = await this.productRepository.findByCode(product.code);
      if (productWithSameCode) {
        throw new BadRequestException(productErrors.duplicateProductCode);
      }
    }

    // Utilizar el método updatePartial del repositorio que ahora maneja el mapeo correctamente
    return this.productRepository.updatePartial(id, product);
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

  async calculatePrices({ costPrice, percentageReseller, percentageRetail, percentageWholesale }) {
    return this.productRepository.calculatePrices(costPrice, percentageReseller, percentageRetail, percentageWholesale);
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
    if (incomingCategories?.length !== currentCategories?.length) return false;

    const strArr1 = incomingCategories.map((item: any) => item.toString());
    const strArr2 = currentCategories.map((item: any) => item.toString());

    return strArr1.every((value, index) => value === strArr2[index]);
  }

  private getUniqueColors(colors: string[], newColors: string[]): string[] {
    return Array.from(new Set(newColors));
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

  private calculatePercentageIncrease(initialAmount: number, newAmount: number): number {
    if (initialAmount === 0) {
      throw new Error('The initial amount cannot be zero.');
    }
    const increase = newAmount - initialAmount;
    const percentage = (increase / initialAmount) * 100;
    return percentage;
  }

  private validateWholesaleData(product) {
    if (product.wholesaleData && product.wholesaleData.isWholesaler) {
      if (!product.wholesaleData.packageType) {
        throw new BadRequestException(productErrors.wholesalePackageTypeRequired);
      }
      if (product.percentages.wholesale.dozen === 0 && product.percentages.wholesale.half_dozen === 0) {
        throw new BadRequestException(productErrors.wholesalePercentagesRequired);
      }
    }

    if (product.wholesaleData && !product.wholesaleData.isWholesaler) {
      product.percentages.wholesale.half_dozen = 0;
      product.percentages.wholesale.dozen = 0;
      product.wholesaleData.packageType = null;
    }

    if (!product.wholesaleData) {
      product.percentages.wholesale = {
        half_dozen: 0,
        dozen: 0,
      };
    }
  }

}
