import { Body, Controller, Delete, Get, Param, Post, Put, BadRequestException } from '@nestjs/common';
import { GuestCartUseCases } from 'src/application/use-cases/guest-cart.use-cases';
import { AddProductToCartDTO, CreateGuestCartDTO } from 'src/domain/entities/cart.entity';

@Controller('guest-carts')
export class GuestCartController {
  constructor(private guestCartUseCases: GuestCartUseCases) {}

  @Post('')
  async createGuestCart(@Body() body: CreateGuestCartDTO) {
    if (!body.sessionId || body.sessionId.trim() === '') {
      throw new BadRequestException('sessionId is required');
    }
    const cart = await this.guestCartUseCases.createGuestCart(body.sessionId);
    return { cart };
  }

  @Post('add-product')
  async addProductToGuestCart(@Body() body: AddProductToCartDTO) {
    if (!body.cartId || body.cartId.trim() === '') {
      throw new BadRequestException('cartId (sessionId) is required');
    }
    const cart = await this.guestCartUseCases.addProductToGuestCart(body);
    return { cart };
  }

  @Get(':sessionId')
  async getGuestCart(@Param('sessionId') sessionId: string) {
    if (!sessionId || sessionId.trim() === '') {
      throw new BadRequestException('sessionId is required');
    }
    const cart = await this.guestCartUseCases.getGuestCart(sessionId);
    return { cart };
  }

  @Delete(':sessionId/remove-product')
  async removeProductFromGuestCart(
    @Param('sessionId') sessionId: string,
    @Body() body: { productId: string; variantId: string; isWholesalePackage: boolean }
  ) {
    if (!sessionId || sessionId.trim() === '') {
      throw new BadRequestException('sessionId is required');
    }
    const cart = await this.guestCartUseCases.removeProductFromGuestCart(
      sessionId, 
      body.productId, 
      body.variantId, 
      body.isWholesalePackage
    );
    return { cart };
  }

  @Put(':cartId/products/:productId/quantity')
  async updateGuestCartQuantity(
    @Param('cartId') cartId: string,
    @Param('productId') productId: string,
    @Body() body: { variantId: string; quantity: number; isWholesalePackage: boolean; predefinedQuantity?: number }
  ) {
    if (!cartId || cartId.trim() === '') {
      throw new BadRequestException('cartId is required');
    }
    const cart = await this.guestCartUseCases.updateGuestCartQuantity(
      cartId,
      productId,
      body.variantId,
      body.quantity,
      body.isWholesalePackage,
      body.predefinedQuantity
    );
    return { cart };
  }
} 