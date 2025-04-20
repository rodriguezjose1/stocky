import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { CartUseCases } from 'src/application/use-cases/cart.use-cases';
import { AddComplexWholesaleProductToCartDTO, AddProductToCartDTO } from 'src/domain/entities/cart.entity';
import { Role } from 'src/domain/enums/role.enum';
import { Roles } from 'src/infrastructure/auth/decorators/roles.decorator';
import { BasicAuthGuard } from 'src/infrastructure/auth/guards/basic-auth.guard';
import { RolesGuard } from 'src/infrastructure/auth/guards/roles.guard';

@Controller('carts')
export class CartController {
  constructor(private cartUseCases: CartUseCases) { }

  @Post()
  @Roles(Role.ADMIN, Role.SELLER, Role.CUSTOMER)
  @UseGuards(BasicAuthGuard, RolesGuard)
  async createCart(@Req() req) {
    const user = req.user;
    const cart = await this.cartUseCases.createCart(user);
    return {
      cart,
    };
  }

  @Post('add-product')
  @Roles(Role.ADMIN, Role.SELLER, Role.CUSTOMER)
  @UseGuards(BasicAuthGuard, RolesGuard)
  async addProductToCart(@Body() body: AddProductToCartDTO, @Req() req) {
    const userRole = req.user.roles[0].name;
    const cart = await this.cartUseCases.addProductToCart({ ...body, userRole });

    return {
      cart,
    };
  }

  @Post('add-product/complex')
  @Roles(Role.ADMIN, Role.SELLER, Role.CUSTOMER)
  @UseGuards(BasicAuthGuard, RolesGuard)
  async addComplexWholesaleProductToCart(@Body() body: AddComplexWholesaleProductToCartDTO) {
    const cart = await this.cartUseCases.addComplexWholesaleProductToCart({ ...body });

    return {
      cart,
    };
  }

  @Delete('/:cartId/remove-product/:variantId')
  @Roles(Role.ADMIN, Role.SELLER, Role.CUSTOMER)
  @UseGuards(BasicAuthGuard, RolesGuard)
  async deleteProduct(
    @Param('cartId') cartId: string,
    @Param('variantId') variantId: string,
    @Body('productId') productId: string,
    @Body('isWholesalePackage') isWholesalePackage: boolean
  ) {
    const cart = await this.cartUseCases.removeProductFromCart(cartId, variantId, productId, isWholesalePackage);
    return {
      cart,
    };
  }

  @Put('/:cartId/update-quantity/:variantId')
  @Roles(Role.ADMIN, Role.SELLER, Role.CUSTOMER)
  @UseGuards(BasicAuthGuard, RolesGuard)
  async updateProductQuantity(
    @Param('cartId') cartId: string,
    @Param('variantId') variantId: string,
    @Body('quantity') quantity: number,
    @Body('isWholesalePackage') isWholesalePackage: boolean,
    @Body('productId') productId: string,
    @Body('predefinedQuantity') predefinedQuantity: number,
  ) {
    const cart = await this.cartUseCases.updateProductQuantity(cartId, productId, variantId, quantity, isWholesalePackage, predefinedQuantity);
    return {
      cart,
    };
  }

  @Get('/:cartId')
  @Roles(Role.ADMIN, Role.SELLER, Role.CUSTOMER)
  @UseGuards(BasicAuthGuard, RolesGuard)
  async getCartById(@Param('cartId') cartId: string) {
    const cart = await this.cartUseCases.getCartById(cartId);
    return {
      cart,
    };
  }

  @Get('/user/:userId')
  @Roles(Role.ADMIN, Role.SELLER, Role.CUSTOMER)
  @UseGuards(BasicAuthGuard, RolesGuard)
  async getCartByUser(@Param('userId') userId: string) {
    const cart = await this.cartUseCases.getCartByUser(userId);
    return {
      cart,
    };
  }
}
