// infrastructure/adapters/mongoose-sale-repository.adapter.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Sale, SaleDetail } from '../../../domain/entities/sale.entity';
import { SaleRepositoryPort } from '../../../domain/ports/sale-repository.port';
import { SaleModel, SaleSchema } from '../../models/sale.model';

@Injectable()
export class MongooseSaleRepositoryAdapter implements SaleRepositoryPort {
  private saleModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.saleModel = this.connection.model(SaleModel.name, SaleSchema);
  }

  async create(sale: Sale): Promise<Sale> {
    const createdSale = new this.saleModel(sale);
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
    const updatedSale = await this.saleModel.findByIdAndUpdate(id, sale, { new: true }).exec();
    return updatedSale ? this.mapToDomain(updatedSale) : null;
  }

  private mapToDomain(saleModel: SaleModel): Sale {
    return new Sale(
      saleModel._id.toString(),
      saleModel.date,
      saleModel.status,
      saleModel.details.map((detail) => new SaleDetail(detail.product_id.toString(), detail.variant_id.toString(), detail.quantity, detail.unit_price)),
    );
  }
}
