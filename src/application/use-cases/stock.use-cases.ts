import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { SaleDetail, StocksUpdated } from 'src/domain/entities/sale.entity';
import { Variant } from 'src/domain/entities/variant.entity';
import { InsufficientStockException } from 'src/domain/exceptions/insufficient-stock.exception';
import { ReqGetStocksDto, ResGetStocksDto, Stock, UpdateStockDto } from '../../domain/entities/stock.entity';
import { StockRepositoryPort } from '../../domain/ports/stock-repository.port';
import { VariantUseCases } from './variant.use-cases';
import { ProductUseCases } from './product.use-cases';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StockCreatedEvent, StockDecrementedEvent, StockIncrementedEvent } from 'src/async-events/events/stock.events';
import { DEFAULT_ERROR, QUANTITY_LESS_THAN_CURRENT_TOTAL } from '../error.constants';
import { ProductAttributeUseCases } from './product-attribute.use-cases';

@Injectable()
export class StockUseCases {
  constructor(
    @Inject('StockRepositoryPort')
    private stockRepository: StockRepositoryPort,
    private variantUseCases: VariantUseCases,
    private productUseCases: ProductUseCases,
    private productAttributeUseCases: ProductAttributeUseCases,
    private eventEmitter: EventEmitter2,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) { }

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
    // const session = await this.connection.startSession();
    let isCreated = false;
    try {
      // session.startTransaction();

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
        };

        stock = await this.stockRepository.create(stockToSave, session);
        // this.eventEmitter.emit('stock.created', new StockCreatedEvent(stock.id));
        isCreated = true;
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
          };

          stock = await this.stockRepository.create(stockToSave, session);
          // this.eventEmitter.emit('stock.created', new StockCreatedEvent(stock.id));
          isCreated = true;
        } else {
          const diff = stockDB.quantity + stockDto.quantity;
          if (diff < 0) {
            throw new BadRequestException(QUANTITY_LESS_THAN_CURRENT_TOTAL);
          }
          stock = await this.incrementStock(stockDB.id, { quantity: stockDto.quantity }, session);
        }
      }

      // await session.commitTransaction();

      return { stock, isCreated };
    } catch (error) {
      // await session.abortTransaction();
      console.log('create-stock-error', error);
      throw error;
    }
  }

  async updateStock(id: string, stock: Partial<Stock>): Promise<Stock | null> {
    return this.stockRepository.update(id, stock);
  }

  async deleteStock(id: string): Promise<boolean> {
    return this.stockRepository.delete(id);
  }

  async incrementStock(stockId, { quantity }, session?): Promise<Stock | null> {
    const stock = await this.stockRepository.incrementStock(stockId, quantity, session);
    this.eventEmitter.emit('stock.incremented', new StockIncrementedEvent(stockId, stock.product, quantity));
    return stock;
  }

  async decrementStock(productId, variantId, { quantity: decrementAmount, appliedPriceType }): Promise<StocksUpdated[]> {
    const decremented: StocksUpdated[] = [];
    const stocks = await this.stockRepository.getStockByVariantIdAndProductId(variantId, productId);
    const product = await this.productUseCases.getProductById(stocks[0].product);
    const variant = await this.variantUseCases.getVariantById(variantId);
    const colorAttribute = await this.productAttributeUseCases.getProductAttributeByValue(variant.color);
    const sizeAttribute = await this.productAttributeUseCases.getProductAttributeByValue(variant.size);
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
        variantData: {
          productName: product.name,
          productCode: product.code,
          variantId: variant.id,
          variantAttributes: [
            {
              name: 'color',
              keyLabel: 'Color',
              value: variant.color,
              label: colorAttribute ? colorAttribute.label : variant.color,
            },
            {
              name: 'size',
              keyLabel: 'Talle',
              value: variant.size,
              label: sizeAttribute ? sizeAttribute.label : variant.size,
            },
          ],
        },
        quantity: quantitySaved,
        prices: {
          cost: stock.costPrice,
          retail: product.prices.retail,
          reseller: product.prices.reseller,
          wholesale: product.prices.wholesale,
        },
        appliedPriceType,
      });

      // Guardamos los cambios en la base de datos
      await this.stockRepository.update(stock.id, { quantity: stock.quantity });
    }

    this.eventEmitter.emit('stock.decremented', new StockDecrementedEvent(product.id, decrementAmount));

    return decremented;
  }

  public async checkStock(details: SaleDetail[]): Promise<void> {
    // Agrupar detalles por productId y variantId usando un objeto para simplificar
    const stockMap = new Map<string, number>();

    // Agrupar todas las cantidades por producto y variante
    for (const detail of details) {
      if (detail.variantId !== null) {
        // Producto con variante específica
        const key = `${detail.productId}-${detail.variantId}`;
        stockMap.set(key, (stockMap.get(key) || 0) + detail.quantity);
      } else if (detail.wholesaleVariants?.length > 0) {
        // Producto complejo con variantes mayoristas
        for (const variant of detail.wholesaleVariants) {
          const key = `${detail.productId}-${variant.variant._id}`;
          stockMap.set(key, (stockMap.get(key) || 0) + variant.quantity);
        }
      }
    }

    // Verificar el stock para cada grupo
    for (const [key, totalQuantity] of stockMap.entries()) {
      const [productId, variantId] = key.split('-');
      const availableStock = await this.stockRepository.getQuantityByVariantId(productId, variantId);
      const stockValue = Number(availableStock);
      const requestedValue = Number(totalQuantity);
      
      if (!isNaN(stockValue) && !isNaN(requestedValue) && stockValue < requestedValue) {
        throw new InsufficientStockException(productId, requestedValue, stockValue);
      }
    }
  }

  public async getQuantityByVariantId(productId: string, variantId: string): Promise<number> {
    return this.stockRepository.getQuantityByVariantId(productId, variantId);
  }
}
