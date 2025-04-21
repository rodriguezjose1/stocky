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

  async findMonthlySalesStats(month?: number, year?: number): Promise<{
    totalSales: number;
    totalTransactions: number;
    totalCosts: number;
    totalProfit: number;
    totalProductsSold: number;
    averageSaleAmount: number;
    averageProfitPerTransaction: number;
  }> {
    // Obtener el primer día del mes especificado o el mes actual
    const now = new Date();
    const targetMonth = month !== undefined ? month - 1 : now.getMonth();
    const targetYear = year !== undefined ? year : now.getFullYear();
    const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0);

    const result = await this.saleModel.aggregate([
      {
        $match: {
          date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
          status: SaleStatus.APPROVED
        }
      },
      {
        $unwind: '$stocks_updated'
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $addToSet: '$_id' },
          totalProductsSold: { $sum: '$stocks_updated.quantity' },
          totalCosts: {
            $sum: {
              $multiply: [
                '$stocks_updated.quantity',
                { $ifNull: ['$stocks_updated.prices.cost', 0] }
              ]
            }
          },
          totalSales: {
            $sum: {
              $multiply: [
                '$stocks_updated.quantity',
                {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ['$stocks_updated.applied_price_type', 'retail'] },
                        then: { $ifNull: ['$stocks_updated.prices.retail', 0] }
                      },
                      {
                        case: { $eq: ['$stocks_updated.applied_price_type', 'reseller'] },
                        then: { $ifNull: ['$stocks_updated.prices.reseller', 0] }
                      },
                      {
                        case: { $eq: ['$stocks_updated.applied_price_type', 'wholesale'] },
                        then: {
                          $cond: {
                            if: { $eq: [{ $type: '$stocks_updated.prices.wholesale' }, 'object'] },
                            then: {
                              $cond: {
                                if: { $eq: ['$stocks_updated.quantity', 6] },
                                then: { $ifNull: ['$stocks_updated.prices.wholesale.half_dozen', 0] },
                                else: { $ifNull: ['$stocks_updated.prices.wholesale.dozen', 0] }
                              }
                            },
                            else: { $ifNull: ['$stocks_updated.prices.wholesale', 0] }
                          }
                        }
                      },
                      {
                        case: { $or: [
                          { $eq: ['$stocks_updated.applied_price_type', null] },
                          { $eq: ['$stocks_updated.applied_price_type', undefined] }
                        ]},
                        then: { $ifNull: ['$stocks_updated.prices.reseller', 0] }
                      }
                    ],
                    default: { $ifNull: ['$stocks_updated.prices.reseller', 0] }
                  }
                }
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalSales: 1,
          totalTransactions: { $size: '$totalTransactions' },
          totalCosts: 1,
          totalProfit: { $subtract: ['$totalSales', '$totalCosts'] },
          totalProductsSold: 1,
          averageSaleAmount: {
            $cond: [
              { $gt: [{ $size: '$totalTransactions' }, 0] },
              { $divide: ['$totalSales', { $size: '$totalTransactions' }] },
              0
            ]
          },
          averageProfitPerTransaction: {
            $cond: [
              { $gt: [{ $size: '$totalTransactions' }, 0] },
              { $divide: [{ $subtract: ['$totalSales', '$totalCosts'] }, { $size: '$totalTransactions' }] },
              0
            ]
          }
        }
      }
    ]);

    // Si no hay resultados, devolver valores por defecto
    if (!result.length) {
      return {
        totalSales: 0,
        totalTransactions: 0,
        totalCosts: 0,
        totalProfit: 0,
        totalProductsSold: 0,
        averageSaleAmount: 0,
        averageProfitPerTransaction: 0
      };
    }

    return result[0];
  }

  async findMonthlySalesDetail(month?: number, year?: number): Promise<any[]> {
    const now = new Date();
    const targetMonth = month !== undefined ? month - 1 : now.getMonth();
    const targetYear = year !== undefined ? year : now.getFullYear();
    const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0);

    const sales = await this.saleModel.aggregate([
      {
        $match: {
          date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
          status: SaleStatus.APPROVED
        }
      },
      {
        $unwind: {
          path: '$stocks_updated',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          saleId: '$_id',
          date: 1,
          productId: '$stocks_updated.stock',
          quantity: '$stocks_updated.quantity',
          appliedPriceType: { $ifNull: ['$stocks_updated.applied_price_type', 'reseller'] },
          productName: '$stocks_updated.variant_data.product_name',
          productCode: '$stocks_updated.variant_data.product_code',
          variantAttributes: { $ifNull: ['$stocks_updated.variant_data.variant_attributes', []] },
          sellerId: '$user.id',
          sellerName: { $concat: ['$user.name', ' ', '$user.lastname'] },
          cost: { $ifNull: ['$stocks_updated.prices.cost', 0] },
          retailPrice: { $ifNull: ['$stocks_updated.prices.retail', 0] },
          resellerPrice: { $ifNull: ['$stocks_updated.prices.reseller', 0] },
          wholesaleHalfDozen: { $ifNull: ['$stocks_updated.prices.wholesale.half_dozen', 0] },
          wholesaleDozen: { $ifNull: ['$stocks_updated.prices.wholesale.dozen', 0] }
        }
      },
      {
        $addFields: {
          wholesalePrice: {
            $cond: [
              { $eq: ['$quantity', 6] },
              '$wholesaleHalfDozen',
              '$wholesaleDozen'
            ]
          }
        }
      },
      {
        $addFields: {
          unitPrice: {
            $switch: {
              branches: [
                { case: { $eq: ['$appliedPriceType', 'retail'] }, then: '$retailPrice' },
                { case: { $eq: ['$appliedPriceType', 'reseller'] }, then: '$resellerPrice' },
                { case: { $eq: ['$appliedPriceType', 'wholesale'] }, then: '$wholesalePrice' }
              ],
              default: '$resellerPrice'
            }
          }
        }
      },
      {
        $addFields: {
          totalCost: { $multiply: ['$cost', '$quantity'] },
          totalSale: { $multiply: ['$unitPrice', '$quantity'] },
          profit: { $subtract: [{ $multiply: ['$unitPrice', '$quantity'] }, { $multiply: ['$cost', '$quantity'] }] }
        }
      },
      {
        $addFields: {
          profitMargin: {
            $cond: [
              { $gt: ['$totalCost', 0] },
              { $multiply: [{ $divide: ['$profit', '$totalCost'] }, 100] },
              0
            ]
          }
        }
      },
      {
        $addFields: {
          // Extraer color y talle de los atributos de variante
          color: {
            $let: {
              vars: {
                colorAttr: {
                  $filter: {
                    input: '$variantAttributes',
                    as: 'attr',
                    cond: { $eq: ['$$attr.name', 'color'] }
                  }
                }
              },
              in: {
                $cond: [
                  { $gt: [{ $size: '$$colorAttr' }, 0] },
                  { $arrayElemAt: ['$$colorAttr.label', 0] },
                  ''
                ]
              }
            }
          },
          size: {
            $let: {
              vars: {
                sizeAttr: {
                  $filter: {
                    input: '$variantAttributes',
                    as: 'attr',
                    cond: { $eq: ['$$attr.name', 'size'] }
                  }
                }
              },
              in: {
                $cond: [
                  { $gt: [{ $size: '$$sizeAttr' }, 0] },
                  { $arrayElemAt: ['$$sizeAttr.value', 0] },
                  ''
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          saleId: 1,
          date: 1,
          productId: 1,
          quantity: 1,
          appliedPriceType: 1,
          productName: 1,
          productCode: 1,
          variantName: 1,
          variantCode: 1,
          color: 1,
          size: 1,
          sellerId: 1,
          sellerName: 1,
          cost: 1,
          unitPrice: 1,
          totalCost: 1,
          totalSale: 1,
          profit: 1,
          profitMargin: 1
        }
      },
      {
        $sort: { date: -1 }
      }
    ]);

    return sales;
  }

  protected mapToDomain(saleModel: SaleModel): Sale {
    return new Sale(
      saleModel._id.toString(),
      saleModel.date,
      saleModel.status,
      saleModel.details.map(
        (detail) => {
          if (detail.variant) {
            return new SaleDetail(
              detail.product.toString(),
              detail.variant?.toString() || null,
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
              detail.is_wholesale_package,
              detail.predefined_quantity,
              [],
              detail.applied_price_type
            );
          } else {
            return new SaleDetail(
              detail.product.toString(),
              null,
              detail.quantity,
              {
                retail: detail.prices.retail,
                reseller: detail.prices.reseller,
                wholesale: detail.prices.wholesale,
              },
              null,
              true,
              detail.predefined_quantity,
              detail.wholesale_variants.map((v) => ({
                variant: {
                  productName: v.variant.product_name,
                  productCode: v.variant.product_code,
                  variantId: v.variant.variant_id.toString(),
                  variantAttributes: v.variant.variant_attributes.map((variantAttribute) => {
                    return {
                      name: variantAttribute.name,
                      value: variantAttribute.value,
                      label: variantAttribute.label,
                      keyLabel: variantAttribute.key_label,
                    };
                  }),
                },
                quantity: v.quantity,
              })),
              detail.applied_price_type
            );
          }
        }),
      saleModel.stocks_updated.map((stockUpdated) => new StocksUpdated(stockUpdated.stock.toString(),
        {
          productName: stockUpdated.variant_data?.product_name || '',
          productCode: stockUpdated.variant_data?.product_code || '',
          variantId: stockUpdated.variant_data?.variant_id.toString() || '',
          variantAttributes: stockUpdated.variant_data?.variant_attributes?.map((attribute) => ({
            name: attribute.name,
            value: attribute.value,
            label: attribute.label,
            keyLabel: attribute.key_label,
          })) || [],
        },
        stockUpdated.quantity,
        stockUpdated.prices
      )),
      {
        id: saleModel.user.id,
        name: saleModel.user.name,
        lastname: saleModel.user.lastname,
      },
      saleModel.cart ? saleModel.cart.toString() : null,
      saleModel.weekCode,
    );
  }

  protected mapDetailsToDomain(details: SaleDetailSchema[]): SaleDetail[] {
    return details.map(
      (detail) => {
        if (detail.variant) {
          return new SaleDetail(detail.product.toString(), detail.variant.toString(), detail.quantity, detail.prices, {
            productName: detail.variant_data.product_name,
            productCode: detail.variant_data.product_code,
            variantAttributes: detail.variant_data.variant_attributes.map((attribute) => ({
              name: attribute.name,
              value: attribute.value,
              label: attribute.label,
              keyLabel: attribute.key_label,
            })),
          }, detail.is_wholesale_package, detail.predefined_quantity, [], detail.applied_price_type);
        } else {
          return new SaleDetail(detail.product.toString(), null, detail.quantity, detail.prices, null, true, detail.predefined_quantity, detail.wholesale_variants.map((v) => ({
            variant: {
              productName: v.variant.product_name,
              productCode: v.variant.product_code,
              variantId: v.variant.variant_id.toString(),
              variantAttributes: v.variant.variant_attributes.map((variantAttribute) => {
                return {
                  name: variantAttribute.name,
                  value: variantAttribute.value,
                  label: variantAttribute.label,
                  keyLabel: variantAttribute.key_label,
                };
              }),
            },
            quantity: v.quantity,
          })), detail.applied_price_type);
        }
      }
    );
  }

  protected mapToModel(sale: Partial<Sale>): Partial<SaleModel> {
    const mappedSale: Partial<SaleModel> = {};

    if (sale.date) mappedSale.date = sale.date;
    if (sale.status) mappedSale.status = sale.status;
    if (sale.weekCode) mappedSale.weekCode = sale.weekCode;
    if (sale.cartId) mappedSale.cart = new Types.ObjectId(sale.cartId);
    if (sale.user) mappedSale.user = sale.user;

    if (sale.details?.length) {
      mappedSale.details = sale.details.map((detail) => ({
        product: new Types.ObjectId(detail.productId),
        variant: detail.variantId ? new Types.ObjectId(detail.variantId) : null,
        variant_data: detail.variantData?.productCode ? {
          product_name: detail.variantData.productName,
          product_code: detail.variantData.productCode,
          variant_id: new Types.ObjectId(detail.variantId),
          variant_attributes: detail.variantData.variantAttributes.map((attribute) => ({
            name: attribute.name,
            value: attribute.value,
            label: attribute.label,
            key_label: attribute.keyLabel,
          })),
        } : null,
        quantity: detail.quantity,
        prices: detail.prices,
        is_wholesale_package: detail.isWholesalePackage || false,
        predefined_quantity: detail.predefinedQuantity || 0,
        applied_price_type: detail.appliedPriceType,
        wholesale_variants: detail.wholesaleVariants?.length ? detail.wholesaleVariants.map((variant) => ({
          variant: {
            product_name: variant.variant.productName,
            product_code: variant.variant.productCode,
            variant_id: new Types.ObjectId(variant.variant.variantId),
            variant_attributes: variant.variant.variantAttributes.map((attribute) => ({
              name: attribute.name,
              value: attribute.value,
              label: attribute.label,
              key_label: attribute.keyLabel,
            })),
          },
          quantity: variant.quantity,
        })) : [],
      }));
    }

    if (sale.stocksUpdated?.length) {
      mappedSale.stocks_updated = sale.stocksUpdated.map((stockUpdated) => ({
        stock: new Types.ObjectId(stockUpdated.stock),
        variant_data: {
          product_name: stockUpdated.variantData?.productName || '',
          product_code: stockUpdated.variantData?.productCode || '',
          variant_id: new Types.ObjectId(stockUpdated.variantData?.variantId || ''),
          variant_attributes: stockUpdated.variantData?.variantAttributes?.map((attribute) => ({
            name: attribute.name,
            value: attribute.value,
            label: attribute.label,
            key_label: attribute.keyLabel,
          })) || [],
        },
        quantity: stockUpdated.quantity,
        prices: stockUpdated.prices,
        applied_price_type: stockUpdated.appliedPriceType,
      }));
    }

    return mappedSale;
  }
}
