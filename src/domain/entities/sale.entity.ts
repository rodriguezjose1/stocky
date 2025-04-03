import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export enum SaleStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

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
  ) {}
}

export interface UserData {
  id: string;
  name: string;
  lastname: string;
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
}

export class StocksUpdated {
  constructor(
    public stock: string,
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
