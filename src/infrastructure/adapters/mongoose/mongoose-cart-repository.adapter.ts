import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { packageTypes } from 'src/application/constants.use-cases';
import { Cart } from 'src/domain/entities/cart.entity';
import { ICartRepository } from 'src/domain/ports/cart-repository.port';
import { CartModel, CartSchema } from 'src/infrastructure/models/cart.model.model';
import { ProductModel, ProductSchema } from 'src/infrastructure/models/product.model';
import { StockModel, StockSchema } from 'src/infrastructure/models/stock.model';

@Injectable()
export class MongooseCartRepositoryAdapter implements ICartRepository {
  private cartModel = Model<any>;
  private stockModel = Model<any>;
  private productModel = Model<any>;
  constructor(@InjectConnection() private connection: Connection) {
    this.cartModel = this.connection.model(CartModel.name, CartSchema);
    this.stockModel = this.connection.model(StockModel.name, StockSchema);
    this.productModel = this.connection.model(ProductModel.name, ProductSchema);
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
  async addProduct(cart): Promise<Cart> {
    cart.id = cart._id.toString();
    await this.calculateTotal(cart);
    const updatedCart = await this.updateCart(this.mapToModel(cart));
    return this.mapStockToCart(updatedCart);
  }

  // Remove a product from the cart
  async removeProduct(cartToUpdate): Promise<Cart> {
    await this.calculateTotal(cartToUpdate);
    cartToUpdate.id = cartToUpdate._id.toString();
    const updatedCart = await this.updateCart(this.mapToModel(cartToUpdate));
    return this.mapStockToCart(updatedCart);
  }

  async getVariantInCart(cartId: string, variantId: string): Promise<Cart> {
    const cart = await this.getCartById(cartId);
    return cart.items.find((item) => item.variant._id.toString() === variantId);
  }

  // Update the quantity of a product in the cart
  async updateQuantity(cartToUpdate): Promise<Cart> {
    await this.calculateTotal(cartToUpdate);
    cartToUpdate.id = cartToUpdate._id.toString();
    const updatedCart = await this.updateCart(this.mapToModel(cartToUpdate));
    return this.mapStockToCart(updatedCart);
  }

  // Get a cart by its ID
  async getCartById(cartId: string): Promise<Cart> {
    return this.cartModel.findOne({ _id: cartId, active: true }).lean();
  }

  async getCartByUser(userId: string): Promise<Cart> {
    const cart: Cart = await this.cartModel.findOne({ userId, active: true }).lean();

    if (cart && cart.items.length > 0) {
      const calls = cart.items.map(async (item, i) => {
        if (item.is_wholesale_package && item.product.wholesale_data.package_type === packageTypes.complex) {
          const calls = item.wholesale_variants.map(async (wv, j) => {
            const stock = await this.stockModel.find({ product: item.product._id, variant: wv.variant._id }).exec();
            item.wholesale_variants[j].stock = stock[0];
            if (stock.length > 1) {
              item.wholesale_variants[j].stock.quantity = stock.reduce((acc, curr) => {
                return acc + curr.quantity;
              }, 0);
            }
          });
          await Promise.all(calls);
        } else {
          const stock = await this.stockModel.find({ product: item.product._id, variant: item.variant._id }).exec();
          item.stock = stock[0];
          if (stock.length > 1) {
            item.stock.quantity = stock.reduce((acc, curr) => {
              return acc + curr.quantity;
            }, 0);
          }
        }
      });
      await Promise.all(calls);
    }

    return cart;
  }

  // Helper function to calculate the total price of the cart
  private async calculateTotal(cart: Cart): Promise<void> {
    const productIds = cart.items.map((item) => item.product._id);
    const products = await this.productModel.find({ _id: { $in: productIds } }).lean();
    // Create a map of products indexed by product ID for easier access
    const productsMap = products.reduce((map, product) => {
      map[product._id.toString()] = product;
      return map;
    }, {});
    
    if (cart.items.length === 0) {
      cart.totalReseller = 0;
      cart.totalRetail = 0;
      cart.totalWholesale = 0;
      return;
    }
    cart.totalReseller = cart.items.reduce((total, item) => {
        return total + productsMap[item.product._id.toString()].prices.reseller * item.quantity;
    }, 0);
    cart.totalRetail = cart.items.reduce((total, item) => {
      return total + productsMap[item.product._id.toString()].prices.retail * item.quantity;
    }, 0);
    cart.totalWholesale = cart.items.reduce((total, item) => {
      if (item.is_wholesale_package) {
        if (item.predefined_quantity === 6) {
          return total + (productsMap[item.product._id.toString()].prices.wholesale.half_dozen || 0) * item.quantity;
        } else {
          return total + (productsMap[item.product._id.toString()].prices.wholesale.dozen || 0) * item.quantity;
        }
      }
      return total;
    }, 0);
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
      total_wholesale: cart.totalWholesale,
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
      totalWholesale: cart.total_wholesale,
      active: cart.active,
    };
  }

  private async mapStockToCart(cart: Cart): Promise<Cart> {
    if (cart && cart.items.length > 0) {
      const calls = cart.items.map(async (item, i) => {
        if (item.is_wholesale_package && item.product.wholesale_data.package_type === packageTypes.complex) {
          const calls = item.wholesale_variants.map(async (wv, j) => {
            const stock = await this.stockModel.findOne({ product: item.product._id, variant: wv.variant._id }).exec();
            item.wholesale_variants[j].stock = stock;
          });
          await Promise.all(calls);
        } else {
          const stock = await this.stockModel.findOne({ product: item.product._id, variant: item.variant._id }).exec();
          item.stock = stock;
        }
      });
      await Promise.all(calls);
    }
    return cart;
  }
}
