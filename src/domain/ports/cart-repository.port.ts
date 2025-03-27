import { Cart } from '../entities/cart.entity';

export interface ICartRepository {
  createCart(userId: string): Promise<Cart>;
  addProduct(cart): Promise<Cart>;
  removeProduct(cartId: string, variantId: string): Promise<Cart>;
  updateQuantity(cartId: string, productId: string, variantId: string, quantity: number): Promise<Cart>;
  getCartById(cartId: string): Promise<Cart>;
  getCartByUser(userId: string): Promise<Cart>;
  updateCart(cart: any): Promise<Cart>;
}
