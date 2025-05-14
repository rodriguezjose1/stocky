import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateStockMovementDto } from '../../domain/dtos/stock-movement.dto';
import { StockMovement } from '../../domain/entities/stock-movement.entity';
import { StockMovementRepositoryPort } from '../../domain/ports/stock-movement-repository.port';
import { Prices } from '../../infrastructure/models/product.model';
import { MovementSource, StockMovementStatus, StockMovementType } from '../../infrastructure/models/stock-movement.model';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StockMovementUseCases {
  constructor(
    @Inject('StockMovementRepositoryPort')
    private stockMovementRepository: StockMovementRepositoryPort,
    private configService: ConfigService,
  ) {}

  async createMovement(data: CreateStockMovementDto & { prices: Prices }): Promise<StockMovement> {
    // Validaciones básicas que siempre se aplican
    this.validateBasicMovement(data);

    // Validación de stock solo si está habilitada
    if (this.configService.get('ENABLE_STOCK_VALIDATION') === 'true') {
      await this.validateStockMovement(data);
    }

    const now = new Date();
    
    // Solo calcular ganancia si la fuente es una venta
    const profit_unit = data.source === MovementSource.SALE 
      ? data.prices.retail - (data.prices.cost || 0) 
      : 0;
    
    const total_profit = data.source === MovementSource.SALE 
      ? profit_unit * data.quantity 
      : 0;
    
    const movement = {
      ...data,
      date: now,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      week: this.getWeekNumber(now),
      profit_unit,
      total_profit,
    };

    return this.stockMovementRepository.create(movement);
  }

  private validateBasicMovement(data: CreateStockMovementDto & { prices: Prices }): void {
    // Validar que la cantidad sea positiva
    if (data.quantity <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a 0');
    }

    // Validar consistencia entre stockBefore, stockAfter y quantity según el tipo
    const expectedStockAfter = data.type === StockMovementType.IN
      ? data.stockBefore + data.quantity
      : data.stockBefore - data.quantity;

    if (data.stockAfter !== expectedStockAfter) {
      throw new BadRequestException(
        `El stock final (${data.stockAfter}) no coincide con el cálculo esperado (${expectedStockAfter}) para el tipo de movimiento ${data.type}`,
      );
    }

    // Validar que no haya stock negativo
    if (data.stockAfter < 0) {
      throw new BadRequestException('No se puede realizar un movimiento que resulte en stock negativo');
    }

    // Validar campos requeridos para ventas
    if (data.source === MovementSource.SALE) {
      if (!data.saleId) {
        throw new BadRequestException('El ID de venta es requerido para movimientos de tipo venta');
      }
      if (!data.clientId) {
        throw new BadRequestException('El ID de cliente es requerido para movimientos de tipo venta');
      }
    }

    // Validar que el tipo de movimiento sea consistente con la fuente
    if (data.source === MovementSource.SALE && data.type !== StockMovementType.OUT) {
      throw new BadRequestException('Los movimientos de venta deben ser de tipo OUT');
    }
  }

  private async validateStockMovement(data: CreateStockMovementDto & { prices: Prices }): Promise<void> {
    // Aquí irían las validaciones adicionales de stock
    // Por ejemplo, verificar límites máximos, duplicados, etc.
    // Se pueden agregar gradualmente sin afectar el funcionamiento actual
  }

  async getMovementsByProduct(
    product_id: string,
    variant_id?: string,
  ): Promise<StockMovement[]> {
    return this.stockMovementRepository.findByProduct(product_id, variant_id);
  }

  async getMovementsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<StockMovement[]> {
    return this.stockMovementRepository.findByDateRange(startDate, endDate);
  }

  async getMovementsByType(
    type: StockMovementType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StockMovement[]> {
    return this.stockMovementRepository.findByType(type, startDate, endDate);
  }

  async getMovementsBySale(sale_id: string): Promise<StockMovement[]> {
    return this.stockMovementRepository.findBySale(sale_id);
  }

  async getMovementsByClient(
    client_id: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StockMovement[]> {
    return this.stockMovementRepository.findByClient(client_id, startDate, endDate);
  }

  async getStockHistory(
    product_id: string,
    variant_id: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<StockMovement[]> {
    return this.stockMovementRepository.getStockHistory(
      product_id,
      variant_id,
      startDate,
      endDate,
    );
  }

  async udpateStockMovementStatusBySaleId(saleId: string, status: StockMovementStatus): Promise<StockMovement[]> {
    return this.stockMovementRepository.updateStatusBySaleId(saleId, status);
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
} 