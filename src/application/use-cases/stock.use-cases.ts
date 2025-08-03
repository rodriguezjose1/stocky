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
import { StockMovementUseCases } from './stock-movement.use-cases';
import { StockMovementType, MovementSource, StockMovementStatus } from '../../infrastructure/models/stock-movement.model';
import { AppliedPriceTypeEnum } from '../../domain/entities/sale.entity';

@Injectable()
export class StockUseCases {
  constructor(
    @Inject('StockRepositoryPort')
    private stockRepository: StockRepositoryPort,
    private variantUseCases: VariantUseCases,
    private productUseCases: ProductUseCases,
    private productAttributeUseCases: ProductAttributeUseCases,
    private stockMovementUseCases: StockMovementUseCases,
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
    let isCreated = false;
    try {
      if (!stockDto.date) {
        stockDto.date = new Date();
      }

      const sizeAttribute = await this.productAttributeUseCases.getProductAttributeByLabel(stockDto.variant.size);
      stockDto.variant.size = sizeAttribute?.value || stockDto.variant.size;
      const variant = await this.variantUseCases.getOneBy(stockDto.variant as any);
      const product = await this.productUseCases.getProductById(stockDto.product);

      let variantId = variant ? variant.id : null;
      let stock = null;

      if (!variantId) {
        if (stockDto.quantity <= 0) {
          throw new BadRequestException(QUANTITY_LESS_THAN_CURRENT_TOTAL);
        }
        
        // todo: this is bad, products contians only a array with the size value and not an object with both value and label
        const variantToSave: Variant = {
          id: undefined,
          size: sizeAttribute?.value || stockDto.variant.size,
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
        isCreated = true;

        // Create stock movement for new stock
        await this.stockMovementUseCases.createMovement({
          productId: stock.product,
          variantId: stock.variant,
          stock: stock.id,
          type: StockMovementType.IN,
          quantity: stock.quantity,
          stockBefore: 0,
          stockAfter: stock.quantity,
          source: MovementSource.MANUAL,
          prices: product.prices,
        });
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
          isCreated = true;

          // Create stock movement for new stock with different cost price
          await this.stockMovementUseCases.createMovement({
            productId: stock.product,
            variantId: stock.variant,
            stock: stock.id,
            type: StockMovementType.IN,
            quantity: stock.quantity,
            stockBefore: 0,
            stockAfter: stock.quantity,
            source: MovementSource.MANUAL,
            prices: product.prices,
          });
        } else {
          const diff = stockDB.quantity + stockDto.quantity;
          if (diff < 0) {
            throw new BadRequestException(QUANTITY_LESS_THAN_CURRENT_TOTAL);
          }
          stock = await this.incrementStock(
            stockDB.id, { quantity: stockDto.quantity },
            { type: StockMovementType.IN, source: MovementSource.MANUAL, status: StockMovementStatus.PENDING, saleId: null, clientId: null, appliedPriceType: null },
            session
          );
        }
      }

      return { stock, isCreated };
    } catch (error) {
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

  async incrementStock(
    stockId, { quantity },
    { type, source, status, saleId, clientId, appliedPriceType }: { type: StockMovementType, source: MovementSource, status: StockMovementStatus, saleId: string, clientId: string, appliedPriceType: AppliedPriceTypeEnum },
    session?
  ): Promise<Stock | null> {
    const stock = await this.stockRepository.incrementStock(stockId, quantity, session);
    const product = await this.productUseCases.getProductById(stock.product);

    // Create stock movement for increment
    await this.stockMovementUseCases.createMovement({
      productId: stock.product,
      variantId: stock.variant,
      stock: stock.id,
      quantity: quantity,
      stockBefore: stock.quantity - quantity,
      stockAfter: stock.quantity,
      type,
      source,
      status,
      prices: product.prices,
      saleId,
      clientId,
      appliedPriceType,
    });

    this.eventEmitter.emit('stock.incremented', new StockIncrementedEvent(stockId, stock.product, quantity));
    return stock;
  }

  async decrementStock(productId, variantId, { quantity: decrementAmount, appliedPriceType }, saleId: string = null, clientId: string = null): Promise<StocksUpdated[]> {
    const decremented: StocksUpdated[] = [];
    const stocks = await this.stockRepository.getStockByVariantIdAndProductId(variantId, productId);
    const product = await this.productUseCases.getProductById(stocks[0].product);
    const variant = await this.variantUseCases.getVariantById(variantId);
    let remaining = decrementAmount;

    let quantitySaved = 0;
    for (const stock of stocks) {
      if (remaining <= 0) break;

      const stockBefore = stock.quantity;
      if (stock.quantity >= remaining) {
        stock.quantity -= remaining;
        quantitySaved = remaining;
        remaining = 0;
      } else {
        remaining -= stock.quantity;
        quantitySaved = stock.quantity;
        stock.quantity = 0;
      }

      // Create stock movement for decrement
      await this.stockMovementUseCases.createMovement({
        productId: stock.product,
        variantId: stock.variant,
        stock: stock.id,
        type: StockMovementType.OUT,
        quantity: quantitySaved,
        stockBefore: stockBefore,
        stockAfter: stock.quantity,
        source: MovementSource.SALE,
        status: StockMovementStatus.PENDING,
        prices: product.prices,
        appliedPriceType: appliedPriceType,
        saleId: saleId,
        clientId: clientId,
      });

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
              label: variant.colorLabel,
            },
            {
              name: 'size',
              keyLabel: 'Talle',
              value: variant.size,
              label: variant.sizeLabel,
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
