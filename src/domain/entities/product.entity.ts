import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Category } from './category.entity';

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
  ) {}
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
    public hasStock?: boolean,
    public categoriesFilter?: string[][],
    public stocks?: any,
    public quantity?: any,
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
}

export class GetProductByIdQueryDto extends FilterProductsDto {
  @IsString()
  @IsOptional()
  @IsEnum(By)
  by: By;
}
