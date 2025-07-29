import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AddProductToCartDTO, Cart, AddComplexWholesaleProductToCartDTO } from 'src/domain/entities/cart.entity';
import { ICartRepository } from 'src/domain/ports/cart-repository.port';
import { ProductUseCases } from './product.use-cases';
import { StockUseCases } from './stock.use-cases';
import { VariantUseCases } from './variant.use-cases';
import { AppliedPriceTypeEnum } from 'src/domain/entities/sale.entity';
import { packageTypes } from '../constants.use-cases';

@Injectable()
export class GuestCartUseCases {
  constructor(
    @Inject('CartRepositoryPort')
    private readonly cartRepository: ICartRepository,
    private productUseCases: ProductUseCases,
    private variantUseCases: VariantUseCases,
    private stockUseCases: StockUseCases,
  ) {}

  async createGuestCart(sessionId: string): Promise<Cart> {
    const existingCart = await this.cartRepository.getCartBySessionId(sessionId);
    if (existingCart) {
      return existingCart;
    }
    return this.cartRepository.createSessionCart(sessionId);
  }

  async addProductToGuestCart({
    cartId,
    productId,
    variantId,
    quantity,
    isWholesalePackage,
    predefinedQuantity,
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
      throw new BadRequestException('Wholesale package not allowed for this product');
    }

    const variant = await this.variantUseCases.getVariantById(variantId);
    if (!variant) {
      throw new BadRequestException('Variant not found');
    }

    // Validar stock disponible
    const quantityInStock = await this.stockUseCases.getQuantityByVariantId(productId, variantId);
    if (quantity > quantityInStock) {
      throw new BadRequestException('Insufficient stock');
    }

    // Buscar si el producto ya existe en el carrito
    let cartItem = cart.items.find((item) =>
      item.product._id.toString() === product.id &&
      item.variant?._id.toString() === variant.id &&
      !item.is_wholesale_package
    );

    if (isWholesalePackage) {
      cartItem = cart.items.find((item) =>
        item.product._id.toString() === product.id &&
        item.is_wholesale_package
      );
    }

    if (cartItem) {
      // Actualizar cantidad existente
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
      // Crear nuevo item
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
          color_label: variant.colorLabel,
          size_label: variant.sizeLabel,
        },
        quantity,
        is_wholesale_package: isWholesalePackage || false,
        applied_price_type: AppliedPriceTypeEnum.RETAIL // Siempre RETAIL para guest
      };

      if (isWholesalePackage) {
        newItem.is_wholesale_package = true;
        if (product.wholesaleData.packageType === packageTypes.complex) {
          newItem.variant = null;
          newItem.predefined_quantity = predefinedQuantity;
          newItem.wholesale_variants = this.getWholesaleVariants(product, cart, variant, predefinedQuantity, quantity);
        } else {
          newItem.predefined_quantity = predefinedQuantity;
        }
      }

      cart.items.push(newItem);
    }

    return this.cartRepository.addProduct(cart);
  }

  async addComplexWholesaleProductToGuestCart({
    cartId,
    productId,
    predefinedQuantity,
    variants,
    userRole,
  }: AddComplexWholesaleProductToCartDTO): Promise<Cart> {
    const cart = await this.cartRepository.getCartById(cartId);
    if (!cart) {
      throw new BadRequestException('Cart not found');
    }

    const product = await this.productUseCases.getProductById(productId);
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    if (!product.wholesaleData.isWholesaler) {
      throw new BadRequestException('Wholesale package not allowed for this product');
    }

    if (product.wholesaleData.packageType !== packageTypes.complex) {
      throw new BadRequestException('Product is not a complex wholesale package');
    }

    // Validar stock para todas las variantes
    for (const variantData of variants) {
      const quantityInStock = await this.stockUseCases.getQuantityByVariantId(productId, variantData.variantId);
      if (variantData.quantity > quantityInStock) {
        throw new BadRequestException(`Insufficient stock for variant ${variantData.variantId}`);
      }
    }

    // Buscar si el producto ya existe en el carrito como paquete mayorista complejo
    let cartItem = cart.items.find((item) =>
      item.product._id.toString() === product.id &&
      item.is_wholesale_package &&
      item.product.wholesale_data.package_type === packageTypes.complex
    );

    if (cartItem) {
      // Actualizar variantes existentes
      for (const variantData of variants) {
        const existingVariant = cartItem.wholesale_variants.find(
          (v) => v.variant._id.toString() === variantData.variantId
        );
        
        if (existingVariant) {
          existingVariant.quantity += variantData.quantity;
        } else {
          const variant = await this.variantUseCases.getVariantById(variantData.variantId);
          if (!variant) {
            throw new BadRequestException(`Variant ${variantData.variantId} not found`);
          }
          
          cartItem.wholesale_variants.push({
            variant: {
              _id: variant.id,
              size: variant.size,
              color: variant.color,
              color_label: variant.colorLabel,
              size_label: variant.sizeLabel,
            },
            quantity: variantData.quantity,
          });
        }
      }
      
      cartItem.quantity = cartItem.wholesale_variants.reduce((acc, v) => acc + v.quantity, 0);
      cartItem.predefined_quantity = predefinedQuantity;
    } else {
      // Crear nuevo item complejo
      const wholesaleVariants = [];
      
      for (const variantData of variants) {
        const variant = await this.variantUseCases.getVariantById(variantData.variantId);
        if (!variant) {
          throw new BadRequestException(`Variant ${variantData.variantId} not found`);
        }
        
        wholesaleVariants.push({
          variant: {
            _id: variant.id,
            size: variant.size,
            color: variant.color,
            color_label: variant.colorLabel,
            size_label: variant.sizeLabel,
          },
          quantity: variantData.quantity,
        });
      }

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
        variant: null, // Para paquetes complejos, variant es null
        quantity: wholesaleVariants.reduce((acc, v) => acc + v.quantity, 0),
        is_wholesale_package: true,
        predefined_quantity: predefinedQuantity,
        wholesale_variants: wholesaleVariants,
        applied_price_type: AppliedPriceTypeEnum.RETAIL // Siempre RETAIL para guest
      };

      cart.items.push(newItem);
    }

    return this.cartRepository.addProduct(cart);
  }

  async getGuestCart(sessionId: string): Promise<Cart> {
    return this.cartRepository.getCartBySessionId(sessionId);
  }

  async removeProductFromGuestCart(cartId: string, productId: string, variantId: string, isWholesalePackage: boolean): Promise<Cart> {
    const cart = await this.cartRepository.getCartById(cartId);
    if (!cart) {
      throw new BadRequestException('Cart not found');
    }

    if (isWholesalePackage) {
      const cartItem = cart.items.find((item) => item.product._id.toString() === productId && item.is_wholesale_package);
      if (!cartItem) {
        throw new BadRequestException('Wholesale package not found');
      }

      if (cartItem.product.wholesale_data.package_type === packageTypes.complex && variantId !== 'null') {
        cartItem.wholesale_variants = cartItem.wholesale_variants.filter((v) => v.variant._id.toString() !== variantId);
        cartItem.quantity = cartItem.wholesale_variants.reduce((acc, v) => acc + v.quantity, 0);
      } else if (cartItem.product.wholesale_data.package_type === packageTypes.complex && variantId === 'null') {
        cart.items = cart.items.filter((item) => !(item.product._id.toString() === productId && item.variant === null));
      } else {
        cart.items = cart.items.filter((item) => !(item.product._id.toString() === productId && item.variant._id.toString() === variantId));
      }
    } else {
      const getVariantValue = (item) => item.variant ? item.variant._id.toString() : null;
      const isVariantIdEqual = (item) => getVariantValue(item) === variantId;
      cart.items = cart.items.filter((item) => !(item.product._id.toString() === productId && isVariantIdEqual(item)));
    }

    return this.cartRepository.removeProduct(cart);
  }

  async updateGuestCartQuantity(cartId: string, productId: string, variantId: string, quantity: number, isWholesalePackage: boolean, predefinedQuantity?: number): Promise<Cart> {
    const cart = await this.cartRepository.getCartById(cartId);
    if (!cart) {
      throw new BadRequestException('Cart not found');
    }

    const quantityInStock = await this.stockUseCases.getQuantityByVariantId(productId, variantId);
    if (quantity > quantityInStock) {
      throw new BadRequestException('Insufficient stock');
    }

    let cartItem;
    if (isWholesalePackage) {
      cartItem = cart.items.find((item) =>
        item.product._id.toString() === productId &&
        item.is_wholesale_package
      );
    } else {
      cartItem = cart.items.find((item) =>
        item.product._id.toString() === productId &&
        item.variant?._id.toString() === variantId &&
        !item.is_wholesale_package
      );
    }

    if (!cartItem) {
      throw new BadRequestException('Product not found in cart');
    }

    if (isWholesalePackage) {
      if (cartItem.product.wholesale_data.package_type === packageTypes.complex) {
        const product = await this.productUseCases.getProductById(productId);
        const variant = await this.variantUseCases.getVariantById(variantId);
        const wholesaleVariants = this.getWholesaleVariants(product, cart, variant, predefinedQuantity, quantity);
        cartItem.wholesale_variants = wholesaleVariants;
        cartItem.quantity = wholesaleVariants.reduce((acc, v) => acc + v.quantity, 0);
        cartItem.predefined_quantity = predefinedQuantity;
      } else {
        cartItem.quantity = quantity;
      }
    } else {
      cartItem.quantity = quantity;
    }

    return this.cartRepository.updateQuantity(cart);
  }

  private getWholesaleVariants(product: any, cart: any, variant: any, predefinedQuantity: number, quantity: number) {
    return [{
      variant: { ...variant, color_label: variant.colorLabel, size_label: variant.sizeLabel, _id: variant.id },
      quantity: quantity
    }];
  }
} 