import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class Product {
  constructor(
    public id: string,
    public name: string,
    public code: string,
    public description: string,
    public brand: string,
    public categories: string[],
    public quantity: number,
    public size: string,
    public costPrice: number,
    public publicPrice: number,
    public resellerPrice: number,
    public images: string[],
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
