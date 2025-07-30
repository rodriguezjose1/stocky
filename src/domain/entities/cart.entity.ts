import { ApiProperty } from '@nestjs/swagger';

export class CartItem {
  constructor(
    public id: string,
    public product: any,
    public variant: any,
    public quantity: number,
  ) {}
}

// similar to schema
export class Cart {
  constructor(
    public id: string,
    public userId: string,
    public sessionId: string,
    public items: any[],
    public totalReseller: number,
    public totalRetail: number,
    public totalWholesale: number,
    public active: boolean,
  ) {}
}

export class AddProductToCartDTO {
  @ApiProperty({
    description: 'ID del carrito (sessionId para guest carts)',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  cartId: string;

  @ApiProperty({
    description: 'ID del producto',
    example: '507f1f77bcf86cd799439011'
  })
  productId: string;

  @ApiProperty({
    description: 'ID de la variante del producto',
    example: '507f1f77bcf86cd799439012'
  })
  variantId: string;

  @ApiProperty({
    description: 'Cantidad a agregar',
    example: 2,
    minimum: 1
  })
  quantity: number;

  @ApiProperty({
    description: 'Si es un paquete mayorista',
    example: false,
    required: false
  })
  isWholesalePackage?: boolean;

  @ApiProperty({
    description: 'Cantidad predefinida para paquetes mayoristas',
    example: 6,
    required: false
  })
  predefinedQuantity?: number;

  @ApiProperty({
    description: 'Rol del usuario',
    example: 'RETAIL',
    required: false
  })
  userRole?: string;

  constructor(
    cartId: string,
    productId: string,
    variantId: string,
    quantity: number,
    isWholesalePackage?: boolean,
    predefinedQuantity?: number,
    userRole?: string
  ) {
    this.cartId = cartId;
    this.productId = productId;
    this.variantId = variantId;
    this.quantity = quantity;
    this.isWholesalePackage = isWholesalePackage;
    this.predefinedQuantity = predefinedQuantity;
    this.userRole = userRole;
  }
}

export class AddComplexWholesaleProductToCartDTO {
  @ApiProperty({
    description: 'ID del carrito (sessionId para guest carts)',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  cartId: string;

  @ApiProperty({
    description: 'ID del producto',
    example: '507f1f77bcf86cd799439011'
  })
  productId: string;

  @ApiProperty({
    description: 'Cantidad predefinida para paquetes mayoristas complejos',
    example: 6
  })
  predefinedQuantity: number;

  @ApiProperty({
    description: 'Array de variantes con sus cantidades',
    example: [
      {
        variantId: '507f1f77bcf86cd799439012',
        quantity: 2
      },
      {
        variantId: '507f1f77bcf86cd799439013',
        quantity: 4
      }
    ]
  })
  variants: {
    variantId: string;
    quantity: number;
  }[];

  @ApiProperty({
    description: 'Rol del usuario',
    example: 'WHOLESALE',
    required: false
  })
  userRole?: string;

  constructor(
    cartId: string,
    productId: string,
    predefinedQuantity: number,
    variants: {
      variantId: string;
      quantity: number;
    }[],
    userRole?: string
  ) {
    this.cartId = cartId;
    this.productId = productId;
    this.predefinedQuantity = predefinedQuantity;
    this.variants = variants;
    this.userRole = userRole;
  }
}

export class CreateCartDTO {
  constructor(public userId: string) {}
}

export class CreateGuestCartDTO {
  @ApiProperty({
    description: 'UUID único para identificar el carrito de sesión',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }
}
