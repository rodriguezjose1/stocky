// infrastructure/adapters/mongoose-product-repository.adapter.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { By, FilterProductsDto, Product, ReqGetProductsDto, ResGetProductsDto } from '../../../../domain/entities/product.entity';
import { ProductRepositoryPort } from '../../../../domain/ports/product-repository.port';
import { ProductModel, ProductSchema } from '../../../models/product.model';
import { FilterProduct } from './filter-product';
import { StockModel, StockSchema } from 'src/infrastructure/models/stock.model';
import { PriceHistoryModel, PriceHistorySchema } from 'src/infrastructure/models/price-history.model';
import { roundUpTo100 } from 'src/common/utils/math.utils';
import { PriceHistory } from 'src/domain/entities/price-history.entity';

@Injectable()
export class MongooseProductRepositoryAdapter implements ProductRepositoryPort {
  private productModel = Model<any>;
  private stockModel = Model<any>;
  private priceHistoryModel = Model<any>;
  constructor(
    @InjectConnection() private connection: Connection,
    private filterProduct: FilterProduct,
  ) {
    this.productModel = this.connection.model(ProductModel.name, ProductSchema);
    this.stockModel = this.connection.model(StockModel.name, StockSchema);
    this.priceHistoryModel = this.connection.model(PriceHistoryModel.name, PriceHistorySchema);
  }

  async filterProducts(filterDto: FilterProductsDto): Promise<ResGetProductsDto> {
    const aggregatePipeline = this.filterProduct.filterProducts(filterDto);

    const result = await this.productModel.aggregate(aggregatePipeline).exec();

    const total = result[0]?.total?.total || 0;
    const products = result[0]?.products || [];

    return {
      products: products.map((product) => this.mapToEntity(product, true)),
      total,
    };
  }

  async findAll({ page, limit }: ReqGetProductsDto): Promise<ResGetProductsDto> {
    const offset = (page - 1) * limit;
    const products = await this.productModel.find().populate('categories').sort({ createdAt: -1 }).limit(limit).skip(offset).exec();
    const total = await this.productModel.countDocuments().exec();
    return {
      products: products.map((product) => this.mapToEntity(product, true)),
      total,
    };
  }

  async findByCodeOrName(filter): Promise<ResGetProductsDto> {
    const offset = (filter.page - 1) * filter.limit;

    const filterFind = { $or: [{ name: { $regex: filter.q, $options: 'i' } }, { code: { $regex: filter.q, $options: 'i' } }] };

    const products = await this.productModel.find(filterFind).sort({ name: 1 }).limit(filter.limit).skip(offset).exec();
    const total = await this.productModel.countDocuments(filterFind).exec();
    return {
      products: products.map((product) => this.mapToEntity(product, true)),
      total,
    };
  }

  async findByCode(code: string): Promise<Product | null> {
    const product = await this.productModel.findOne({ code }).exec();
    return product ? this.mapToEntity(product) : null;
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.productModel.findById(id).exec();
    return product ? this.mapToEntity(product) : null;
  }

  async findByIdAdmin(id: string, filter): Promise<Product | null> {
    const { color, size, minQuantity, maxQuantity, minCostPrice, maxCostPrice } = filter;
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      return null;
    }

    const aggregate: any[] = [
      {
        $match: { product: new Types.ObjectId(id) },
      },
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
        $match: {
          ...(color ? { 'variant.color': color } : {}),
          ...(size ? { 'variant.size': size } : {}),
          ...(minCostPrice || maxCostPrice
            ? {
              cost_price: {
                ...(minCostPrice ? { $gte: minCostPrice } : {}),
                ...(maxCostPrice ? { $lte: maxCostPrice } : {}),
              },
            }
            : {}),
          ...(minQuantity || maxQuantity
            ? {
              quantity: {
                ...(minQuantity ? { $gte: minQuantity } : {}),
                ...(maxQuantity ? { $lte: maxQuantity } : {}),
              },
            }
            : {}),
        },
      },
    ];

    let stocks = [];
    if (filter.by === By.variant) {
      aggregate.push(
        ...[
          {
            $group: {
              _id: '$variant._id',
              quantity: { $sum: '$quantity' },
              date: { $first: '$date' },
              variant: { $first: '$variant' },
              stock_id: { $first: '$_id' },
            },
          },
          {
            $project: {
              quantity: 1,
              date: 1,
              variant: 1,
              _id: { $toString: '$stock_id' },
            },
          },
        ],
      );
    }

    stocks = await this.stockModel.aggregate(aggregate).exec();

    product.stocks = stocks;
    return product ? this.mapToEntity(product, false) : null;
  }

  async create(product: Product): Promise<Product> {
    const newProduct = new this.productModel(this.mapToModel(product));
    const savedProduct = await newProduct.save();
    return this.mapToEntity(savedProduct);
  }

  async update(id: string, product: Partial<Product>): Promise<Product | null> {
    const updatedProduct = await this.productModel.findByIdAndUpdate(id, this.mapToModel(product), { new: true }).exec();
    return updatedProduct ? this.mapToEntity(updatedProduct) : null;
  }

  async updatePartial(id: string, product: Partial<Product>): Promise<Product | null> {
    const mappedProduct = this.mapToModel(product);
    const updatedProduct = await this.productModel.findByIdAndUpdate(id, mappedProduct, { new: true }).exec();
    return updatedProduct ? this.mapToEntity(updatedProduct) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.productModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  async getByCategory(categoryId: string): Promise<Product[]> {
    const products = await this.productModel.aggregate([{ $unwind: '$categories_filter' }, { $match: { categories: new Types.ObjectId(categoryId) } }]);
    return products.map((product) => this.mapToEntity(product));
  }

  async calculatePrices(costPrice, percentageReseller, percentageRetail, percentageWholesale) {
    const resellerWithoutRound = costPrice + costPrice * (percentageReseller / 100);
    const reseller = roundUpTo100(resellerWithoutRound);
    const retail = roundUpTo100(resellerWithoutRound + resellerWithoutRound * (percentageRetail / 100));
    console.log(percentageWholesale.half_dozen > 0 ? costPrice + costPrice * (percentageWholesale.half_dozen / 100) : 0);
    const wholesale = {
      half_dozen: roundUpTo100(percentageWholesale.half_dozen > 0 ? costPrice + costPrice * (percentageWholesale.half_dozen / 100) : 0),
      dozen: roundUpTo100(percentageWholesale.dozen > 0 ? costPrice + costPrice * (percentageWholesale.dozen / 100) : 0),
    }
    return { reseller, retail, wholesale, costPrice };
  }

  async increasePrices({ productsIds, percentageIncrease, user }): Promise<Product[]> {
    const products: ProductModel[] = await this.productModel.find({ _id: { $in: productsIds } }).lean();
    const result = await Promise.all(products.map((product) => this.increasePrice(product, percentageIncrease, user)));

    return result;
  }

  async increasePrice(product: ProductModel, percentageIncrease, user): Promise<Product> {
    const reseller = roundUpTo100(product.prices.reseller + (product.prices.reseller * percentageIncrease) / 100);
    const retail = roundUpTo100(product.prices.retail + (product.prices.retail * percentageIncrease) / 100);
    const wholesale = {
      half_dozen: roundUpTo100(product.prices.wholesale.half_dozen + (product.prices.wholesale.half_dozen * percentageIncrease) / 100),
      dozen: roundUpTo100(product.prices.wholesale.dozen + (product.prices.wholesale.dozen * percentageIncrease) / 100),
    };

    if (reseller < 0 || retail < 0 || wholesale.half_dozen < 0 || wholesale.dozen < 0) {
      throw new Error('El precio no puede ser negativo');
    }

    const updatedProduct = { ...product, prices: { ...product.prices, reseller, retail, wholesale } };
    const updated = await this.productModel.findOneAndUpdate({ _id: product._id }, { $set: { prices: updatedProduct.prices } }, { new: true }).exec();
    await this.priceHistoryModel.create({
      productId: product._id,
      previousPrice: product.prices,
      newPrice: updatedProduct.prices,
      modfifiedAt: new Date(),
      modifiedBy: user.id,
      percentage: percentageIncrease,
    });

    return this.mapToEntity(updated);
  }

  savePriceHistory(priceHistory: PriceHistory): Promise<PriceHistory> {
    return this.priceHistoryModel.create(priceHistory);
  }

  private mapToModel(product: Partial<Product>): Partial<ProductModel> {
    // Crear un objeto base sin las propiedades que necesitan transformación
    const { sizeType, categoriesFilter, categories, hasStock, prices, wholesaleData, ...rest } = product;
    const mappedProduct: Partial<ProductModel> = { ...rest };

    // Mapear campos específicos solo si existen
    if (sizeType !== undefined) {
      mappedProduct.size_type = new Types.ObjectId(sizeType);
    }

    if (categoriesFilter !== undefined) {
      mappedProduct.categories_filter = categoriesFilter as any;
    }

    if (categories !== undefined) {
      mappedProduct.categories = categories as any;
    }

    if (hasStock !== undefined) {
      mappedProduct.has_stock = hasStock;
    }

    // Mapear precios solo si existen
    if (prices) {
      mappedProduct.prices = {
        cost: prices.cost !== undefined ? prices.cost : undefined,
        retail: prices.retail !== undefined ? prices.retail : undefined,
        reseller: prices.reseller !== undefined ? prices.reseller : undefined,
        wholesale: prices.wholesale ? {
          half_dozen: prices.wholesale.half_dozen !== undefined ? prices.wholesale.half_dozen : 0,
          dozen: prices.wholesale.dozen !== undefined ? prices.wholesale.dozen : 0
        } : undefined
      };
    }

    // Mapear wholesale_data solo si existe
    if (wholesaleData) {
      mappedProduct.wholesale_data = {
        is_wholesaler: wholesaleData.isWholesaler !== undefined ? wholesaleData.isWholesaler : undefined,
        package_type: wholesaleData.packageType !== undefined ? wholesaleData.packageType : undefined
      };
    }

    return mappedProduct;
  }

  private mapToEntity(productModel: ProductModel, withPopulate = false): Product {
    let categories = null;
    if (withPopulate) {
      categories = productModel.categories.map((category: any) => ({
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
      }));
    } else {
      categories = productModel.categories?.map((category) => category.toString());
    }

    const categoriesFilter = productModel.categories_filter?.map(row =>
      row.map(id => id.toString())
    );

    return new Product(
      productModel._id.toString(),
      productModel.name,
      productModel.description,
      productModel.code,
      categories,
      productModel.attributes,
      productModel.pictures,
      productModel.prices,
      productModel.percentages,
      productModel.has_stock,
      categoriesFilter,
      productModel.stocks
        ? productModel.stocks.map((stock) => ({
          id: stock._id.toString(),
          quantity: stock.quantity,
          variant: {
            id: stock.variant._id.toString(),
            color: stock.variant.color,
            size: stock.variant.size,
          },
          costPrice: stock.cost_price,
          date: stock.date,
        }))
        : undefined,
      productModel.quantity,
      productModel.size_type?.toString() || undefined,
      productModel.sizes,
      productModel.colors,
      productModel.createdAt,
      productModel.wholesale_data ? {
        isWholesaler: productModel.wholesale_data.is_wholesaler,
        packageType: productModel.wholesale_data.package_type as 'simple' | 'complex'
      } : undefined
    );
  }
}
