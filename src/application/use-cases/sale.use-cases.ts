// application/use-cases/create-sale.use-case.ts
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateSaleDto, Prices, Sale, SaleDetail, SaleStatus } from 'src/domain/entities/sale.entity';
import { SaleRepositoryPort } from '../../domain/ports/sale-repository.port';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SaleCreatedEvent, SaleUpdatedEvent } from 'src/async-events/events/sale.events';
import { StockUseCases } from './stock.use-cases';
import { ERROR_HANDLER_PORT, ErrorHandlerPort } from 'src/domain/ports/error-handler.port';
import { ProductUseCases } from './product.use-cases';
import { Product } from 'src/domain/entities/product.entity';
import { CartUseCases } from './cart.use-cases';
import { UserUseCases } from './user.use-cases';
import { VariantUseCases } from './variant.use-cases';
import { Variant } from 'src/domain/entities/variant.entity';
import { getWeekCode } from 'src/common/utils/date.utils';
import { Role } from 'src/domain/enums/role.enum';

@Injectable()
export class SalesUseCase {
  constructor(
    @Inject('SaleRepositoryPort')
    private saleRepository: SaleRepositoryPort,
    private eventEmitter: EventEmitter2,
    private productUseCases: ProductUseCases,
    private variantUseCases: VariantUseCases,
    private stockUseCases: StockUseCases,
    private cartUseCases: CartUseCases,
    private userUseCases: UserUseCases,
    @Inject(ERROR_HANDLER_PORT) private errorHandler: ErrorHandlerPort,
  ) {}

  async createSale(saleData: CreateSaleDto, userReq?: any) {
    try {
      if (saleData.cartId) {
        const cart = await this.cartUseCases.getCartById(saleData.cartId);
        if (cart.userId.toString() !== userReq.id) {
          throw new BadRequestException('Cart does not belong to user');
        }
        saleData.details = cart.items.map((item) => new SaleDetail(item.product._id, item.variant._id, item.quantity));
      }

      await this.stockUseCases.checkStock(saleData.details);

      const details: SaleDetail[] = [];
      const calls = saleData.details.map(async (detail, i) => {
        const product: Product = await this.productUseCases.getProductById(detail.productId);
        const variant: Variant = await this.variantUseCases.getVariantById(detail.variantId);
        const prices: Prices = {
          retail: product.prices.retail,
          reseller: product.prices.reseller,
        };
        const variantData = {
          productName: product.name,
          productCode: product.code,
          variantAttributes: [
            {
              name: 'color',
              value: variant.color,
            },
            {
              name: 'size',
              value: variant.size,
            },
          ],
        };
        details[i] = new SaleDetail(detail.productId, detail.variantId, detail.quantity, prices, variantData);
      });
      await Promise.all(calls);

      if (!saleData.user) {
        saleData.user = userReq.id;
        saleData.user = {
          id: userReq.id,
          name: userReq.name,
          lastname: userReq.lastname,
        };
      } else {
        const user = await this.userUseCases.getUserById(saleData.user as string);

        saleData.user = {
          id: user.id,
          name: user.name,
          lastname: user.lastname,
        };
      }

      const weekCode = getWeekCode(new Date());
      const sale = new Sale(null, new Date(saleData.date), SaleStatus.PENDING, details, [], saleData.user, saleData.cartId, weekCode);

      const createdSale = await this.saleRepository.create(sale);

      this.eventEmitter.emit('sale.created', new SaleCreatedEvent(createdSale.id));

      return createdSale;
    } catch (error) {
      console.log(error);
      throw this.errorHandler.handleError(error);
    }
  }

  async findAll(filter): Promise<any> {
    if (this.isSellerNotAdmin(filter.user)) {
      filter.userId = filter.user.id;
    }
    return this.saleRepository.findAll(filter);
  }

  async findById(id: string): Promise<Sale | null> {
    return this.saleRepository.findById(id);
  }

  async deleteSale(id: string): Promise<boolean> {
    return this.saleRepository.delete(id);
  }

  async updateSale(id: string, sale: Partial<Sale>): Promise<Sale | null> {
    const saleDB = await this.saleRepository.findById(id);
    if (!saleDB) throw new BadRequestException('Sale not found');

    const updatedSale = await this.saleRepository.update(id, sale);

    if (updatedSale && sale.status) this.handleSaleStatusChange(saleDB.status, sale.status, updatedSale.id);

    return updatedSale;
  }

  async findSellersWithSalesInCurrentWeek(): Promise<Sale[]> {
    return this.saleRepository.findSellersWithSalesInCurrentWeek();
  }

  async findProductsBySellerId(sellerId: string): Promise<any> {
    return this.saleRepository.findProductsBySellerId(sellerId);
  }

  async findGroupedProductsInCurrentWeek(): Promise<any> {
    return this.saleRepository.findGroupedProductsInCurrentWeek();
  }

  private handleSaleStatusChange(prevStatus: SaleStatus, newStatus: SaleStatus, saleId: string): void {
    if (prevStatus === newStatus) return;
    const isNewStatusValid = newStatus !== SaleStatus.PENDING;

    if (isNewStatusValid) {
      this.eventEmitter.emit('sale.updated.status', new SaleUpdatedEvent(saleId));
    }
  }

  private isSellerNotAdmin(user): boolean {
    const roleNames = user.roles.map((role) => role.name);
    return roleNames.includes(Role.SELLER) && !roleNames.includes(Role.ADMIN);
  }
}
