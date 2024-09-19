// infrastructure/adapters/mongoose-stock-repository.adapter.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Stock } from '../../../domain/entities/stock.entity';
import { StockRepositoryPort } from '../../../domain/ports/stock-repository.port';
import { StockModel, StockSchema } from '../../models/stock.model';

@Injectable()
export class MongooseStockRepositoryAdapter implements StockRepositoryPort {
  private stockModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.stockModel = this.connection.model(StockModel.name, StockSchema);
  }

  async findAll(): Promise<Stock[]> {
    const stocks = await this.stockModel.find().exec();
    return stocks.map((stock) => this.mapToEntity(stock));
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
    const updatedStock = await this.stockModel
      .findByIdAndUpdate(id, this.mapToModel(stock), { new: true })
      .exec();
    return updatedStock ? this.mapToEntity(updatedStock) : null;
  }

  async getByProductId(productId: string): Promise<Stock | null> {
    const stock = await this.stockModel
      .findOne({ product_id: productId })
      .exec();
    return stock ? this.mapToEntity(stock) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.stockModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  async incrementStock(id: string, quantity: number): Promise<Stock | null> {
    const updatedStock = await this.stockModel
      .findByIdAndUpdate(id, { $inc: { quantity } }, { new: true })
      .exec();
    return updatedStock ? this.mapToEntity(updatedStock) : null;
  }

  async decrementStock(id: string, quantity: number): Promise<Stock | null> {
    const updatedStock = await this.stockModel
      .findByIdAndUpdate(id, { $inc: { quantity: -quantity } }, { new: true })
      .exec();
    return updatedStock ? this.mapToEntity(updatedStock) : null;
  }

  private mapToEntity(stockModel: StockModel): Stock {
    return new Stock(
      stockModel._id.toString(),
      stockModel.product_id.toString(),
      stockModel.quantity,
    );
  }

  private mapToModel(stock: Partial<Stock>): Partial<StockModel> {
    return {
      product_id: stock.product_id,
      quantity: stock.quantity,
    };
  }
}
