import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { FilterProductsDto } from 'src/domain/entities/product.entity';

@Injectable()
export class FilterProduct {
  constructor() {}

  private buildBaseMatch(filterDto: FilterProductsDto) {
    const {
      q,
      code,
      name,
      description,
      minRetailPrice,
      maxRetailPrice,
      brand,
      hasStock,
    } = filterDto;

    const match: any = {};

    // Filtro por código exacto
    if (code) {
      match.code = code;
    }

    if (hasStock) {
      match.has_stock = hasStock;
    }

    // Filtro por nombre o descripción parciales
    if (name) {
      match.name = { $regex: name, $options: 'i' };
    }

    if (description) {
      match.description = { $regex: description, $options: 'i' };
    }

    if (q) {
      match.$or = [{ name: { $regex: q, $options: 'i' } }, { code: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];
    }

    // Filtro por precios de revendedor
    if (minRetailPrice || maxRetailPrice) {
      match['prices.reseller'] = {};
      if (minRetailPrice) {
        match['prices.reseller'].$gte = minRetailPrice;
      }
      if (maxRetailPrice) {
        match['prices.reseller'].$lte = maxRetailPrice;
      }
    }

    // Filtro por marca
    if (brand) {
      match['attributes.brand'] = { $in: brand.split(',').map((b) => b.toLowerCase()) };
    }

    return match;
  }

  private buildBasePipeline(filterDto: FilterProductsDto) {
    const { categories, color, size, minCostPrice, maxCostPrice, minQuantity, maxQuantity } = filterDto;

    const match = this.buildBaseMatch(filterDto);
    const aggregatePipeline: any[] = [{ $match: match }];

    // Filtro por categorías
    if (categories && categories.length) {
      let customFilterCategories = null;
      if (Array.isArray(categories)) {
        customFilterCategories = { $all: categories.map((category) => new Types.ObjectId(category)) };
      } else {
        customFilterCategories = new Types.ObjectId(categories);
        aggregatePipeline.push(
          ...[
            { $unwind: '$categories_filter' },
            {
              $match: {
                categories_filter: {
                  $all: [customFilterCategories],
                },
              },
            },
          ],
        );
      }
    }

    aggregatePipeline.push(
      {
        $lookup: {
          from: 'stock',
          localField: '_id',
          foreignField: 'product',
          as: 'stock',
        },
      },
      { $unwind: { path: '$stock', preserveNullAndEmptyArrays: true } },
    );

    aggregatePipeline.push(
      {
        $lookup: {
          from: 'variants',
          localField: 'stock.variant',
          foreignField: '_id',
          as: 'variant',
        },
      },
      { $unwind: { path: '$variant', preserveNullAndEmptyArrays: true } },
    );

    // add lookup to get categories
    aggregatePipeline.push({
      $lookup: {
        from: 'categories',
        localField: 'categories',
        foreignField: '_id',
        as: 'categories',
      },
    });

    aggregatePipeline.push({
      $match: {
        ...(color ? { 'variant.color': { $in: color.split(',').map((color) => color.toLowerCase()) } } : {}),
        ...(size ? { 'variant.size': { $in: size.split(',').map((size) => size.toUpperCase()) } } : {}),
        ...(minCostPrice || maxCostPrice
          ? {
              'stock.cost_price': {
                ...(minCostPrice ? { $gte: minCostPrice } : {}),
                ...(maxCostPrice ? { $lte: maxCostPrice } : {}),
              },
            }
          : {}),
        ...(minQuantity || maxQuantity
          ? {
              'stock.quantity': {
                ...(minQuantity ? { $gte: minQuantity } : {}),
                ...(maxQuantity ? { $lte: maxQuantity } : {}),
              },
            }
          : {}),
      },
    });

    return aggregatePipeline;
  }

  filterProducts(filterDto: FilterProductsDto) {
    const { page = 1, limit = 20 } = filterDto;

    const aggregatePipeline = this.buildBasePipeline(filterDto);

    aggregatePipeline.push({
      $group: {
        _id: '$_id',
        code: { $first: '$code' },
        name: { $first: '$name' },
        description: { $first: '$description' },
        categories: { $first: '$categories' },
        brand: { $first: '$attributes.brand' },
        quantity: { $sum: '$stock.quantity' },
        costPrice: { $first: '$prices.cost' },
        resellerPrice: { $first: '$prices.reseller' },
        retailPrice: { $first: '$prices.retail' },
        pictures: { $first: '$pictures' },
        has_stock: { $first: '$has_stock' },
        sizes: { $first: '$sizes' },
        colors: { $first: '$colors' },
        sizeType: { $first: '$size_type' },
        createdAt: { $first: '$createdAt' },
      },
    });

    aggregatePipeline.push({
      $project: {
        _id: '$_id',
        code: '$code',
        name: '$name',
        description: '$description',
        categories: '$categories',
        attributes: {
          brand: '$brand',
        },
        quantity: '$quantity',
        prices: {
          cost: '$costPrice',
          reseller: '$resellerPrice',
          retail: '$retailPrice',
        },
        pictures: '$pictures',
        has_stock: '$has_stock',
        sizes: { $ifNull: ['$sizes', []] },
        colors: { $ifNull: ['$colors', []] },
        size_type: '$sizeType',
        createdAt: '$createdAt',
      },
    });

    // add sort by last created
    aggregatePipeline.push({ $sort: { createdAt: -1 } });

    // Añadir paginación
    aggregatePipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    return aggregatePipeline;
  }

  countProducts(filterDto: FilterProductsDto) {
    const aggregatePipeline = this.buildBasePipeline(filterDto);

    aggregatePipeline.push({
      $group: {
        _id: '$_id',
      },
    });

    aggregatePipeline.push({
      $count: 'total',
    });

    return aggregatePipeline;
  }
}
