import { Cart } from '../entities/cart.entity';

export interface ICartRepository {
  createCart(userId: string): Promise<Cart>;
  addProduct(cart): Promise<Cart>;
  removeProduct(cartToUpdate): Promise<Cart>;
  updateQuantity(cartToUpdate): Promise<Cart>;
  getCartById(cartId: string): Promise<Cart>;
  getCartByUser(userId: string): Promise<Cart>;
  updateCart(cart: any): Promise<Cart>;
}
