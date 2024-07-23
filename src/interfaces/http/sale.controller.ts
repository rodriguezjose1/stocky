// interfaces/http/sale.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { SalesUseCase } from '../../application/use-cases/sale.use-cases';
import { Sale } from 'src/domain/entities/sale.entity';

@Controller('sales')
export class SaleController {
  constructor(private saleUseCases: SalesUseCase) {}

  @Post()
  async createSale(
    @Body()
    saleData: Sale,
  ) {
    const sale = await this.saleUseCases.createSale(saleData);

    return {
      sale,
    };
  }

  @Get()
  async getAllSales() {
    const sales = await this.saleUseCases.findAll();

    return {
      sales,
    };
  }

  @Get(':id')
  async getSaleById(id: string) {
    const sale = await this.saleUseCases.findById(id);

    return {
      sale,
    };
  }
}
