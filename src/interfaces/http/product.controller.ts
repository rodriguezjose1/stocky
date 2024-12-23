// interfaces/http/product.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from 'src/domain/enums/role.enum';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { BasicAuthGuard } from 'src/infrastructure/auth/guards/basic-auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { ProductUseCases } from '../../application/use-cases/product.use-cases';
import {
  CalculatePricesDto,
  CreateProductDto,
  FilterProductsByCodeOrNameDto,
  FilterProductsDto,
  GetProductByIdQueryDto,
  IncreasePrices,
  ReqGetProductsDto,
  UpdateProductDto,
} from '../../domain/entities/product.entity';

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

  @UseGuards(BasicAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  async updateProduct(@Param('id') id: string, @Body() product: UpdateProductDto, @Req() req) {
    return this.productUseCases.updateProduct(id, product, req.user);
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

  @Get('/filter/products-by-code-or-name')
  async findByCodeOrName(@Query() filter: FilterProductsByCodeOrNameDto) {
    const { products, total } = await this.productUseCases.findByCodeOrName(filter);
    return {
      products,
      total,
    };
  }

  @Get('calculations/prices')
  async calculatePrices(@Query() query: CalculatePricesDto) {
    const prices = await this.productUseCases.calculatePrices(query);
    return {
      prices,
    };
  }

  @UseGuards(BasicAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('prices/increase')
  async increasePrices(@Body() body: IncreasePrices, @Req() req) {
    body.user = req.user;
    const products = await this.productUseCases.increasePrices(body);
    return {
      products,
    };
  }
}
