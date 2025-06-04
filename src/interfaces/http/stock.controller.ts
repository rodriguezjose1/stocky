// interfaces/http/stock.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { StockUseCases } from '../../application/use-cases/stock.use-cases';
import { ReqGetStocksDto, ResGetStocksDto, Stock, UpdateStockDto } from '../../domain/entities/stock.entity';
import { Role } from '../../domain/enums/role.enum';
import { Roles } from '../../infrastructure/auth/decorators/roles.decorator';
import { BasicAuthGuard } from '../../infrastructure/auth/guards/basic-auth.guard';
import { RolesGuard } from '../../infrastructure/auth/guards/roles.guard';

@Controller('stock')
export class StockController {
  constructor(private readonly stockUseCases: StockUseCases) {}

  @Get()
  @Roles(Role.ADMIN, Role.SELLER, Role.CUSTOMER)
  @UseGuards(BasicAuthGuard, RolesGuard)
  async getAllStocks(@Query() query: ReqGetStocksDto): Promise<ResGetStocksDto> {
    const { stocks, total } = await this.stockUseCases.getAllStocks(query);
    
    return {
      stocks,
      total,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SELLER, Role.CUSTOMER)
  @UseGuards(BasicAuthGuard, RolesGuard)
  async getStockById(@Param('id') id: string) {
    const stock = await this.stockUseCases.getStockById(id);

    return {
      stock,
    };
  }

  @Post()
  async createStock(@Body() stock: UpdateStockDto) {
    const newStock = await this.stockUseCases.createStock(stock);

    return {
      stock: newStock,
    };
  }

  @Post('multiple')
  async createStockMultiple(@Body() stock: UpdateStockDto[]) {
    const newStocks = await this.stockUseCases.createStockMultiple(stock);

    return {
      stocks: newStocks,
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
