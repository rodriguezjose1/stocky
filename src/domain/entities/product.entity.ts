import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Category } from './category.entity';

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
    public categories_filter?: string[][],
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
