// interfaces/http/product.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ProductUseCases } from '../../application/use-cases/product.use-cases';
import { ReqGetProductsDto, Product, CreateProductDto, FilterProductsDto, GetProductByIdQueryDto } from '../../domain/entities/product.entity';

@Controller('products')
export class ProductController {
  constructor(private productUseCases: ProductUseCases) {}

  @Get()
  async getAllProducts(@Query() query: ReqGetProductsDto) {
    const { products, total } = await this.productUseCases.getAllProducts(query);

    return {
      products,
      total,
    };
  }

  @Get('filter')
  async filterProducts(@Query() filterDto: FilterProductsDto) {
    const { products, total } = await this.productUseCases.filterProducts(filterDto);

    return {
      products,
      total,
    };
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    const product = await this.productUseCases.getProductById(id);

    return {
      product,
    };
  }

  @Get('admin/:id')
  async getProductByIdAdmin(@Query() query: GetProductByIdQueryDto, @Param('id') id: string) {
    const product = await this.productUseCases.getProductByIdAdmin(id, query);

    return {
      product,
    };
  }

  @Post()
  async createProduct(@Body() product: CreateProductDto) {
    const newProduct = await this.productUseCases.createProduct(product);

    return {
      product: newProduct,
    };
  }

  @Put(':id')
  async updateProduct(@Param('id') id: string, @Body() product: Partial<Product>) {
    return this.productUseCases.updateProduct(id, product);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.productUseCases.deleteProduct(id);
  }

  @Get('by-category/:categoryId')
  async getCategoriesByProduct(@Param('categoryId') id: string) {
    const products = await this.productUseCases.getProductsByCategory(id);
    return {
      products,
    };
  }
}
