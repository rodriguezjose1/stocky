// infrastructure/adapters/mongoose-stock-repository.adapter.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { ReqGetStocksDto, ResGetStocksDto, Stock } from '../../../domain/entities/stock.entity';
import { StockRepositoryPort } from '../../../domain/ports/stock-repository.port';
import { StockModel, StockSchema } from '../../models/stock.model';

@Injectable()
export class MongooseStockRepositoryAdapter implements StockRepositoryPort {
  private stockModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.stockModel = this.connection.model(StockModel.name, StockSchema);
  }

  async findAll(query: ReqGetStocksDto): Promise<ResGetStocksDto> {
    const skip = (query.page - 1) * query.limit;

    const stocks = await this.stockModel.aggregate([
      {
        $lookup: {
          from: 'variants',
          localField: 'variant',
          foreignField: '_id',
          as: 'variant',
        },
      },
      { $unwind: '$variant' },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $skip: skip,
      },
      {
        $limit: query.limit,
      },
    ]);

    const total = await this.stockModel.countDocuments().exec();
    return { stocks: stocks.map((stock) => this.mapToEntity(stock)), total };
  }

  async findById(id: string): Promise<Stock | null> {
    const stock = await this.stockModel.findById(id).exec();
    return stock ? this.mapToEntity(stock) : null;
  }

  async create(stock: Stock): Promise<Stock> {
    const newStock = new this.stockModel(this.mapToModel(stock));
    const savedStock = await newStock.save();
    return this.mapToEntity(savedStock);
  }

  async update(id: string, stock: Partial<Stock>): Promise<Stock | null> {
    const updatedStock = await this.stockModel.findByIdAndUpdate(id, this.mapToModel(stock), { new: true }).exec();
    return updatedStock ? this.mapToEntity(updatedStock) : null;
  }

  async getByProductId(productId: string): Promise<Stock | null> {
    const stock = await this.stockModel.findOne({ product_id: productId }).exec();
    return stock ? this.mapToEntity(stock) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.stockModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  async incrementStock(id: string, quantity: number): Promise<Stock | null> {
    const updatedStock = await this.stockModel.findByIdAndUpdate(id, { $inc: { quantity } }, { new: true }).exec();
    return updatedStock ? this.mapToEntity(updatedStock) : null;
  }

  async decrementStock(id: string, quantity: number): Promise<Stock | null> {
    const updatedStock = await this.stockModel.findByIdAndUpdate(id, { $inc: { quantity: -quantity } }, { new: true }).exec();
    return updatedStock ? this.mapToEntity(updatedStock) : null;
  }

  async getByVariantAndCostPriceWithQuantity(variantId: string, costPrice: number) {
    const stock = await this.stockModel
      .findOne({
        variant_id: variantId,
        cost_price: costPrice,
        quantity: { $gt: 0 },
      })
      .exec();
    return stock ? this.mapToEntity(stock) : null;
  }

  async getStockByVariantId(variantId: string): Promise<Stock[]> {
    const stocks = await this.stockModel.find({ variant: variantId }).sort({ createdAt: 1 }).exec();
    return stocks ? stocks.map((stock) => this.mapToEntity(stock)) : null;
  }

  async getQuantityByVariantId(variantId: string): Promise<number> {
    const stock = await this.stockModel.aggregate([
      {
        $match: {
          variant: new Types.ObjectId(variantId),
        },
      },
      {
        $group: {
          _id: '$variant',
          quantity: { $sum: '$quantity' },
        },
      },
    ]);

    return stock[0] ? stock[0].quantity : 0;
  }

  private mapToEntity(stockModel: StockModel): Stock {
    return new Stock(stockModel._id.toString(), stockModel.product, stockModel.variant, stockModel.quantity, stockModel.cost_price, stockModel.date);
  }

  private mapToModel(stock: Partial<Stock>): Partial<StockModel> {
    return {
      product: stock.product ? new Types.ObjectId(stock.product) : undefined,
      variant: stock.variant ? new Types.ObjectId(stock.variant) : undefined,
      cost_price: stock.costPrice,
      quantity: stock.quantity,
      date: stock.date,
    };
  }
}
