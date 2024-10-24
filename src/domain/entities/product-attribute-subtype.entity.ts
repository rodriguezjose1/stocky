import { IsString } from 'class-validator';

export class ProductAttributeSubtype {
  id: string;
  type: string;
  value: string;
}

export class GetProductAttributeSubtypesQuery {
  @IsString()
  type: string;
}
