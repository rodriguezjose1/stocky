// interfaces/http/stock.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { StockUseCases } from '../../application/use-cases/stock.use-cases';
import { Stock } from '../../domain/entities/stock.entity';

@Controller('stock')
export class StockController {
  constructor(private stockUseCases: StockUseCases) {}

  @Get()
  async getAllStocks() {
    const stocks = await this.stockUseCases.getAllStocks();

    return {
      stocks,
    };
  }

  @Get(':id')
  async getStockById(@Param('id') id: string) {
    const stock = await this.stockUseCases.getStockById(id);

    return {
      stock,
    };
  }

  @Post()
  async createStock(@Body() stock: Stock) {
    const newStock = await this.stockUseCases.createStock(stock);

    return {
      stock: newStock,
    };
  }

  @Put(':id')
  async updateStock(@Param('id') id: string, @Body() stock: Partial<Stock>) {
    return this.stockUseCases.updateStock(id, stock);
  }

  @Delete(':id')
  async deleteStock(@Param('id') id: string) {
    return this.stockUseCases.deleteStock(id);
  }
}
