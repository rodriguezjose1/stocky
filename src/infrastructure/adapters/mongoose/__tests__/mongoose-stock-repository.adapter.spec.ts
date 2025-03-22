import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { MongooseStockRepositoryAdapter } from '../mongoose-stock-repository.adapter';
import { Stock } from '../../../../domain/entities/stock.entity';
import { SYSTEM_USER_ID } from '../../../../domain/constants/system.constants';
import { StockModel, StockSchema } from '../../../../infrastructure/models/stock.model';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('MongooseStockRepositoryAdapter', () => {
  let adapter: MongooseStockRepositoryAdapter;
  let connection: Connection;
  let mongod: MongoMemoryServer;

  const mockStock: Stock = {
    id: new Types.ObjectId().toString(),
    product: new Types.ObjectId().toString(),
    variant: new Types.ObjectId().toString(),
    quantity: 10,
    costPrice: 100,
    date: new Date(),
    userId: SYSTEM_USER_ID.toString(),
  };

  beforeAll(async () => {
    // Create an in-memory MongoDB instance
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: StockModel.name, schema: StockSchema }]),
      ],
      providers: [MongooseStockRepositoryAdapter],
    }).compile();

    adapter = module.get<MongooseStockRepositoryAdapter>(MongooseStockRepositoryAdapter);
    connection = module.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await connection.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    await connection.collection('stocks').deleteMany({});
  });

  describe('mapToEntity', () => {
    it('should map model to entity correctly', () => {
      const modelData = {
        _id: mockStock.id,
        product: mockStock.product,
        variant: mockStock.variant,
        quantity: mockStock.quantity,
        cost_price: mockStock.costPrice,
        date: mockStock.date,
        user_id: mockStock.userId,
      };

      const result = (adapter as any).mapToEntity(modelData);

      expect(result).toBeInstanceOf(Stock);
      expect(result.id).toBe(mockStock.id);
      expect(result.product).toBe(mockStock.product);
      expect(result.variant).toBe(mockStock.variant);
      expect(result.quantity).toBe(mockStock.quantity);
      expect(result.costPrice).toBe(mockStock.costPrice);
      expect(result.date).toBe(mockStock.date);
      expect(result.userId).toBe(mockStock.userId);
    });
  });

  describe('mapToModel', () => {
    it('should map entity to model correctly', () => {
      const result = (adapter as any).mapToModel(mockStock);

      expect(result.product).toBeInstanceOf(Types.ObjectId);
      expect(result.variant).toBeInstanceOf(Types.ObjectId);
      expect(result.cost_price).toBe(mockStock.costPrice);
      expect(result.quantity).toBe(mockStock.quantity);
      expect(result.date).toBe(mockStock.date);
      expect(result.user_id).toBeInstanceOf(Types.ObjectId);
    });
  });

  describe('create', () => {
    it('should create a new stock', async () => {
      const result = await adapter.create(mockStock);

      expect(result).toBeInstanceOf(Stock);
      expect(result.id).toBeDefined();
      expect(result.product).toBe(mockStock.product);
      expect(result.variant).toBe(mockStock.variant);
      expect(result.quantity).toBe(mockStock.quantity);
      expect(result.costPrice).toBe(mockStock.costPrice);
      expect(result.date).toBe(mockStock.date);
      expect(result.userId).toBe(mockStock.userId);

      // Verify it was saved in the database
      const savedStock = await connection.collection('stocks').findOne({ _id: new Types.ObjectId(result.id) });
      expect(savedStock).toBeDefined();
      expect(savedStock.cost_price).toBe(mockStock.costPrice);
      expect(savedStock.user_id.toString()).toBe(mockStock.userId);
    });
  });

  describe('update', () => {
    it('should update an existing stock', async () => {
      // First create a stock
      const createdStock = await adapter.create(mockStock);

      // Update the stock
      const updateData = {
        quantity: 20,
        costPrice: 150,
      };

      const result = await adapter.update(createdStock.id, updateData);

      expect(result).toBeInstanceOf(Stock);
      expect(result.id).toBe(createdStock.id);
      expect(result.quantity).toBe(updateData.quantity);
      expect(result.costPrice).toBe(updateData.costPrice);

      // Verify it was updated in the database
      const updatedStock = await connection.collection('stocks').findOne({ _id: new Types.ObjectId(result.id) });
      expect(updatedStock.quantity).toBe(updateData.quantity);
      expect(updatedStock.cost_price).toBe(updateData.costPrice);
    });
  });
}); 