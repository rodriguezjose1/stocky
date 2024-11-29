import { IsString } from 'class-validator';

export class ProductAttributeSubtype {
  id: string;
  type: string;
  value: string;
  label: string;
}

export class GetProductAttributeSubtypesQuery {
  @IsString()
  type: string;
}
