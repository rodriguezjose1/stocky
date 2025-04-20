// interfaces/http/sale.controller.ts
import { Controller, Post, Body, Get, Put, Param, Query, UseGuards, Req } from '@nestjs/common';
import { SalesUseCase } from '../../application/use-cases/sale.use-cases';
import { CreateSaleDto, GetSalesFilterDto, Sale } from 'src/domain/entities/sale.entity';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { Role } from 'src/domain/enums/role.enum';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { BasicAuthGuard } from 'src/infrastructure/auth/guards/basic-auth.guard';

@Controller('sales')
export class SaleController {
  constructor(private saleUseCases: SalesUseCase) {}

  @Post()
  @Roles(Role.ADMIN, Role.SELLER, Role.CUSTOMER)
  @UseGuards(BasicAuthGuard, RolesGuard)
  async createSale(
    @Body()
    saleData: CreateSaleDto,
    @Req() req,
  ) {
    const sale = await this.saleUseCases.createSale(saleData, req.user);

    return {
      sale,
    };
  }

  @Get()
  @UseGuards(BasicAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER, Role.CUSTOMER)
  async getAllSales(@Query() query: GetSalesFilterDto, @Req() req) {
    query.user = req.user;
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

  @Post('/async-events/:saleId')
  async processAsyncEvents(@Param('saleId') saleId: string) {
    return this.saleUseCases.processAsyncEvents(saleId);
  }
}
