import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Connection, Model } from 'mongoose';
import { Cart } from 'src/domain/entities/cart.entity';
import { Product } from 'src/domain/entities/product.entity';
import { Variant } from 'src/domain/entities/variant.entity';
import { ICartRepository } from 'src/domain/ports/cart-repository.port';
import { CartModel, CartSchema } from 'src/infrastructure/models/cart.model.model';

@Injectable()
export class MongooseCartRepositoryAdapter implements ICartRepository {
  private cartModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.cartModel = this.connection.model(CartModel.name, CartSchema);
  }

  // Create a new cart for a user
  async createCart(userId: string): Promise<Cart> {
    const newCart = new this.cartModel({
      userId,
      items: [],
      total: 0,
    });
    return newCart.save();
  }

  // Add a product to the cart
  async addProduct(cartId: string, product: Product, variant: Variant, quantity: number): Promise<Cart> {
    const cart = await this.getCartById(cartId);

    const cartItem = cart.items.find((item) => item.variant._id.toString() === variant.id);
    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      cart.items.push({
        product: {
          _id: product.id,
          name: product.name,
          code: product.code,
          prices: {
            retail: product.prices.retail,
            reseller: product.prices.reseller,
          },
          pictures: product.pictures,
        },
        variant: {
          _id: variant.id,
          size: variant.size,
          color: variant.color,
        },
        quantity,
      });
    }

    this.calculateTotal(cart);
    return this.updateCart(this.mapToModel(cart));
  }

  // Remove a product from the cart
  async removeProduct(cartId: string, variantId: string): Promise<Cart> {
    const cart = await this.getCartById(cartId);
    cart.items = cart.items.filter((item) => item.variant._id.toString() !== variantId);
    this.calculateTotal(cart);
    return this.updateCart(cart);
  }

  // Update the quantity of a product in the cart
  async updateQuantity(cartId: string, variantId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCartById(cartId);
    const cartItem = cart.items.find((item) => item.variant._id.toString() === variantId);
    if (cartItem) {
      cartItem.quantity = quantity;
    }
    this.calculateTotal(cart);
    cart.id = cartId;
    return this.updateCart(this.mapToModel(cart));
  }

  // Get a cart by its ID
  async getCartById(cartId: string): Promise<Cart> {
    return this.cartModel.findOne({ _id: cartId, active: true }).lean();
  }

  async getCartByUser(userId: string): Promise<Cart> {
    return this.cartModel.findOne({ userId, active: true }).lean();
  }

  // Helper function to calculate the total price of the cart
  private calculateTotal(cart: Cart): void {
    cart.totalReseller = cart.items.reduce((total, item) => total + item.product.prices.reseller * item.quantity, 0);
    cart.totalRetail = cart.items.reduce((total, item) => total + item.product.prices.retail * item.quantity, 0);
  }

  async updateCart(cart: any): Promise<Cart> {
    return this.cartModel.findByIdAndUpdate(cart._id, cart, { new: true });
  }

  private mapToModel(cart: Cart): Partial<CartModel> {
    return {
      _id: new Types.ObjectId(cart.id),
      userId: new Types.ObjectId(cart.userId),
      items: cart.items,
      total_reseller: cart.totalReseller,
      total_retail: cart.totalRetail,
      active: cart.active,
    };
  }

  private mapToEntity(cart: CartModel): Cart {
    return {
      id: cart.id,
      userId: cart.userId.toString(),
      items: cart.items.map((item) => ({
        product: item.product._id.toString(),
        variant: item.variant.id,
        quantity: item.quantity,
      })),
      totalReseller: cart.total_reseller,
      totalRetail: cart.total_retail,
      active: cart.active,
    };
  }
}
