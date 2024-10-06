import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { SaleDetail } from 'src/domain/entities/sale.entity';
import { Variant } from 'src/domain/entities/variant.entity';
import { InsufficientStockException } from 'src/domain/exceptions/insufficient-stock.exception';
import { ReqGetStocksDto, ResGetStocksDto, Stock, UpdateStockDto } from '../../domain/entities/stock.entity';
import { StockRepositoryPort } from '../../domain/ports/stock-repository.port';
import { VariantUseCases } from './variant.use-cases';

@Injectable()
export class StockUseCases {
  constructor(
    @Inject('StockRepositoryPort')
    private stockRepository: StockRepositoryPort,
    private variantUseCases: VariantUseCases,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async getStockByProductId(productId: string): Promise<Stock | null> {
    return this.stockRepository.getByProductId(productId);
  }

  async getAllStocks(query: ReqGetStocksDto): Promise<ResGetStocksDto> {
    return this.stockRepository.findAll(query);
  }

  async getStockById(id: string): Promise<Stock | null> {
    return this.stockRepository.findById(id);
  }

  async createStock(stockDto: UpdateStockDto): Promise<Stock> {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      if (!stockDto.date) {
        stockDto.date = new Date();
      }

      const variant = await this.variantUseCases.getOneBy(stockDto.variant);

      let variantId = variant ? variant.id : null;
      let stock = null;

      if (!variantId) {
        // save variant
        const variantToSave: Variant = {
          id: undefined,
          product: stockDto.product,
          size: stockDto.variant.size,
          color: stockDto.variant.color,
        };
        const savedVariant = await this.variantUseCases.createVariant(variantToSave);
        variantId = savedVariant.id;

        // create stock
        const stockToSave: Stock = {
          id: undefined,
          product: stockDto.product,
          variant: variantId,
          quantity: stockDto.quantity,
          costPrice: stockDto.costPrice,
          date: stockDto.date,
        };

        stock = await this.stockRepository.create(stockToSave);
      } else {
        // update existing stock
        const stockDB = await this.stockRepository.getStockByVariantId(variantId);
        if (stockDB && stockDB.costPrice !== stockDto.costPrice) {
          // create stock with different cost price
          const stockToSave: Stock = {
            id: undefined,
            product: stockDto.product,
            variant: variantId,
            quantity: stockDto.quantity,
            costPrice: stockDto.costPrice,
            date: stockDto.date,
          };

          stock = await this.stockRepository.create(stockToSave);
        } else {
          stock = await this.stockRepository.incrementStock(stockDB.id, stockDto.quantity);
        }
      }

      await session.commitTransaction();

      return stock;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateStock(id: string, stock: Partial<Stock>): Promise<Stock | null> {
    return this.stockRepository.update(id, stock);
  }

  async deleteStock(id: string): Promise<boolean> {
    return this.stockRepository.delete(id);
  }

  async incrementStock(productId, { quantity }) {
    const stock = await this.stockRepository.getByProductId(productId);
    if (stock) {
      await this.stockRepository.incrementStock(stock.id, quantity);
    }
  }

  async decrementStock(productId, { quantity }) {
    const stock = await this.stockRepository.getByProductId(productId);
    if (stock) {
      await this.stockRepository.decrementStock(stock.id, quantity);
    }
  }

  public async checkStock(details: SaleDetail[]): Promise<void> {
    for (const detail of details) {
      const stock = await this.stockRepository.getByProductId(detail.product_id);
      if (!stock) {
        throw new Error(`Product with id ${detail.product_id} not found`);
      }
      if (stock.quantity < detail.quantity) {
        throw new InsufficientStockException(detail.product_id, detail.quantity, stock.quantity);
      }
    }
  }
}
