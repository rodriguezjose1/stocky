import { Body, Controller, Delete, Get, Param, Post, Put, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { GuestCartUseCases } from 'src/application/use-cases/guest-cart.use-cases';
import { AddProductToCartDTO, CreateGuestCartDTO, AddComplexWholesaleProductToCartDTO } from 'src/domain/entities/cart.entity';

@ApiTags('guest-carts')
@Controller('guest-carts')
export class GuestCartController {
  constructor(private guestCartUseCases: GuestCartUseCases) {}

  @Post('')
  @ApiOperation({ summary: 'Crear carrito de sesión para usuario no autenticado' })
  @ApiBody({
    type: CreateGuestCartDTO,
    description: 'Datos para crear un carrito de sesión',
    examples: {
      example1: {
        summary: 'Crear carrito con sessionId',
        value: {
          sessionId: '550e8400-e29b-41d4-a716-446655440000'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Carrito creado exitosamente' })
  @ApiResponse({ status: 400, description: 'sessionId es requerido' })
  async createGuestCart(@Body() body: CreateGuestCartDTO) {
    if (!body.sessionId || body.sessionId.trim() === '') {
      throw new BadRequestException('sessionId is required');
    }
    const cart = await this.guestCartUseCases.createGuestCart(body.sessionId);
    return { cart };
  }

  @Post('add-product')
  @ApiOperation({ summary: 'Agregar producto al carrito' })
  @ApiBody({
    type: AddProductToCartDTO,
    description: 'Datos para agregar un producto al carrito',
    examples: {
      example1: {
        summary: 'Agregar producto normal',
        value: {
          cartId: '550e8400-e29b-41d4-a716-446655440000',
          productId: '507f1f77bcf86cd799439011',
          variantId: '507f1f77bcf86cd799439012',
          quantity: 2
        }
      },
      example2: {
        summary: 'Agregar paquete mayorista',
        value: {
          cartId: '550e8400-e29b-41d4-a716-446655440000',
          productId: '507f1f77bcf86cd799439011',
          variantId: '507f1f77bcf86cd799439012',
          quantity: 1,
          isWholesalePackage: true,
          predefinedQuantity: 6
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Producto agregado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async addProductToGuestCart(@Body() body: AddProductToCartDTO) {
    if (!body.cartId || body.cartId.trim() === '') {
      throw new BadRequestException('cartId (sessionId) is required');
    }
    const cart = await this.guestCartUseCases.addProductToGuestCart(body);
    return { cart };
  }

  @Post('add-product/complex')
  @ApiOperation({ summary: 'Agregar producto mayorista complejo con múltiples variantes' })
  @ApiBody({
    type: AddComplexWholesaleProductToCartDTO,
    description: 'Datos para agregar un producto mayorista complejo',
    examples: {
      example1: {
        summary: 'Agregar producto mayorista complejo',
        value: {
          cartId: '550e8400-e29b-41d4-a716-446655440000',
          productId: '507f1f77bcf86cd799439011',
          predefinedQuantity: 6,
          variants: [
            {
              variantId: '507f1f77bcf86cd799439012',
              quantity: 2
            },
            {
              variantId: '507f1f77bcf86cd799439013',
              quantity: 4
            }
          ],
          userRole: 'WHOLESALE'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Producto mayorista complejo agregado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async addComplexWholesaleProductToGuestCart(@Body() body: AddComplexWholesaleProductToCartDTO) {
    if (!body.cartId || body.cartId.trim() === '') {
      throw new BadRequestException('cartId (sessionId) is required');
    }
    const cart = await this.guestCartUseCases.addComplexWholesaleProductToGuestCart(body);
    return { cart };
  }

  @Get(':cartId')
  @ApiOperation({ summary: 'Obtener carrito por ID' })
  @ApiParam({ name: 'cartId', description: 'ID del carrito' })
  @ApiResponse({ status: 200, description: 'Carrito encontrado' })
  @ApiResponse({ status: 404, description: 'Carrito no encontrado' })
  async getGuestCart(@Param('cartId') cartId: string) {
    if (!cartId || cartId.trim() === '') {
      throw new BadRequestException('cartId is required');
    }
    const cart = await this.guestCartUseCases.getGuestCart(cartId);
    return { cart };
  }

  @Delete(':cartId/products/:productId')
  @ApiOperation({ summary: 'Eliminar producto del carrito' })
  @ApiParam({ name: 'cartId', description: 'ID del carrito' })
  @ApiParam({ name: 'productId', description: 'ID del producto' })
  @ApiBody({
    description: 'Datos para eliminar un producto del carrito',
    examples: {
      example1: {
        summary: 'Eliminar producto normal',
        value: {
          variantId: '507f1f77bcf86cd799439012',
          isWholesalePackage: false
        }
      },
      example2: {
        summary: 'Eliminar paquete mayorista',
        value: {
          variantId: '507f1f77bcf86cd799439012',
          isWholesalePackage: true
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Producto eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Carrito o producto no encontrado' })
  async removeProductFromGuestCart(
    @Param('cartId') cartId: string,
    @Param('productId') productId: string,
    @Body() body: { variantId: string; isWholesalePackage: boolean }
  ) {
    if (!cartId || cartId.trim() === '') {
      throw new BadRequestException('cartId is required');
    }
    const cart = await this.guestCartUseCases.removeProductFromGuestCart(
      cartId, 
      productId, 
      body.variantId, 
      body.isWholesalePackage
    );
    return { cart };
  }

  @Put(':cartId/products/:productId/quantity')
  @ApiOperation({ summary: 'Actualizar cantidad de producto en el carrito' })
  @ApiParam({ name: 'cartId', description: 'ID del carrito' })
  @ApiParam({ name: 'productId', description: 'ID del producto' })
  @ApiBody({
    description: 'Datos para actualizar la cantidad de un producto',
    examples: {
      example1: {
        summary: 'Actualizar producto normal',
        value: {
          variantId: '507f1f77bcf86cd799439012',
          quantity: 3,
          isWholesalePackage: false
        }
      },
      example2: {
        summary: 'Actualizar paquete mayorista',
        value: {
          variantId: '507f1f77bcf86cd799439012',
          quantity: 1,
          isWholesalePackage: true,
          predefinedQuantity: 12
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Cantidad actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Carrito o producto no encontrado' })
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