// infrastructure/adapters/mongoose-sale-repository.adapter.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Sale, SaleDetail, SaleStatus, StocksUpdated } from '../../../domain/entities/sale.entity';
import { SaleRepositoryPort } from '../../../domain/ports/sale-repository.port';
import { SaleDetailSchema, SaleModel, SaleSchema } from '../../models/sale.model';
import { getWeekCode } from 'src/common/utils/date.utils';

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

  async findAll({ userId, page, limit }: { userId: string; page: number; limit: number }): Promise<any> {
    const filter: any = {};
    console.log(userId);

    if (userId) {
      filter['user.id'] = userId;
    }

    const sales = await this.saleModel
      .find({ ...filter })
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

  async findSellersWithSalesInCurrentWeek(): Promise<Sale[]> {
    return this.saleModel.aggregate([
      {
        $match: {
          weekCode: getWeekCode(new Date()),
          status: SaleStatus.APPROVED,
        },
      },
      {
        $group: {
          _id: '$user.id',
          user: { $first: '$user' },
        },
      },
      {
        $sort: {
          name: 1,
        },
      },
      {
        $project: {
          _id: 0,
          id: '$user.id',
          name: '$user.name',
          lastname: '$user.lastname',
        },
      },
    ]);
  }

  async findProductsBySellerId(sellerId: string): Promise<any> {
    const sales = await this.saleModel.find({ 'user.id': sellerId, status: SaleStatus.APPROVED }).lean();

    const products = {};

    sales.forEach((sale) => {
      sale.details.forEach((detail) => {
        const code = `${detail.product}-${detail.variant}`;

        if (products[code]) {
          products[code].quantity += detail.quantity;
        } else {
          products[code] = { ...detail, quantity: detail.quantity };
        }
      });
    });

    const orderedProducts: any = Object.values(products).sort((a: any, b: any) => b.quantity - a.quantity);

    return this.mapDetailsToDomain(Object.values(orderedProducts));
  }

  async findGroupedProductsInCurrentWeek(): Promise<any> {
    const sales = await this.saleModel
      .find({
        weekCode: getWeekCode(new Date()),
        status: SaleStatus.APPROVED,
      })
      .lean();

    const products = {};

    sales.forEach((sale) => {
      sale.details.forEach((detail) => {
        const code = `${detail.product}-${detail.variant}`;

        if (products[code]) {
          products[code].quantity += detail.quantity;
        } else {
          products[code] = { ...detail, quantity: detail.quantity };
        }
      });
    });

    // sort by quantity desc
    const orderedProducts: any = Object.values(products).sort((a: any, b: any) => b.quantity - a.quantity);

    return this.mapDetailsToDomain(Object.values(orderedProducts));
  }

  private mapToDomain(saleModel: SaleModel): Sale {
    return new Sale(
      saleModel._id.toString(),
      saleModel.date,
      saleModel.status,
      saleModel.details.map(
        (detail) =>
          new SaleDetail(
            detail.product.toString(),
            detail.variant.toString(),
            detail.quantity,
            {
              retail: detail.prices.retail,
              reseller: detail.prices.reseller,
              wholesale: detail.prices.wholesale,
            },
            {
              productName: detail.variant_data.product_name,
              productCode: detail.variant_data.product_code,
              variantAttributes: detail.variant_data.variant_attributes.map((attribute) => ({
                name: attribute.name,
                value: attribute.value,
                label: attribute.label,
                keyLabel: attribute.key_label,
              })),
            },
          ),
      ),
      saleModel.stocks_updated.map((stockUpdated) => new StocksUpdated(stockUpdated.stock.toString(), stockUpdated.quantity, stockUpdated.prices)),
      {
        id: saleModel.user.id,
        name: saleModel.user.name,
        lastname: saleModel.user.lastname,
      },
      saleModel.cart ? saleModel.cart.toString() : null,
      saleModel.weekCode,
    );
  }

  private mapDetailsToDomain(details: SaleDetailSchema[]): SaleDetail[] {
    return details.map(
      (detail) =>
        new SaleDetail(detail.product.toString(), detail.variant.toString(), detail.quantity, detail.prices, {
          productName: detail.variant_data.product_name,
          productCode: detail.variant_data.product_code,
          variantAttributes: detail.variant_data.variant_attributes.map((attribute) => ({
            name: attribute.name,
            value: attribute.value,
            label: attribute.label,
            keyLabel: attribute.key_label,
          })),
        }),
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
            variant_attributes: detail.variantData.variantAttributes.map((attribute) => ({
              name: attribute.name,
              value: attribute.value,
              label: attribute.label,
              key_label: attribute.keyLabel,
            })),
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
