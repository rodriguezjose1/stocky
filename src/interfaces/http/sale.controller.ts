// interfaces/http/sale.controller.ts
import { Controller, Post, Body, Get, Put, Param, Query } from '@nestjs/common';
import { SalesUseCase } from '../../application/use-cases/sale.use-cases';
import { CreateSaleDto, GetSalesFilterDto, Sale } from 'src/domain/entities/sale.entity';

@Controller('sales')
export class SaleController {
  constructor(private saleUseCases: SalesUseCase) {}

  @Post()
  async createSale(
    @Body()
    saleData: CreateSaleDto,
  ) {
    const sale = await this.saleUseCases.createSale(saleData);

    return {
      sale,
    };
  }

  @Get()
  async getAllSales(@Query() query: GetSalesFilterDto) {
    const { sales, total } = await this.saleUseCases.findAll(query);

    return {
      sales,
      total,
    };
  }

  @Get(':id')
  async getSaleById(id: string) {
    const sale = await this.saleUseCases.findById(id);

    return {
      sale,
    };
  }

  @Put(':id')
  async updateSale(@Param('id') id: string, @Body() saleData: Partial<Sale>) {
    const updatedSale = await this.saleUseCases.updateSale(id, saleData);

    return {
      sale: updatedSale,
    };
  }

  @Get('/by/user')
  async getSalesByUser() {
    const users = await this.saleUseCases.findSellersWithSalesInCurrentWeek();

    return {
      users,
    };
  }

  @Get('/by/user/:id')
  async getProductsInSalesByUser(@Param('id') userId: string) {
    const products = await this.saleUseCases.findProductsBySellerId(userId);

    return {
      products,
    };
  }

  @Get('/by/products')
  async getSalesByProducts() {
    const products = await this.saleUseCases.findGroupedProductsInCurrentWeek();

    return {
      products,
    };
  }
}
