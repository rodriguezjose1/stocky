import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { CartUseCases } from 'src/application/use-cases/cart.use-cases';
import { AddProductToCartDTO } from 'src/domain/entities/cart.entity';
import { Role } from 'src/domain/enums/role.enum';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { BasicAuthGuard } from 'src/infrastructure/auth/guards/basic-auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';

@Controller('carts')
export class CartController {
  constructor(private cartUseCases: CartUseCases) {}

  @UseGuards(BasicAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @Post('/')
  async createCart(@Req() req) {
    const user = req.user;
    const cart = await this.cartUseCases.createCart(user);
    return {
      cart,
    };
  }

  @UseGuards(BasicAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @Post('add-product')
  async addProductToCart(@Body() body: AddProductToCartDTO) {
    const cart = await this.cartUseCases.addProductToCart(body);

    return {
      cart,
    };
  }

  @UseGuards(BasicAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  // delete product
  @Delete('/:cartId/remove-product/:variantId')
  async deleteProduct(@Param('cartId') cartId: string, @Param('variantId') variantId: string) {
    const cart = await this.cartUseCases.removeProductFromCart(cartId, variantId);
    return {
      cart,
    };
  }

  @UseGuards(BasicAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @Put('/:cartId/update-quantity/:variantId')
  async updateProductQuantity(@Param('cartId') cartId: string, @Param('variantId') variantId: string, @Body('quantity') quantity: number, @Body('productId') productId: string) {
    const cart = await this.cartUseCases.updateProductQuantity(cartId, productId, variantId, quantity);
    return {
      cart,
    };
  }

  @UseGuards(BasicAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @Get('/:cartId')
  async getCartById(@Param('cartId') cartId: string) {
    const cart = await this.cartUseCases.getCartById(cartId);
    return {
      cart,
    };
  }

  @UseGuards(BasicAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SELLER)
  @Get('/user/:userId')
  async getCartByUser(@Param('userId') userId: string) {
    const cart = await this.cartUseCases.getCartByUser(userId);
    return {
      cart,
    };
  }
}
