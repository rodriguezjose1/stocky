import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { SaleDetail, StocksUpdated } from 'src/domain/entities/sale.entity';
import { Variant } from 'src/domain/entities/variant.entity';
import { InsufficientStockException } from 'src/domain/exceptions/insufficient-stock.exception';
import { ReqGetStocksDto, ResGetStocksDto, Stock, UpdateStockDto } from '../../domain/entities/stock.entity';
import { StockRepositoryPort } from '../../domain/ports/stock-repository.port';
import { VariantUseCases } from './variant.use-cases';
import { ProductUseCases } from './product.use-cases';

@Injectable()
export class StockUseCases {
  constructor(
    @Inject('StockRepositoryPort')
    private stockRepository: StockRepositoryPort,
    private variantUseCases: VariantUseCases,
    private productUseCases: ProductUseCases,
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
        const stockDB = await this.stockRepository.getByVariantAndCostPriceWithQuantity(variantId, stockDto.costPrice);
        if (!stockDB) {
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

  async incrementStock(stockId, { quantity }) {
    return this.stockRepository.incrementStock(stockId, quantity);
  }

  async decrementStock(variantId, { quantity: decrementAmount }): Promise<StocksUpdated[]> {
    const decremented: StocksUpdated[] = [];
    const stocks = await this.stockRepository.getStockByVariantId(variantId);
    const product = await this.productUseCases.getProductById(stocks[0].product);

    let remaining = decrementAmount; // Cuánto stock queda por decrementar

    let quantitySaved = 0;
    for (const stock of stocks) {
      if (remaining <= 0) break; // Si ya hemos decrementado suficiente, salimos

      if (stock.quantity >= remaining) {
        // Si este registro tiene suficiente stock para cubrir lo que queda
        stock.quantity -= remaining;
        quantitySaved = remaining;
        remaining = 0; // Ya no necesitamos restar más
      } else {
        // Si no tiene suficiente stock, restamos todo el stock disponible y seguimos
        remaining -= stock.quantity;
        quantitySaved = stock.quantity;
        stock.quantity = 0;
      }

      decremented.push({
        stock: stock.id,
        quantity: quantitySaved,
        prices: {
          cost: stock.costPrice,
          retail: product.prices.retail,
          reseller: product.prices.reseller,
        },
      });

      // Guardamos los cambios en la base de datos
      await this.stockRepository.update(stock.id, { quantity: stock.quantity });
    }

    return decremented;
  }

  public async checkStock(details: SaleDetail[]): Promise<void> {
    for (const detail of details) {
      const quantity = await this.stockRepository.getQuantityByVariantId(detail.variantId);

      if (quantity < detail.quantity) {
        throw new InsufficientStockException(detail.productId, detail.quantity, quantity);
      }
    }
  }
}
