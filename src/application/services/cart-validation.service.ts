import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { Cart } from 'src/domain/entities/cart.entity';
import { ICartRepository } from 'src/domain/ports/cart-repository.port';

@Injectable()
export class CartValidationService {
  constructor(
    @Inject('CartRepositoryPort')
    private cartRepository: ICartRepository,
  ) {}

  /**
   * Valida que existe un carrito para el ID proporcionado
   * @param cartId - ID del carrito a validar
   * @returns El carrito si existe
   * @throws BadRequestException si el carrito no existe o está vacío
   */
  async validateCart(cartId: string): Promise<Cart> {
    // 1. Validar que existe un carrito para esa sesión
    const cart = await this.cartRepository.getCartById(cartId);
    if (!cart) {
      throw new BadRequestException('No cart found for this session');
    }

    // 2. Validar que el carrito tiene items
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    return cart;
  }
} 