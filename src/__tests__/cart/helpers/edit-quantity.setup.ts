import { TestContext } from '../../wholesale/test-setup';
import { User } from '../../../domain/entities/user.entity';

export interface CartWithProductSetup {
  cart: any;
  cartWithProduct: any;
}

export async function setupCartWithProductForEditQuantity(
  context: TestContext,
  user: User,
  productId: string,
  variantId: string,
  initialQuantity: number
): Promise<CartWithProductSetup> {
  const cart = await context.cartUseCases.createCart(user);
  
  const addProductDto = {
    cartId: cart.id,
    productId: productId,
    variantId: variantId,
    quantity: initialQuantity
  };
  
  const cartWithProduct: any = await context.cartUseCases.addProductToCart(addProductDto);
  
  // Verificar que la preparación fue exitosa
  expect(cartWithProduct.items).toHaveLength(1);
  expect(cartWithProduct.items[0].quantity).toBe(initialQuantity);
  
  return {
    cart,
    cartWithProduct
  };
} 