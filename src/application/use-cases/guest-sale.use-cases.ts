import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SaleCreatedEvent } from 'src/async-events/events/sale.events';
import { getWeekCode } from 'src/common/utils/date.utils';
import { Product } from 'src/domain/entities/product.entity';
import { CreateGuestSaleDto, GuestUserData, Sale, SaleDetail, SaleStatus } from 'src/domain/entities/sale.entity';
import { Variant } from 'src/domain/entities/variant.entity';
import { ICartRepository } from 'src/domain/ports/cart-repository.port';
import { ERROR_HANDLER_PORT, ErrorHandlerPort } from 'src/domain/ports/error-handler.port';
import { SaleRepositoryPort } from '../../domain/ports/sale-repository.port';
import { ProductUseCases } from './product.use-cases';
import { StockUseCases } from './stock.use-cases';
import { VariantUseCases } from './variant.use-cases';

@Injectable()
export class GuestSaleUseCases {
  constructor(
    @Inject('SaleRepositoryPort')
    private saleRepository: SaleRepositoryPort,
    private eventEmitter: EventEmitter2,
    private productUseCases: ProductUseCases,
    private variantUseCases: VariantUseCases,
    private stockUseCases: StockUseCases,
    @Inject('CartRepositoryPort')
    private cartRepository: ICartRepository,
    @Inject(ERROR_HANDLER_PORT) private errorHandler: ErrorHandlerPort,
  ) {}

  async createGuestSale(guestSaleData: CreateGuestSaleDto) {
    try {
      const { cartId, date, customerData, comment } = guestSaleData;

      // 1. Validar que existe un carrito para esa sesión
      const cart = await this.cartRepository.getCartById(cartId);
      if (!cart) {
        throw new BadRequestException('No cart found for this session');
      }

      // 2. Validar que el carrito tiene items
      if (!cart.items || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // 3. Crear los detalles de la venta basados en el carrito
      const details: SaleDetail[] = cart.items.map((item) => {
        if (item.variant) {
          if (item.is_wholesale_package) {
            return new SaleDetail(
              item.product._id, 
              item.variant._id, 
              item.quantity, 
              null, 
              null, 
              true, 
              null, 
              [], 
              item.applied_price_type
            );
          } else {
            return new SaleDetail(
              item.product._id, 
              item.variant._id, 
              item.quantity, 
              null, 
              null, 
              false, 
              null, 
              [], 
              item.applied_price_type
            );
          }
        } else {
          return new SaleDetail(
            item.product._id, 
            null, 
            item.quantity, 
            null, 
            null, 
            true, 
            item.predefined_quantity, 
            item.wholesale_variants, 
            item.applied_price_type
          );
        }
      });

      // 4. Validar stock disponible
      await this.stockUseCases.checkStock(details);

      // 5. Procesar detalles con precios y datos de variantes
      const processedDetails: SaleDetail[] = [];
      
      for (let i = 0; i < details.length; i++) {
        const detail = details[i];
        const product: Product = await this.productUseCases.getProductById(detail.productId);
        
        if (!detail.isWholesalePackage || (detail.isWholesalePackage && !detail.wholesaleVariants.length)) {
          const variant: Variant = await this.variantUseCases.getVariantById(detail.variantId);
          
          // Para guest users, siempre usar precio RETAIL
          const prices = {
            retail: product.prices.retail,
            reseller: 0,
            wholesale: 0,
          };

          const variantData = {
            productName: product.name,
            productCode: product.code,
            variantAttributes: [
              {
                name: 'color',
                keyLabel: 'Color',
                value: variant.color,
                label: variant.colorLabel,
              },
              {
                name: 'size',
                keyLabel: 'Talle',
                value: variant.size,
                label: variant.sizeLabel,
              },
            ],
          };

          processedDetails[i] = new SaleDetail(
            detail.productId, 
            detail.variantId, 
            detail.quantity, 
            prices, 
            variantData, 
            detail.isWholesalePackage, 
            detail.predefinedQuantity, 
            detail.wholesaleVariants, 
            detail.appliedPriceType
          );
        } else {
          // Para paquetes mayoristas complejos
          const prices = {
            retail: 0,
            reseller: 0,
            wholesale: 0,
          };

          if (detail.predefinedQuantity === 6) {
            prices.wholesale = product.prices.wholesale.half_dozen;
          } else {
            prices.wholesale = product.prices.wholesale.dozen;
          }

          // Procesar variantes mayoristas
          const wholesaleVariantsData = await Promise.all(detail.wholesaleVariants.map(async (v) => {
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
                    label: v.variant.color_label,
                  },
                  {
                    name: 'size',
                    keyLabel: 'Talle',
                    value: v.variant.size,
                    label: v.variant.size_label,
                  },
                ],
              },
              quantity: v.quantity,
            };
          }));

          processedDetails[i] = new SaleDetail(
            detail.productId, 
            null, 
            detail.quantity, 
            prices, 
            null, 
            true, 
            detail.predefinedQuantity, 
            wholesaleVariantsData, 
            detail.appliedPriceType
          );
        }
      }

      // 6. Crear datos del usuario invitado
      const guestUser = new GuestUserData(
        `guest_${cart.sessionId}`,
        customerData.name,
        customerData.lastname,
        customerData.email,
        customerData.phone,
        customerData.address
      );

      // 7. Crear la venta
      const weekCode = getWeekCode(new Date(date));
      const sale = new Sale(
        null, 
        new Date(date), 
        SaleStatus.PENDING, 
        processedDetails, 
        [], 
        guestUser, 
        cartId, // Usar el ID del carrito como cartId
        weekCode
      );

      const createdSale = await this.saleRepository.create(sale);

      // 8. Emitir evento de venta creada
      this.eventEmitter.emit('sale.created', new SaleCreatedEvent(createdSale.id));

      // 9. Opcional: Limpiar el carrito después de la venta
      // await this.cartRepository.updateCart({ _id: cart.id, active: false });

      return createdSale;
    } catch (error) {
      console.log(error);
      throw this.errorHandler.handleError(error);
    }
  }
}