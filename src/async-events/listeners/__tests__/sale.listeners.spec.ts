import { Test, TestingModule } from '@nestjs/testing';
import { SaleListener } from '../sale.listeners';
import { StockUseCases } from '../../../application/use-cases/stock.use-cases';
import { SalesUseCase } from '../../../application/use-cases/sale.use-cases';
import { CartUseCases } from '../../../application/use-cases/cart.use-cases';
import { SaleStatus } from '../../../domain/entities/sale.entity';
import { SaleCreatedEvent, SaleUpdatedEvent } from '../../events/sale.events';
import { SYSTEM_USER_ID } from '../../../domain/constants/system.constants';
import { Types } from 'mongoose';

describe('SaleListener', () => {
  let listener: SaleListener;
  let stockUseCases: StockUseCases;
  let saleUseCases: SalesUseCase;
  let cartUseCases: CartUseCases;

  const mockSale = {
    id: new Types.ObjectId().toString(),
    cartId: new Types.ObjectId().toString(),
    status: SaleStatus.PENDING,
    date: new Date(),
    details: [
      {
        productId: new Types.ObjectId().toString(),
        variantId: new Types.ObjectId().toString(),
        quantity: 2,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaleListener,
        {
          provide: StockUseCases,
          useValue: {
            decrementStock: jest.fn(),
            incrementStock: jest.fn(),
          },
        },
        {
          provide: SalesUseCase,
          useValue: {
            findById: jest.fn(),
            updateSale: jest.fn(),
          },
        },
        {
          provide: CartUseCases,
          useValue: {
            updateCart: jest.fn(),
          },
        },
      ],
    }).compile();

    listener = module.get<SaleListener>(SaleListener);
    stockUseCases = module.get<StockUseCases>(StockUseCases);
    saleUseCases = module.get<SalesUseCase>(SalesUseCase);
    cartUseCases = module.get<CartUseCases>(CartUseCases);
  });

  describe('handleSaleCreated', () => {
    it('should handle sale creation correctly', async () => {
      const event = new SaleCreatedEvent(mockSale.id);
      jest.spyOn(saleUseCases, 'findById').mockResolvedValue(mockSale);
      jest.spyOn(stockUseCases, 'decrementStock').mockResolvedValue([
        {
          stock: new Types.ObjectId().toString(),
          quantity: 2,
          prices: {
            cost: 100,
            retail: 150,
            reseller: 120,
          },
        },
      ]);

      await listener.handleSaleCreated(event);

      expect(saleUseCases.findById).toHaveBeenCalledWith(mockSale.id);
      expect(stockUseCases.decrementStock).toHaveBeenCalledWith(
        mockSale.details[0].productId,
        mockSale.details[0].variantId,
        {
          quantity: mockSale.details[0].quantity,
          userId: SYSTEM_USER_ID.toString(),
        },
      );
      expect(cartUseCases.updateCart).toHaveBeenCalledWith({
        _id: mockSale.cartId,
        active: false,
      });
    });
  });

  describe('handleSaleUpdatedStatus', () => {
    it('should handle sale rejection correctly', async () => {
      const event = new SaleUpdatedEvent(mockSale.id);
      const rejectedSale = {
        ...mockSale,
        status: SaleStatus.REJECTED,
        stocksUpdated: [
          {
            stock: new Types.ObjectId().toString(),
            quantity: 2,
          },
        ],
      };

      jest.spyOn(saleUseCases, 'findById').mockResolvedValue(rejectedSale);
      jest.spyOn(stockUseCases, 'incrementStock').mockResolvedValue(null);

      await listener.handleSaleUpdatedStatus(event);

      expect(saleUseCases.findById).toHaveBeenCalledWith(mockSale.id);
      expect(stockUseCases.incrementStock).toHaveBeenCalledWith(
        rejectedSale.stocksUpdated[0].stock,
        {
          quantity: rejectedSale.stocksUpdated[0].quantity,
          userId: SYSTEM_USER_ID.toString(),
        },
      );
    });
  });
}); 