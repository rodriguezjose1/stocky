// interfaces/http/sale.controller.ts
import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CreateGuestSaleDto, CreateSaleDto, GetSalesFilterDto, Sale } from 'src/domain/entities/sale.entity';
import { Role } from 'src/domain/enums/role.enum';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { BasicAuthGuard } from 'src/infrastructure/auth/guards/basic-auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';
import { SalesUseCase } from '../../application/use-cases/sale.use-cases';
import { ApiResponse } from '@nestjs/swagger';
import { ApiBody } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';
import { GuestSaleUseCases } from 'src/application/use-cases/guest-sale.use-cases';
@Controller('sales')
export class SaleController {
  constructor(private saleUseCases: SalesUseCase, private guestSaleUseCases: GuestSaleUseCases) {}

  @Post('create-guest-sale')
  @ApiOperation({ summary: 'Crear venta para usuario no autenticado' })
  @ApiBody({
    type: CreateGuestSaleDto,
    description: 'Datos para crear una venta de usuario invitado',
    examples: {
      example1: {
        summary: 'Crear venta con datos de contacto',
        value: {
          sessionId: '550e8400-e29b-41d4-a716-446655440000',
          date: '2024-01-15T10:30:00.000Z',
          customerData: {
            name: 'Juan',
            lastname: 'Pérez',
            email: 'juan.perez@email.com',
            phone: '+1234567890',
            address: 'Calle Principal 123, Ciudad, País'
          }
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Venta creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o carrito no encontrado' })
  @ApiResponse({ status: 404, description: 'Carrito no encontrado para la sesión' })
  async createGuestSale(@Body() body: CreateGuestSaleDto) {
    // Validaciones básicas
    if (!body.cartId || body.cartId.trim() === '') {
      throw new BadRequestException('sessionId is required');
    }

    if (!body.customerData) {
      throw new BadRequestException('customerData is required');
    }

    if (!body.customerData.name || !body.customerData.lastname || !body.customerData.email) {
      throw new BadRequestException('name, lastname and email are required in customerData');
    }

    if (!body.date) {
      body.date = new Date();
    }

    const sale = await this.guestSaleUseCases.createGuestSale(body);
    return { sale };
  }

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

  @Put(':id')
  @UseGuards(BasicAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
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

  @Get('grouped-products-current-week')
  @Roles(Role.ADMIN, Role.SELLER)
  async getGroupedProductsInCurrentWeek() {
    return this.saleUseCases.findGroupedProductsInCurrentWeek();
  }

  @Get('monthly-stats')
  @Roles(Role.ADMIN, Role.SELLER)
  async getMonthlySalesStats(
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.saleUseCases.getMonthlySalesStats(month, year);
  }

  @Get('monthly-detail')
  @Roles(Role.ADMIN, Role.SELLER)
  async getMonthlySalesDetail(
    @Res() res: Response,
    @Query('month') month?: number,
    @Query('year') year?: number
  ) {
    const excelBuffer = await this.saleUseCases.generateMonthlySalesExcel(month, year);
    
    // Configurar la respuesta HTTP
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=ventas-detalle-${month || new Date().getMonth() + 1}-${year || new Date().getFullYear()}.xlsx`
    );
    
    // Enviar el archivo
    res.send(excelBuffer);
  }

  @Get(':id')
  async getSaleById(id: string) {
    const sale = await this.saleUseCases.findById(id);

    return {
      sale,
    };
  }
}
