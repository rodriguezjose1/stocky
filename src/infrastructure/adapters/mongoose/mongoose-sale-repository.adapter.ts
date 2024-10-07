// infrastructure/adapters/mongoose-sale-repository.adapter.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Sale, SaleDetail, StocksUpdated } from '../../../domain/entities/sale.entity';
import { SaleRepositoryPort } from '../../../domain/ports/sale-repository.port';
import { SaleModel, SaleSchema } from '../../models/sale.model';

@Injectable()
export class MongooseSaleRepositoryAdapter implements SaleRepositoryPort {
  private saleModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.saleModel = this.connection.model(SaleModel.name, SaleSchema);
  }

  async create(sale: Sale): Promise<Sale> {
    const createdSale = new this.saleModel(this.mapToModel(sale));
    const savedSale = await createdSale.save();
    return this.mapToDomain(savedSale);
  }

  async findAll(): Promise<Sale[]> {
    const sales = await this.saleModel.find().exec();
    return sales.map((sale) => this.mapToDomain(sale));
  }

  async findById(id: string): Promise<Sale | null> {
    const sale = await this.saleModel.findById(id).exec();
    return sale ? this.mapToDomain(sale) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.saleModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  async update(id: string, sale: Partial<Sale>): Promise<Sale | null> {
    const updatedSale = await this.saleModel.findByIdAndUpdate(id, this.mapToModel(sale), { new: true }).exec();
    return updatedSale ? this.mapToDomain(updatedSale) : null;
  }

  private mapToDomain(saleModel: SaleModel): Sale {
    return new Sale(
      saleModel._id.toString(),
      saleModel.date,
      saleModel.status,
      saleModel.details.map((detail) => new SaleDetail(detail.product.toString(), detail.variant.toString(), detail.quantity)),
      saleModel.stocks_updated.map((stockUpdated) => new StocksUpdated(stockUpdated.stock.toString(), stockUpdated.quantity, stockUpdated.cost_price)),
    );
  }

  private mapToModel(sale: Partial<Sale>): Partial<SaleModel> {
    return {
      date: sale.date || undefined,
      status: sale.status || undefined,
      details:
        sale.details?.map((detail) => ({
          product: new Types.ObjectId(detail.productId),
          variant: new Types.ObjectId(detail.variantId),
          quantity: detail.quantity,
        })) || undefined,
      stocks_updated:
        sale.stocksUpdated?.map((stockUpdated) => ({
          stock: new Types.ObjectId(stockUpdated.stock),
          quantity: stockUpdated.quantity,
          cost_price: stockUpdated.costPrice,
        })) || undefined,
    };
  }
}
