import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SaleStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum AppliedPriceTypeEnum {
  RETAIL = 'retail',
  WHOLESALE = 'wholesale',
  RESELLER = 'reseller',
  WHOLESALE_HALF_DOZEN = 'wholesale_half_dozen',
  WHOLESALE_DOZEN = 'wholesale_dozen',
}

export type AppliedPriceType = AppliedPriceTypeEnum.RETAIL | AppliedPriceTypeEnum.WHOLESALE | AppliedPriceTypeEnum.RESELLER |
  AppliedPriceTypeEnum.WHOLESALE_HALF_DOZEN | AppliedPriceTypeEnum.WHOLESALE_DOZEN | null | undefined;

export class GetSalesFilterDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  page?: number; // Página de semanas

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  limit?: number; // Límite de semanas a devolver

  user;
}

export class Prices {
  constructor(
    public cost?: number,
    public retail?: number,
    public reseller?: number,
    public wholesale?: number,
  ) {}
}

export class SaleDetail {
  constructor(
    public productId: string,
    public variantId: string,
    public quantity: number,
    public prices?: Prices,
    public variantData?: VariantData,
    public isWholesalePackage?: boolean,
    public predefinedQuantity?: number,
    public wholesaleVariants?: {
      variant: VariantData;
      quantity: number;
    }[],
    public appliedPriceType?: AppliedPriceType,
  ) {}
}

export interface UserData {
  id: string;
  name: string;
  lastname: string;
  phone: string;
  address: string;
  email: string;
}

interface VariantAttribute {
  name: string;
  value: string;
  label: string;
  keyLabel: string;
}

interface VariantData {
  productName?: string;
  productCode?: string;
  variantId?: string;
  variantAttributes?: VariantAttribute[];
  // fix this
  _id?: string;
  color?: string;
  size?: string;
  color_label?: string;
  size_label?: string;
}

export class StocksUpdated {
  constructor(
    public stock: string,
    public variantData: VariantData,
    public quantity: number,
    public prices?: {
      cost?: number;
      retail?: number;
      reseller?: number;
      wholesale?: number | {
        half_dozen: number;
        dozen: number;
      };
    },
    public appliedPriceType?: AppliedPriceType,
  ) {}
}

export class Sale {
  constructor(
    public id: string,
    public date: Date,
    public status: SaleStatus,
    public details?: SaleDetail[],
    public stocksUpdated?: StocksUpdated[],
    public user?: UserData,
    public cartId?: string,
    public weekCode?: string,
    public saleCode?: string,
    public comment?: string,
  ) {}
}

export class CreateSaleDto {
  constructor(
    public date: Date,
    public status: SaleStatus,
    public details?: SaleDetail[],
    public stocksUpdated?: StocksUpdated[],
    //
    public cartId?: string,
    public user?: string | UserData,
  ) {}
}

// DTOs para Guest Sales
export class CreateGuestSaleDto {
  @ApiProperty({
    description: 'UUID de la sesión del carrito',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  cartId: string;

  @ApiProperty({
    description: 'Fecha de la venta',
    example: '2024-01-15T10:30:00.000Z'
  })
  date: Date;

  @ApiProperty({
    description: 'Datos de contacto del cliente',
    example: {
      name: 'Juan',
      lastname: 'Pérez',
      email: 'juan.perez@email.com',
      phone: '+1234567890',
      address: 'Calle Principal 123'
    }
  })
  customerData: {
    name: string;
    lastname: string;
    email: string;
    phone: string;
    address: string;
  };

  @ApiProperty({
    description: 'Comentario de la venta',
    example: 'Venta de prueba'
  })
  comment: string;

  constructor(
    cartId: string,
    date: Date,
    customerData: {
      name: string;
      lastname: string;
      email: string;
      phone: string;
      address: string;
    },
    comment: string,
  ) {
    this.cartId = cartId;
    this.date = date;
    this.customerData = customerData;
    this.comment = comment;
  }
}

export class GuestUserData {
  @ApiProperty({
    description: 'ID temporal del usuario invitado',
    example: 'guest_550e8400-e29b-41d4-a716-446655440000'
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del cliente',
    example: 'Juan'
  })
  name: string;

  @ApiProperty({
    description: 'Apellido del cliente',
    example: 'Pérez'
  })
  lastname: string;

  @ApiProperty({
    description: 'Email del cliente',
    example: 'juan.perez@email.com'
  })
  email: string;

  @ApiProperty({
    description: 'Teléfono del cliente',
    example: '+1234567890'
  })
  phone: string;

  @ApiProperty({
    description: 'Dirección del cliente',
    example: 'Calle Principal 123'
  })
  address: string;

  constructor(
    id: string,
    name: string,
    lastname: string,
    email: string,
    phone: string,
    address: string
  ) {
    this.id = id;
    this.name = name;
    this.lastname = lastname;
    this.email = email;
    this.phone = phone;
    this.address = address;
  }
}
