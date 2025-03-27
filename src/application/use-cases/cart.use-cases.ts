import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AddProductToCartDTO, Cart } from 'src/domain/entities/cart.entity';
import { User } from 'src/domain/entities/user.entity';
import { ICartRepository } from 'src/domain/ports/cart-repository.port';
import { ProductUseCases } from './product.use-cases';
import { StockUseCases } from './stock.use-cases';
import { VariantUseCases } from './variant.use-cases';

@Injectable()
export class CartUseCases {
  constructor(
    @Inject('CartRepositoryPort')
    private readonly cartRepository: ICartRepository,
    private productUseCases: ProductUseCases,
    private variantUseCases: VariantUseCases,
    private stockUseCases: StockUseCases,
  ) { }
  async createCart(user: User): Promise<Cart> {
    const cart = await this.cartRepository.getCartByUser(user.id);
    if (cart) {
      return cart;
    }
    return this.cartRepository.createCart(user.id);
  }

  async addProductToCart({
    cartId,
    productId,
    variantId,
    quantity,
    isWholesalePackage,
    predefinedQuantity
  }: AddProductToCartDTO): Promise<Cart> {
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

    // Obtener el carrito actual
    const cart = await this.cartRepository.getCartById(cartId);

    // checkear si el producto normal existe

    let cartItem = cart.items.find((item) =>
      item.product._id.toString() === product.id &&
      (item.variant?._id.toString() === variant.id || !item.variant)
    );

    if (cartItem && !isWholesalePackage && cartItem.is_wholesale_package) {
      cartItem = cart.items.find((item) =>
        item.product._id.toString() === product.id &&
        (item.variant?._id.toString() === variant.id || !item.variant) &&
        !item.is_wholesale_package
      );
    }

    // producto normal si existe y no es mayorista
    if (cartItem) {
      if (isWholesalePackage) {
        const wholesaleVariants = this.getWholesaleVariants(product, cart, variant, predefinedQuantity, quantity);
        cartItem.wholesale_variants = wholesaleVariants;
        cartItem.quantity = wholesaleVariants.reduce((acc, v) => acc + v.quantity, 0);
      } else {
        cartItem.quantity += quantity;
      }
    } else {
      const newItem: any = {
        product: {
          _id: product.id,
          name: product.name,
          code: product.code,
          prices: {
            retail: product.prices.retail,
            reseller: product.prices.reseller,
            wholesale: product.prices.wholesale,
          },
          pictures: product.pictures,
        },
        variant: {
          _id: variant.id,
          size: variant.size,
          color: variant.color,
        },
        quantity,
      };

      if (isWholesalePackage) {
        newItem.variant = null;
        newItem.is_wholesale_package = true;
        newItem.predefined_quantity = predefinedQuantity;
        newItem.wholesale_variants = this.getWholesaleVariants(product, cart, variant, predefinedQuantity, quantity);
      }

      cart.items.push(newItem);
    }

    return this.cartRepository.addProduct(cart);
  }

  getWholesaleVariants(product, cart, variant, predefinedQuantity, quantity) {
    const productItems = cart.items.filter(item => item.product._id.toString() === product.id && item.is_wholesale_package);
    if (!product.wholesaleData?.isWholesaler) {
      throw new BadRequestException('Este producto no permite ser agregado como paquete mayorista');
    }

    // Si es el primer item mayorista, validar la cantidad predefinida
    if (productItems.length === 0) {
      if (!predefinedQuantity) {
        throw new BadRequestException('Debe especificar la cantidad predefinida para el paquete mayorista');
      }

      if (!product.wholesaleData.predefinedQuantities.includes(predefinedQuantity)) {
        throw new BadRequestException(
          `La cantidad predefinida ${predefinedQuantity} debe ser una de las cantidades permitidas: ${product.wholesaleData.predefinedQuantities.join(', ')}`
        );
      }
    }

    // Si ya existe un paquete, validar que la suma de todas las variantes no exceda la cantidad predefinida
    if (productItems.length > 0) {
      const wholesaleItem = productItems[0];
      // Calcular la suma total de todas las variantes
      const totalVariantsQuantity = wholesaleItem.wholesale_variants.reduce(
        (sum, v) => sum + v.quantity,
        0
      );

      // Calcular la nueva suma total incluyendo la nueva variante
      const newTotalVariantsQuantity = totalVariantsQuantity + quantity;

      if (newTotalVariantsQuantity > wholesaleItem.predefined_quantity) {
        throw new BadRequestException(
          `La suma total de las variantes (${newTotalVariantsQuantity}) excede la cantidad predefinida elegida de ${wholesaleItem.predefined_quantity}`
        );
      }
    }

    // Si ya existe un item mayorista, actualizar sus variantes
    if (productItems.length > 0) {
      const wholesaleItem = productItems[0];
      // Agregar o actualizar la variante en wholesale_variants
      const existingVariant = wholesaleItem.wholesale_variants.find(
        v => v.variant._id.toString() === variant.id
      );
      if (existingVariant) {
        existingVariant.quantity += quantity;
      } else {
        wholesaleItem.wholesale_variants.push({
          variant: { ...variant, _id: variant.id },
          quantity: quantity
        });
      }
      return wholesaleItem.wholesale_variants;
    } else {
      return [{
        variant: { ...variant, _id: variant.id },
        quantity: quantity
      }];
    }
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
