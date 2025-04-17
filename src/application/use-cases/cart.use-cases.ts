import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AddProductToCartDTO, Cart } from 'src/domain/entities/cart.entity';
import { User } from 'src/domain/entities/user.entity';
import { ICartRepository } from 'src/domain/ports/cart-repository.port';
import { ProductUseCases } from './product.use-cases';
import { StockUseCases } from './stock.use-cases';
import { VariantUseCases } from './variant.use-cases';
import { productErrors } from '../error.constants';
import { packageTypes } from '../constants.use-cases';

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
    const cart = await this.cartRepository.getCartById(cartId);
    if (!cart) {
      throw new BadRequestException('Cart not found');
    }

    const product = await this.productUseCases.getProductById(productId);
    if (!product) {
      throw new BadRequestException('Product not found');
    }


    if (isWholesalePackage && !product.wholesaleData.isWholesaler) {
      throw new BadRequestException(productErrors.wholesalePackageNotAllowed);
    }

    const variant = await this.variantUseCases.getVariantById(variantId);
    if (!variant) {
      throw new BadRequestException('Variant not found');
    }

    const quantityInStock = await this.stockUseCases.getQuantityByVariantId(productId, variantId);
    if (quantity > quantityInStock) {
      throw new BadRequestException('Insufficient stock');
    }
    // checkear si el producto normal existe

    let cartItemNormal = cart.items.find((item) =>
      item.product._id.toString() === product.id &&
      item.variant?._id.toString() === variant.id &&
      !item.is_wholesale_package
    );

    let cartItemWholesaleSimple = cart.items.find((item) =>
      item.product._id.toString() === product.id &&
      item.variant?._id.toString() === variant.id &&
      item.product.wholesale_data.package_type === packageTypes.simple &&
      item.is_wholesale_package
    );

    let cartItemWholesaleComplex = cart.items.find((item) =>
      item.product._id.toString() === product.id &&
      item.product.wholesale_data.package_type === packageTypes.complex &&
      item.is_wholesale_package
    );

    let cartItem = cartItemNormal || cartItemWholesaleSimple || cartItemWholesaleComplex;

    // si el producto normal existe y no es mayorista, buscar el paquete mayorista
    // if (cartItem && !isWholesalePackage && cartItem.is_wholesale_package && product.wholesaleData.packageType === packageTypes.complex) {
    //   cartItem = cart.items.find((item) =>
    //     item.product._id.toString() === product.id &&
    //     (item.variant?._id.toString() === variant.id || !item.variant) &&
    //     !item.is_wholesale_package
    //   );
    // }

    if (cartItem) {
      if (isWholesalePackage) {
        if (product.wholesaleData.packageType === packageTypes.complex) {
          const wholesaleVariants = this.getWholesaleVariants(product, cart, variant, predefinedQuantity, quantity);
          cartItem.wholesale_variants = wholesaleVariants;
          cartItem.quantity = wholesaleVariants.reduce((acc, v) => acc + v.quantity, 0);
          cartItem.predefined_quantity = predefinedQuantity;
        } else {
          cartItem.quantity += quantity;
        }
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
          wholesale_data: {
            is_wholesaler: product.wholesaleData.isWholesaler,
            package_type: product.wholesaleData.packageType,
          },
        },
        variant: {
          _id: variant.id,
          size: variant.size,
          color: variant.color,
        },
        quantity,
        is_wholesale_package: isWholesalePackage || false
      };

      if (isWholesalePackage) {
        newItem.is_wholesale_package = true;
        if (product.wholesaleData.packageType === packageTypes.complex) {
          newItem.variant = null;
          newItem.predefined_quantity = predefinedQuantity;
          newItem.wholesale_variants = this.getWholesaleVariants(product, cart, variant, predefinedQuantity, quantity);
        } else {
          newItem.predefined_quantity = predefinedQuantity;
          newItem.quantity += quantity;
        }
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
    }

    // Si ya existe un paquete, validar que la suma de todas las variantes no exceda la cantidad predefinida
    // if (productItems.length > 0) {
    //   const wholesaleItem = productItems[0];
    //   // Calcular la suma total de todas las variantes
    //   const totalVariantsQuantity = wholesaleItem.wholesale_variants.reduce(
    //     (sum, v) => sum + v.quantity,
    //     0
    //   );

    //   // Calcular la nueva suma total incluyendo la nueva variante
    //   const newTotalVariantsQuantity = totalVariantsQuantity + quantity;

    //   if (newTotalVariantsQuantity > wholesaleItem.predefined_quantity) {
    //     throw new BadRequestException(
    //       `La suma total de las variantes (${newTotalVariantsQuantity}) excede la cantidad predefinida elegida de ${wholesaleItem.predefined_quantity}`
    //     );
    //   }
    // }

    // Si ya existe un item mayorista, actualizar sus variantes
    if (productItems.length > 0) {
      const wholesaleItem = productItems[0];
      // Agregar o actualizar la variante en wholesale_variants
      const existingVariant = wholesaleItem.wholesale_variants.find(
        v => v.variant._id.toString() === variant.id
      );
      if (existingVariant) {
        existingVariant.quantity = quantity;
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

  async removeProductFromCart(cartId: string, variantId: string, productId: string, isWholesalePackage: boolean): Promise<Cart> {
    const cart = await this.cartRepository.getCartById(cartId);
    if (isWholesalePackage) {
      const cartItem = cart.items.find((item) => item.product._id.toString() === productId && item.is_wholesale_package);
      if (!cartItem) {
        throw new BadRequestException('El producto no es un paquete mayorista');
      }

      if (cartItem.product.wholesale_data.package_type === packageTypes.complex && variantId !== 'null') {
        cartItem.wholesale_variants = cartItem.wholesale_variants.filter((v) => v.variant._id.toString() !== variantId);
        cartItem.quantity = cartItem.wholesale_variants.reduce((acc, v) => acc + v.quantity, 0);
      } else {
        cart.items = cart.items.filter((item) => item.product._id.toString() !== productId);
      }
    } else {
      // delete from normal product
      cart.items = cart.items.filter((item) => item.product._id.toString() !== productId && item.variant?._id.toString() !== variantId);
    }
    return this.cartRepository.removeProduct(cart);
  }

  async updateProductQuantity(cartId: string, productId: string, variantId: string, quantity: number, isWholesalePackage: boolean, predefinedQuantity: number): Promise<Cart> {
    const quantityInStock = await this.stockUseCases.getQuantityByVariantId(productId, variantId);

    const cart = await this.cartRepository.getCartById(cartId);

    let totalQuantityInWholesaleVariants = 0;
    if (isWholesalePackage) {
      // Calculate total quantity for specific variant in wholesale packages
      totalQuantityInWholesaleVariants = cart.items.reduce((acc, item) => {
        if (item.product._id.toString() === productId && item.is_wholesale_package) {
          const variant = item.wholesale_variants.find(v => v.variant._id.toString() === variantId);
          return acc + (variant?.quantity || 0);
        }
        return acc;
      }, 0);
    }

    // check sum quantities of same product into wholesale variants and normal product
    const totalQuantityInNormalProduct = cart.items.reduce((acc, item) => {
      if (item.product._id.toString() === productId && !item.is_wholesale_package) {
        return acc + item.quantity;
      }
      return acc;
    }, 0);

    const totalQuantity = totalQuantityInWholesaleVariants + totalQuantityInNormalProduct;
    if (totalQuantity + quantity > quantityInStock) {
      throw new BadRequestException('Insufficient stock');
    }

    let cartItem;
    if (isWholesalePackage) {
      cartItem = cart.items.find((item) => item.product._id.toString() === productId && item.is_wholesale_package);
      if (!cartItem) {
        throw new BadRequestException('El producto no es un paquete mayorista');
      }

      if (cartItem.product.wholesale_data.package_type === packageTypes.complex) {
        // find wholesale variant and update quantity
        const wholesaleVariant = cartItem.wholesale_variants.find((v) => v.variant._id.toString() === variantId);
        if (!wholesaleVariant) {
          throw new BadRequestException('La variante no es un paquete mayorista');
        }

        wholesaleVariant.quantity = quantity;
        cartItem.quantity = cartItem.wholesale_variants.reduce((acc, v) => acc + v.quantity, 0);
      } else {
        cart.items = cart.items.filter((item) => item.product._id.toString() !== productId);
      }
    } else {
      // find cart item and update quantity
      cartItem = cart.items.find((item) => item.product._id.toString() === productId && item.variant?._id.toString() === variantId);
      if (!cartItem) {
        throw new BadRequestException('El producto no es un paquete mayorista');
      }

      cartItem.quantity = quantity;
    }

    cartItem.predefined_quantity = predefinedQuantity;

    const updatedCart = await this.cartRepository.updateQuantity(cart);
    return updatedCart;
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
