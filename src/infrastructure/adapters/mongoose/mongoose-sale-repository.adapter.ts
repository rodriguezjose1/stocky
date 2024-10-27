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

  async findAll({ page, limit }: { page: number; limit: number }): Promise<any> {
    const sales = await this.saleModel
      .find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await this.saleModel.countDocuments().exec();

    return {
      sales: sales.map((sale) => this.mapToDomain(sale)),
      total,
    };
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
      saleModel.details.map(
        (detail) =>
          new SaleDetail(detail.product.toString(), detail.variant.toString(), detail.quantity, detail.prices, {
            productName: detail.variant_data.product_name,
            productCode: detail.variant_data.product_code,
            variantAttributes: detail.variant_data.variant_attributes,
          }),
      ),
      saleModel.stocks_updated.map((stockUpdated) => new StocksUpdated(stockUpdated.stock.toString(), stockUpdated.quantity, stockUpdated.prices)),
      saleModel.user,
      saleModel.cart ? saleModel.cart.toString() : null,
      saleModel.weekCode,
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
          variant_data: {
            product_name: detail.variantData.productName,
            product_code: detail.variantData.productCode,
            variant_attributes: detail.variantData.variantAttributes,
          },
          quantity: detail.quantity,
          prices: detail.prices,
        })) || undefined,
      stocks_updated:
        sale.stocksUpdated?.map((stockUpdated) => ({
          stock: new Types.ObjectId(stockUpdated.stock),
          quantity: stockUpdated.quantity,
          prices: stockUpdated.prices,
        })) || undefined,
      cart: sale.cartId ? new Types.ObjectId(sale.cartId) : undefined,
      user: sale.user || undefined,
      weekCode: sale.weekCode || undefined,
    };
  }
}
