import { IsIn, IsOptional, IsString } from 'class-validator';

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

export class PostProductAttributeDto {
  @IsString()
  @IsIn(['color', 'brand', 'size'], { message: 'Invalid attribute type' })
  type: string;

  @IsOptional()
  @IsString()
  subtype: string;

  @IsString()
  label: string;

  value?: string;
}
