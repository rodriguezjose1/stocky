import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AddProductToCartDTO, Cart } from 'src/domain/entities/cart.entity';
import { User } from 'src/domain/entities/user.entity';
import { ICartRepository } from 'src/domain/ports/cart-repository.port';
import { ProductUseCases } from './product.use-cases';
import { VariantUseCases } from './variant.use-cases';
import { StockUseCases } from './stock.use-cases';

@Injectable()
export class CartUseCases {
  constructor(
    @Inject('CartRepositoryPort')
    private readonly cartRepository: ICartRepository,
    private productUseCases: ProductUseCases,
    private variantUseCases: VariantUseCases,
    private stockUseCases: StockUseCases,
  ) {}
  async createCart(user: User): Promise<Cart> {
    const cart = await this.cartRepository.getCartByUser(user.id);
    if (cart) {
      return cart;
    }
    return this.cartRepository.createCart(user.id);
  }

  async addProductToCart({ cartId, productId, variantId, quantity }: AddProductToCartDTO): Promise<Cart> {
    const product = await this.productUseCases.getProductById(productId);
    if (!product) {
      throw new BadRequestException('Product not found');
    }
    const variant = await this.variantUseCases.getVariantById(variantId);
    if (!variant) {
      throw new BadRequestException('Variant not found');
    }
    const quantityInStock = await this.stockUseCases.getQuantityByVariantId(productId, variantId);

    if (quantity > quantityInStock) {
      throw new BadRequestException('Insufficient stock');
    }
    return this.cartRepository.addProduct(cartId, product, variant, quantity);
  }

  async removeProductFromCart(cartId: string, variantId: string): Promise<Cart> {
    return this.cartRepository.removeProduct(cartId, variantId);
  }

  async updateProductQuantity(cartId: string, productId: string, variantId: string, quantity: number): Promise<Cart> {
    const quantityInStock = await this.stockUseCases.getQuantityByVariantId(productId, variantId);

    if (quantity > quantityInStock) {
      throw new BadRequestException('Insufficient stock');
    }

    return this.cartRepository.updateQuantity(cartId, productId, variantId, quantity);
  }

  async getCartById(cartId: string): Promise<Cart> {
    return this.cartRepository.getCartById(cartId);
  }

  async getCartByUser(userId: string): Promise<Cart> {
    return this.cartRepository.getCartByUser(userId);
  }

  async updateCart(cart: any): Promise<Cart> {
    return this.cartRepository.updateCart(cart);
  }
}
