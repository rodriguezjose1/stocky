import { Inject, Injectable } from '@nestjs/common';
import { ProductVariant } from 'src/domain/entities/product-variant.entity';
import { SaleDetail } from 'src/domain/entities/sale.entity';
import { Variant } from 'src/domain/entities/variant.entity';
import { InsufficientStockException } from 'src/domain/exceptions/insufficient-stock.exception';
import { Stock, UpdateStockDto } from '../../domain/entities/stock.entity';
import { StockRepositoryPort } from '../../domain/ports/stock-repository.port';
import { ProductVariantUseCases } from './product-variant.use-cases';
import { VariantUseCases } from './variant.use-cases';
import mongoose from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class StockUseCases {
  constructor(
    @Inject('StockRepositoryPort')
    private stockRepository: StockRepositoryPort,
    private variantUseCases: VariantUseCases,
    private productVariantUseCases: ProductVariantUseCases,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async getStockByProductId(productId: string): Promise<Stock | null> {
    return this.stockRepository.getByProductId(productId);
  }

  async getAllStocks(): Promise<Stock[]> {
    return this.stockRepository.findAll();
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

      const productVariantExists = await this.productVariantUseCases.existsProductVariant(stockDto.variant);

      let variantId = productVariantExists;
      let stock = null;

      if (!variantId) {
        // save variant
        const variantToSave: Variant = {
          id: undefined,
          product_id: stockDto.product_id,
        };
        const savedVariant = await this.variantUseCases.createVariant(variantToSave);
        variantId = savedVariant.id;

        // save product variants
        const productsVariants: ProductVariant[] = [];
        stockDto.variant.forEach((variant) => {
          productsVariants.push({
            id: undefined,
            variant_id: variantId,
            attribute_type: variant.attributeType,
            attribute_value: variant.attributeValue,
          });
        });
        await this.productVariantUseCases.createManyProductVariants(productsVariants);

        // create stock
        const stockToSave: Stock = {
          id: undefined,
          productId: stockDto.product_id,
          variantId: variantId,
          quantity: stockDto.quantity,
          costPrice: stockDto.cost_price,
          date: stockDto.date,
        };

        stock = await this.stockRepository.create(stockToSave);
      } else {
        // update existing stock
        const stockDB = await this.stockRepository.getStockByVariantId(variantId);
        if (stockDB && stockDB.costPrice !== stockDto.cost_price) {
          // create stock with different cost price
          const stockToSave: Stock = {
            id: undefined,
            productId: stockDto.product_id,
            variantId: variantId,
            quantity: stockDto.quantity,
            costPrice: stockDto.cost_price,
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
