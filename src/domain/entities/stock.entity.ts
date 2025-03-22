import { IsInt, IsOptional, Min } from 'class-validator';
import { Variant } from './variant.entity';
import { Type } from 'class-transformer';

export interface IncrementStockDto {
  quantity: number;
  userId: string;
}

export interface DecrementStockDto {
  quantity: number;
  userId: string;
}

export class Stock {
  constructor(
    public id: string,
    public product: any,
    public variant: any,
    public quantity: number,
    public costPrice: number,
    public date: Date,
    public userId?: string,
  ) {}
}

export class UpdateStockDto {
  constructor(
    public product: string,
    public variant: Variant,
    public quantity: number,
    public costPrice: number,
    public date: Date,
    public userId?: string,
  ) {}
}

export class ReqGetStocksDto {
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

export interface ResGetStocksDto {
  stocks: Stock[];
  total: number;
}
