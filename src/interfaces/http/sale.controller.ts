// interfaces/http/sale.controller.ts
import { Controller, Post, Body, Get, Put, Param } from '@nestjs/common';
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

  @Put(':id')
  async updateSale(@Param('id') id: string, @Body() saleData: Partial<Sale>) {
    const updatedSale = await this.saleUseCases.updateSale(id, saleData);

    return {
      sale: updatedSale,
    };
  }
}
