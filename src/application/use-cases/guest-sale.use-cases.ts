import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SaleCreatedEvent } from 'src/async-events/events/sale.events';
import { getWeekCode } from 'src/common/utils/date.utils';
import { CreateGuestSaleDto, Sale, SaleStatus } from 'src/domain/entities/sale.entity';
import { ICartRepository } from 'src/domain/ports/cart-repository.port';
import { ERROR_HANDLER_PORT, ErrorHandlerPort } from 'src/domain/ports/error-handler.port';
import { SaleRepositoryPort } from '../../domain/ports/sale-repository.port';
import { StockUseCases } from './stock.use-cases';
import { CartValidationService } from '../services/cart-validation.service';
import { GuestUserService } from '../services/guest-user.service';
import { SaleDetailProcessorService } from '../services/sale-detail-processor.service';
import { SaleCodeGeneratorService } from '../services/sale-code-generator.service';

@Injectable()
export class GuestSaleUseCases {
  constructor(
    @Inject('SaleRepositoryPort')
    private saleRepository: SaleRepositoryPort,
    private eventEmitter: EventEmitter2,
    private stockUseCases: StockUseCases,
    @Inject('CartRepositoryPort')
    private cartRepository: ICartRepository,
    @Inject(ERROR_HANDLER_PORT) private errorHandler: ErrorHandlerPort,
    private cartValidationService: CartValidationService,
    private guestUserService: GuestUserService,
    private saleDetailProcessorService: SaleDetailProcessorService,
    private saleCodeGeneratorService: SaleCodeGeneratorService,
  ) {}

  async createGuestSale(guestSaleData: CreateGuestSaleDto) {
    try {
      const { cartId, date, customerData, comment } = guestSaleData;

      // 1. Validar carrito usando el servicio
      const cart = await this.cartValidationService.validateCart(cartId);

      // 2. Crear los detalles de venta iniciales
      const details = this.saleDetailProcessorService.createInitialSaleDetails(cart.items);

      // 3. Validar stock disponible
      await this.stockUseCases.checkStock(details);

      // 4. Procesar detalles con precios y datos de variantes
      const processedDetails = await this.saleDetailProcessorService.processSaleDetails(cart.items);

      // 5. Crear o obtener usuario cliente
      const userData = await this.guestUserService.createOrGetCustomerUser(customerData, cart.sessionId);

      // 6. Generar código de venta único
      const saleCode = await this.saleCodeGeneratorService.generateUniqueSaleCode();

      // 7. Crear la venta
      const weekCode = getWeekCode(new Date(date));
      
      const sale = new Sale(
        null, 
        new Date(date), 
        SaleStatus.PENDING, 
        processedDetails, 
        [], 
        userData, 
        cartId,
        weekCode,
        saleCode,
        comment
      );

      const createdSale = await this.saleRepository.create(sale);

      // 8. Emitir evento de venta creada
      this.eventEmitter.emit('sale.created', new SaleCreatedEvent(createdSale.id));

      return createdSale;
    } catch (error) {
      console.log(error);
      throw this.errorHandler.handleError(error);
    }
  }
}