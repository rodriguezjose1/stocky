import { Test, TestingModule } from '@nestjs/testing';
import { ProductUseCases } from '../../application/use-cases/product.use-cases';
import { StockUseCases } from '../../application/use-cases/stock.use-cases';
import { ProductModule } from '../../modules/product.module';
import { StockModule } from '../../modules/stock.module';
import { MongooseProductRepositoryAdapter } from '../../infrastructure/adapters/mongoose/product/mongoose-product-repository.adapter';
import { MongooseStockRepositoryAdapter } from '../../infrastructure/adapters/mongoose/mongoose-stock-repository.adapter';
import { VariantModule } from '../../modules/variant.module';
import { CategoryModule } from '../../modules/category.module';
import { ProductAttributeModule } from '../../modules/product-attribute.module';
import { ProductAttributeSubtypeModule } from '../../modules/product-attribute-subtype.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Connection } from 'mongoose';
import { FilterProduct } from '../../infrastructure/adapters/mongoose/product/filter-product';
import { getConnectionToken } from '@nestjs/mongoose';
import { ProductAttributeSubtypeUseCases } from '../../application/use-cases/product-attribute-subtype.use-cases';
import { CategoryUseCases } from '../../application/use-cases/category.use-cases';
import { MongooseProductAttributeSubtypeRepositoryAdapter } from '../../infrastructure/adapters/mongoose/mongoose-product-subtype-repository.adapter';
import { MongooseCategoryRepositoryAdapter } from '../../infrastructure/adapters/mongoose/mongoose-category-repository.adapter';
import { startInMemoryMongoReplicaSet, stopInMemoryMongoReplicaSet } from '../../test/utils/mongo-memory-server';
import { MASTER_DATA, seedMasterData } from '../../test/utils/seed-master-data';
import * as mongoose from 'mongoose';

// Datos de prueba predefinidos
export const TEST_DATA = {
  product: {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439013'),
    name: 'Test Product',
    description: 'Test product description',
    code: 'TEST-001',
    categories: [MASTER_DATA.category._id.toString()],
    attributes: {
      brand: 'Test Brand',
    },
    pictures: [
      {
        url: 'https://example.com/image.jpg',
        alt_text: 'Test product image',
      },
    ],
    prices: {
      cost: 100,
      retail: 300,
      reseller: 200,
      wholesale: {
        half_dozen: 0,
        dozen: 0,
      },
    },
    percentages: {
      retail: 100,
      reseller: 50,
      wholesale: {
        half_dozen: 0,
        dozen: 0,
      },
    },
    has_stock: false,
    size_type: MASTER_DATA.sizeType._id.toString(),
    sizes: [],
    colors: ['Red', 'Blue'],
    wholesale_data: {
      isWholesaler: false,
      packageType: null,
    },
  },
  variant: {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439014'),
    color: 'Red',
    size: 'M',
  },
  stock: {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439015'),
    quantity: 100,
    costPrice: 100,
  },
};

export interface TestContext {
  productUseCases: ProductUseCases;
  stockUseCases: StockUseCases;
  mongoConnection: Connection;
  createdProductId?: string;
  createdStockId?: string;
}

export async function setupTestModule(): Promise<TestContext> {
  const uri = await startInMemoryMongoReplicaSet();
  console.log('MongoDB URI:', uri);

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      MongooseModule.forRoot(uri),
      EventEmitterModule.forRoot(),
      ProductModule,
      StockModule,
      VariantModule,
      CategoryModule,
      ProductAttributeModule,
      ProductAttributeSubtypeModule,
    ],
    providers: [
      {
        provide: 'ProductRepositoryPort',
        useClass: MongooseProductRepositoryAdapter,
      },
      {
        provide: 'StockRepositoryPort',
        useClass: MongooseStockRepositoryAdapter,
      },
      {
        provide: 'ProductAttributeSubtypeRepositoryPort',
        useClass: MongooseProductAttributeSubtypeRepositoryAdapter,
      },
      {
        provide: 'CategoryRepositoryPort',
        useClass: MongooseCategoryRepositoryAdapter,
      },
      FilterProduct,
      ProductAttributeSubtypeUseCases,
      CategoryUseCases,
    ],
  }).compile();

  const productUseCases = moduleFixture.get<ProductUseCases>(ProductUseCases);
  const stockUseCases = moduleFixture.get<StockUseCases>(StockUseCases);
  const mongoConnection = moduleFixture.get<Connection>(getConnectionToken());

  return {
    productUseCases,
    stockUseCases,
    mongoConnection,
  };
}

export async function cleanupTestModule(context: TestContext): Promise<void> {
  // Limpiar todos los datos al final
  const collections = context.mongoConnection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  
  if (context.mongoConnection) {
    await context.mongoConnection.close();
  }
  await stopInMemoryMongoReplicaSet();
}

export async function setupBeforeEach(context: TestContext): Promise<void> {
  // Solo limpiar datos transaccionales
  const transactionalCollections = ['products', 'stocks', 'variants'];
  for (const collectionName of transactionalCollections) {
    if (context.mongoConnection.collections[collectionName]) {
      await context.mongoConnection.collections[collectionName].deleteMany({});
    }
  }

  // Insertar datos maestros usando la función seedMasterData
  await seedMasterData(context.mongoConnection);
}

export const logAfterEach = async (context: TestContext) => {
  try {
    // Obtener los datos de las colecciones
    const products = await context.mongoConnection.db.collection('products').find().toArray();
    const stocks = await context.mongoConnection.db.collection('stocks').find().toArray();
    const variants = await context.mongoConnection.db.collection('variants').find().toArray();
    
    // Limpiar las referencias circulares antes de serializar
    const cleanProducts = products.map(product => ({
      id: product._id.toString(),
      name: product.name,
      code: product.code,
      prices: product.prices,
      wholesaleData: product.wholesaleData
    }));

    const cleanStocks = stocks.map(stock => ({
      id: stock._id.toString(),
      product: stock.product?.toString(),
      variant: stock.variant,
      quantity: stock.quantity,
      costPrice: stock.costPrice
    }));

    const cleanVariants = variants.map(variant => ({
      id: variant._id.toString(),
      color: variant.color,
      size: variant.size
    }));

    console.log('\n=== Estado de la base de datos después del test ===');
    console.log('Products:', JSON.stringify(cleanProducts, null, 2));
    console.log('Stocks:', JSON.stringify(cleanStocks, null, 2));
    console.log('Variants:', JSON.stringify(cleanVariants, null, 2));
  } catch (error) {
    console.error('Error al registrar el estado de la base de datos:', error);
  }
}; 