import { Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Category } from './category.entity';
import { User } from './user.entity';

export enum By {
  'variant' = 'variant',
}

export interface Attributes {
  brand: string;
}

export interface Image {
  url: string;
  alt_text: string;
}

export interface Prices {
  cost?: number;
  retail: number;
  reseller: number;
  wholesale?: number;
}

export interface Percentages {
  reseller: number;
  retail: number;
  wholesale?: number;
}

export interface WholesaleData {
  isWholesaler: boolean;
  predefinedQuantities: number[];
  packageType: 'simple' | 'complex';
}

export class WholesaleDataDTO {
  @IsBoolean()
  isWholesaler: boolean;

  @IsArray()
  @ArrayMinSize(1, { message: 'predefinedQuantities must have at least one quantity' })
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  predefinedQuantities: number[];

  @IsEnum(['simple', 'complex'])
  packageType: 'simple' | 'complex';
}

export class CreateProductDto {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public code: string,
    public categories: string[],
    public attributes: Attributes,
    public pictures: Image[],
    public prices: Prices,
    public percentages: Percentages,
    public sizeType: string,
    public sizes: string[],
    public colors: string[],
    public wholesaleData?: WholesaleData,
  ) {}
}

export class PricesDTO {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cost: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  retail: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  reseller: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  wholesale: number;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  code: string;

  @IsOptional()
  @IsArray()
  categories: string[];

  @IsOptional()
  @IsObject()
  attributes: Attributes;

  @IsOptional()
  @IsArray()
  pictures: Image[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PricesDTO)
  prices: PricesDTO;

  @IsOptional()
  @IsObject()
  percentages: Percentages;

  @IsOptional()
  @IsString()
  sizeType: string;

  @IsOptional()
  @IsArray()
  colors: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => WholesaleDataDTO)
  wholesaleData?: WholesaleDataDTO;
}

export class Product {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public code: string,
    public categories: string[] | Category[],
    public attributes: Attributes,
    public pictures: Image[],
    public prices: Prices,
    public percentages: Prices,
    public hasStock?: boolean,
    public categoriesFilter?: string[][],
    public stocks?: any,
    public quantity?: any,
    public sizeType?: string,
    public sizes?: string[],
    public colors?: string[],
    public createdAt?: Date,
    public wholesaleData?: WholesaleData,
  ) {}
}

export class ReqGetProductsDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit: number = 20;
}

export class ResGetProductsDto {
  products: Product[];
  total: number;
}

export class FilterProductsDto {
  //product
  @IsOptional()
  @IsString()
  q?: string;

  //product
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minRetailPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxRetailPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minResellerPrice?: number; // Nuevo filtro para el precio de revendedor

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxResellerPrice?: number; // Nuevo filtro para el precio de revendedor

  @IsOptional()
  @IsString({ each: true })
  categories?: string | string[];

  @IsOptional()
  @IsString()
  brand?: string;

  //variants
  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  size?: string;

  //stock
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minCostPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxCostPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxQuantity?: number;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  hasStock: boolean = false;

  // Parámetros para paginación
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isWholesaler: boolean = false;

  @IsOptional()
  @IsEnum(['simple', 'complex'])
  wholesalePackageType?: 'simple' | 'complex';
}

export class GetProductByIdQueryDto extends FilterProductsDto {
  @IsString()
  @IsOptional()
  @IsEnum(By)
  by: By;
}

export class FilterProductsByCodeOrNameDto {
  @IsString()
  q: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit: number = 20;
}

export class CalculatePricesDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  costPrice: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  percentageReseller: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  percentageRetail: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  percentageWholesale: number;
}

export class IncreasePrices {
  // as min should be an element
  @IsArray()
  @ArrayMinSize(1, { message: 'productsIds should have at least one element' })
  @IsString({ each: true })
  productsIds: [string];

  @IsNumber()
  @Type(() => Number)
  @Min(-200)
  percentageIncrease: number;

  user: User;
}
// automation and
