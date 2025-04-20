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
import { ProductAttributeUseCases } from './product-attribute.use-cases';
import { ProductAttributeSubtypeUseCases } from './product-attribute-subtype.use-cases';

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
    private productAttributeUseCases: ProductAttributeUseCases,
    private porductAttributeSubtypeUseCases: ProductAttributeSubtypeUseCases,
    @Inject(ERROR_HANDLER_PORT) private errorHandler: ErrorHandlerPort,
  ) { }

  async createSale(saleData: CreateSaleDto, userReq?: any) {
    try {
      if (saleData.cartId) {
        const cart = await this.cartUseCases.getCartById(saleData.cartId);
        if (cart.userId.toString() !== userReq.id) {
          throw new BadRequestException('Cart does not belong to user');
        }
        saleData.details = cart.items.map((item) => {
          if (item.variant) {
            if (item.is_wholesale_package) {
              return new SaleDetail(item.product._id, item.variant._id, item.quantity, null, null, true, null, [], item.applied_price_type);
            } else {
              return new SaleDetail(item.product._id, item.variant._id, item.quantity, null, null, false, null, [], item.applied_price_type);
            }
          } else {
            return new SaleDetail(item.product._id, null, item.quantity, null, null, true, item.predefined_quantity, item.wholesale_variants, item.applied_price_type);
          }
        });
      }

      await this.stockUseCases.checkStock(saleData.details);

      let prices: Prices;
      const details: SaleDetail[] = [];
      const calls = saleData.details.map(async (detail, i) => {
        const product: Product = await this.productUseCases.getProductById(detail.productId);
        if (!detail.isWholesalePackage || (detail.isWholesalePackage && !detail.wholesaleVariants)) {
          const variant: Variant = await this.variantUseCases.getVariantById(detail.variantId);
          const productAttributeColor = await this.productAttributeUseCases.getProductAttributeByValue(variant.color);
          if (detail.isWholesalePackage) {
            prices = {
              retail: 0,
              reseller: 0,
              wholesale: detail.quantity === 6 ? product.prices.wholesale.half_dozen : product.prices.wholesale.dozen,
            };
          } else {
            prices = {
              retail: product.prices.retail,
              reseller: product.prices.reseller,
              wholesale: 0,
            };
          }
          const variantData = {
            productName: product.name,
            productCode: product.code,
            variantAttributes: [
              {
                name: 'color',
                keyLabel: 'Color',
                value: variant.color,
                label: productAttributeColor.label,
              },
              {
                name: 'size',
                keyLabel: 'Talle',
                value: variant.size,
                label: variant.size,
              },
            ],
          };
          details[i] = new SaleDetail(detail.productId, detail.variantId, detail.quantity, prices, variantData, detail.isWholesalePackage, detail.predefinedQuantity, detail.wholesaleVariants, detail.appliedPriceType);
        } else {
          prices = {
            retail: 0,
            reseller: 0,
          };
          if (detail.predefinedQuantity === 6) {
            prices.wholesale = product.prices.wholesale.half_dozen;
          } else {
            prices.wholesale = product.prices.wholesale.dozen;
          }

          // wholesale variants to variantData
          const wholesaleVariantsData = detail.wholesaleVariants.map((v) => {
            return {
              variant: {
                productName: product.name,
                productCode: product.code,
                variantId: v.variant._id,
                variantAttributes: [
                  {
                    name: 'color',
                    keyLabel: 'Color',
                    value: v.variant.color,
                    label: v.variant.color,
                  },
                  {
                    name: 'size',
                    keyLabel: 'Talle',
                    value: v.variant.size,
                    label: v.variant.size,
                  },
                ],
              },
              quantity: v.quantity,
            };
          });

          details[i] = new SaleDetail(detail.productId, null, detail.quantity, prices, null, true, detail.predefinedQuantity, wholesaleVariantsData, detail.appliedPriceType);
        }
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
    const sale = await this.saleRepository.findById(id);
    return sale;
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

  async processAsyncEvents(saleId: string): Promise<void> {
    this.eventEmitter.emit('sale.created', new SaleCreatedEvent(saleId));
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
