import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductModel } from '../src/infrastructure/models/product.model'; // Ajusta el path según tu estructura

@Injectable()
export class ProductSeeder {
  constructor(
    @InjectModel(ProductModel.name) private productModel: Model<ProductModel>,
  ) {}

  async createMultipleProducts(): Promise<void> {
    const products = [];

    // Lista de categorías proporcionadas
    const categories = [
      new Types.ObjectId('66f5e3e1ae5b594cce75acb1'),
      new Types.ObjectId('66f5e3ebae5b594cce75acb3'),
      new Types.ObjectId('66f5e40fae5b594cce75acb6'),
      new Types.ObjectId('66f5e64bae5b594cce75acb9'),
      new Types.ObjectId('66f638a6ae5b594cce75acbf'),
      new Types.ObjectId('66f638d4ae5b594cce75acc1'),
      new Types.ObjectId('66f63911ae5b594cce75acc4'),
    ];

    // Lista de imágenes públicas aleatorias
    const images = [
      'https://picsum.photos/200/300',
      'https://picsum.photos/300/400',
      'https://picsum.photos/400/500',
      'https://picsum.photos/500/600',
      'https://picsum.photos/600/700',
      'https://picsum.photos/700/800',
    ];

    for (let i = 1; i <= 100; i++) {
      const dynamicBrand = `brand_${String.fromCharCode(65 + (i % 26))}`; // Genera marca como A, B, C, etc.
      const dynamicSize = ['S', 'M', 'L', 'XL'][i % 4]; // Tamaños dinámicos
      const dynamicQuantity = Math.floor(Math.random() * 100) + 1; // Cantidad aleatoria entre 1 y 100
      const dynamicCostPrice = Math.floor(Math.random() * 1000) + 5000; // Precio de costo entre 5000 y 6000
      const dynamicPublicPrice = dynamicCostPrice * 1.5; // Precio público con margen del 50%
      const dynamicResellerPrice = dynamicCostPrice * 1.25; // Precio para revendedores con margen del 25%

      // Selecciona de 1 a 3 categorías aleatorias
      const randomCategories = Array.from(
        { length: Math.floor(Math.random() * 3) + 1 },
        () => categories[Math.floor(Math.random() * categories.length)],
      );

      // Selecciona entre 1 y 3 imágenes aleatorias
      const randomImages = Array.from(
        { length: Math.floor(Math.random() * 3) + 1 },
        () => images[Math.floor(Math.random() * images.length)],
      );

      const product = {
        name: `Product ${i}`,
        code: `product_${i}`,
        description: `Description for product ${i}`,
        brand: dynamicBrand,
        categories: randomCategories,
        size: dynamicSize,
        quantity: dynamicQuantity,
        costPrice: dynamicCostPrice,
        publicPrice: dynamicPublicPrice,
        resellerPrice: dynamicResellerPrice,
        images: randomImages,
      };

      products.push(product);
    }

    await this.productModel.insertMany(products);
    console.log(
      '100 products have been created with dynamic categories and images',
    );
  }
}
