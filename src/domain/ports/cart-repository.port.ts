import { Cart } from '../entities/cart.entity';
import { Product } from '../entities/product.entity';
import { Variant } from '../entities/variant.entity';

export interface ICartRepository {
  createCart(userId: string): Promise<Cart>;
  addProduct(cartId: string, product: Product, variant: Variant, quantity: number): Promise<Cart>;
  removeProduct(cartId: string, variantId: string): Promise<Cart>;
  updateQuantity(cartId: string, productId: string, variantId: string, quantity: number): Promise<Cart>;
  getCartById(cartId: string): Promise<Cart>;
  getCartByUser(userId: string): Promise<Cart>;
  updateCart(cart: any): Promise<Cart>;
}
