import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { SaleDetail, StocksUpdated } from 'src/domain/entities/sale.entity';
import { Variant } from 'src/domain/entities/variant.entity';
import { InsufficientStockException } from 'src/domain/exceptions/insufficient-stock.exception';
import { ReqGetStocksDto, ResGetStocksDto, Stock, UpdateStockDto, IncrementStockDto, DecrementStockDto } from '../../domain/entities/stock.entity';
import { StockRepositoryPort } from '../../domain/ports/stock-repository.port';
import { VariantUseCases } from './variant.use-cases';
import { ProductUseCases } from './product.use-cases';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StockCreatedEvent, StockDecrementedEvent, StockIncrementedEvent } from 'src/async-events/events/stock.events';
import { DEFAULT_ERROR, QUANTITY_LESS_THAN_CURRENT_TOTAL } from '../error.constants';
import { StockMovementUseCases } from './stock-movement.use-cases';

@Injectable()
export class StockUseCases {
  constructor(
    @Inject('StockRepositoryPort')
    private stockRepository: StockRepositoryPort,
    private variantUseCases: VariantUseCases,
    private productUseCases: ProductUseCases,
    private eventEmitter: EventEmitter2,
    private stockMovementUseCases: StockMovementUseCases,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async getStockByProductId(productId: string): Promise<Stock[] | null> {
    return this.stockRepository.getByProductId(productId);
  }

  async getAllStocks(query: ReqGetStocksDto): Promise<ResGetStocksDto> {
    return this.stockRepository.findAll(query);
  }

  async getStockById(id: string): Promise<Stock | null> {
    return this.stockRepository.findById(id);
  }

  async createStockMultiple(stocksDto: UpdateStockDto[]): Promise<Stock[]> {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const stocks: Stock[] = [];
      const errors = [];
      const createdStocks: Stock[] = [];
      for (const [index, stock] of stocksDto.entries()) {
        try {
          for (const color of stock.variant.color) {
            for (const size of stock.variant.size) {
              const createdStock = await this.createStock(
                {
                  ...stock,
                  variant: { id: stock.variant.id, color, size },
                },
                session,
              );
              stocks.push(createdStock.stock);
              if (createdStock.isCreated) {
                createdStocks.push(createdStock.stock);
              }
            }
          }
        } catch (err) {
          errors.push({ index, error: err.message || DEFAULT_ERROR });
        }
      }

      if (errors.length > 0) {
        throw new BadRequestException({ message: 'Error creating stocks', errors });
      }
      await session.commitTransaction();

      if (createdStocks.length > 0) {
        for (const stock of createdStocks) {
          this.eventEmitter.emit('stock.created', new StockCreatedEvent(stock.id));
        }
      }

      return stocks;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async createStock(stockDto: UpdateStockDto, session?): Promise<{ stock: Stock; isCreated: boolean }> {
    let isCreated = false;
    try {
      if (!stockDto.date) {
        stockDto.date = new Date();
      }

      const variant = await this.variantUseCases.getOneBy(stockDto.variant as any);

      let variantId = variant ? variant.id : null;
      let stock = null;

      if (!variantId) {
        if (stockDto.quantity <= 0) {
          throw new BadRequestException(QUANTITY_LESS_THAN_CURRENT_TOTAL);
        }
        // save variant
        const variantToSave: Variant = {
          id: undefined,
          size: stockDto.variant.size,
          color: stockDto.variant.color,
        };
        const savedVariant = await this.variantUseCases.createVariant(variantToSave, session);
        variantId = savedVariant.id;

        // create stock
        const stockToSave: Stock = {
          id: undefined,
          product: stockDto.product,
          variant: variantId,
          quantity: stockDto.quantity,
          costPrice: stockDto.costPrice,
          date: stockDto.date,
          userId: stockDto.userId,
        };

        stock = await this.stockRepository.create(stockToSave, session);
        isCreated = true;

        // Track stock movement for new stock
        await this.stockMovementUseCases.createIncrementMovement(
          stockDto.product,
          variantId,
          0,
          stockDto.quantity,
          stockDto.costPrice,
          'Initial stock creation',
          stockDto.userId,
        );
      } else {
        // update existing stock
        const stockDB = await this.stockRepository.getByVariantAndProductAndCostPriceWithQuantity(stockDto.product, variantId, stockDto.costPrice);
        if (!stockDB) {
          if (stockDto.quantity <= 0) {
            throw new BadRequestException(QUANTITY_LESS_THAN_CURRENT_TOTAL);
          }
          // create stock with different cost price
          const stockToSave: Stock = {
            id: undefined,
            product: stockDto.product,
            variant: variantId,
            quantity: stockDto.quantity,
            costPrice: stockDto.costPrice,
            date: stockDto.date,
            userId: stockDto.userId,
          };

          stock = await this.stockRepository.create(stockToSave, session);
          isCreated = true;

          // Track stock movement for new stock with different cost price
          await this.stockMovementUseCases.createIncrementMovement(
            stockDto.product,
            variantId,
            0,
            stockDto.quantity,
            stockDto.costPrice,
            'New stock with different cost price',
            stockDto.userId,
          );
        } else {
          const diff = stockDB.quantity + stockDto.quantity;
          if (diff <= 0) {
            throw new BadRequestException(QUANTITY_LESS_THAN_CURRENT_TOTAL);
          }
          stock = await this.incrementStock(stockDB.id, { quantity: stockDto.quantity, userId: stockDto.userId }, session);
        }
      }

      return { stock, isCreated };
    } catch (error) {
      console.log('create-stock-error', JSON.stringify(error));
      throw error;
    }
  }

  async updateStock(id: string, stock: Partial<Stock>): Promise<Stock | null> {
    return this.stockRepository.update(id, stock);
  }

  async deleteStock(id: string): Promise<boolean> {
    return this.stockRepository.delete(id);
  }

  async incrementStock(stockId: string, incrementDto: IncrementStockDto, session?): Promise<Stock | null> {
    const stock = await this.stockRepository.incrementStock(stockId, incrementDto.quantity, session);
    
    // Track stock movement for increment
    await this.stockMovementUseCases.createIncrementMovement(
      stock.product,
      stock.variant,
      stock.quantity - incrementDto.quantity,
      stock.quantity,
      stock.costPrice,
      'Stock increment',
      incrementDto.userId,
    );

    this.eventEmitter.emit('stock.incremented', new StockIncrementedEvent(stockId));
    return stock;
  }

  async decrementStock(productId: string, variantId: string, decrementDto: DecrementStockDto): Promise<StocksUpdated[]> {
    const decremented: StocksUpdated[] = [];
    const stocks = await this.stockRepository.getStockByVariantIdAndProductId(variantId, productId);
    const product = await this.productUseCases.getProductById(stocks[0].product);

    let remaining = decrementDto.quantity;

    let quantitySaved = 0;
    for (const stock of stocks) {
      if (remaining <= 0) break;

      if (stock.quantity >= remaining) {
        stock.quantity -= remaining;
        quantitySaved = remaining;
        remaining = 0;
      } else {
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

      // Track stock movement for decrement
      await this.stockMovementUseCases.createDecrementMovement(
        productId,
        variantId,
        stock.quantity + quantitySaved,
        stock.quantity,
        stock.costPrice,
        'Stock decrement',
        decrementDto.userId,
      );

      // Guardamos los cambios en la base de datos
      await this.stockRepository.update(stock.id, { quantity: stock.quantity });
    }

    this.eventEmitter.emit('stock.decremented', new StockDecrementedEvent(product.id));

    return decremented;
  }

  public async checkStock(details: SaleDetail[]): Promise<void> {
    for (const detail of details) {
      const quantity = await this.stockRepository.getQuantityByVariantId(detail.productId, detail.variantId);

      if (quantity < detail.quantity) {
        throw new InsufficientStockException(detail.productId, detail.quantity, quantity);
      }
    }
  }

  public async getQuantityByVariantId(productId: string, variantId: string): Promise<number> {
    return this.stockRepository.getQuantityByVariantId(productId, variantId);
  }
}
