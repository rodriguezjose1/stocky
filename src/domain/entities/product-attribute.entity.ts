import { IsOptional, IsString } from 'class-validator';

export class ProductAttribute {
  id: string;
  type: string;
  subtype: string;
  value: string;
  label: string;
}

export class GetProductAttributesQuery {
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  subtype?: string;
}
