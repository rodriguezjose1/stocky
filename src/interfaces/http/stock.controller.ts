// interfaces/http/stock.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { StockUseCases } from '../../application/use-cases/stock.use-cases';
import { ReqGetStocksDto, ResGetStocksDto, Stock, UpdateStockDto } from '../../domain/entities/stock.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private stockUseCases: StockUseCases) {}

  @Get()
  async getAllStocks(@Query() query: ReqGetStocksDto): Promise<ResGetStocksDto> {
    const { stocks, total } = await this.stockUseCases.getAllStocks(query);

    return {
      stocks,
      total,
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
  async createStock(@Body() stock: UpdateStockDto, @User() user: any) {
    const newStock = await this.stockUseCases.createStock({
      ...stock,
      userId: user.id,
    });

    return {
      stock: newStock,
    };
  }

  @Post('multiple')
  async createStockMultiple(@Body() stocks: UpdateStockDto[], @User() user: any) {
    const stocksWithUserId = stocks.map(stock => ({
      ...stock,
      userId: user.id,
    }));
    const newStocks = await this.stockUseCases.createStockMultiple(stocksWithUserId);

    return {
      stocks: newStocks,
    };
  }

  @Put(':id')
  async updateStock(@Param('id') id: string, @Body() stock: Partial<Stock>, @User() user: any) {
    return this.stockUseCases.updateStock(id, {
      ...stock,
      userId: user.id,
    });
  }

  @Delete(':id')
  async deleteStock(@Param('id') id: string) {
    return this.stockUseCases.deleteStock(id);
  }
}
