// interfaces/http/product.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ProductUseCases } from '../../application/use-cases/product.use-cases';
import { Product } from '../../domain/entities/product.entity';

@Controller('products')
export class ProductController {
  constructor(private productUseCases: ProductUseCases) {}

  @Get()
  async getAllProducts() {
    const products = await this.productUseCases.getAllProducts();

    return {
      products,
    };
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    const product = await this.productUseCases.getProductById(id);

    return {
      product,
    };
  }

  @Post()
  async createProduct(@Body() product: Product) {
    const newProduct = await this.productUseCases.createProduct(product);

    return {
      product: newProduct,
    };
  }

  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() product: Partial<Product>,
  ) {
    return this.productUseCases.updateProduct(id, product);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return this.productUseCases.deleteProduct(id);
  }
}
