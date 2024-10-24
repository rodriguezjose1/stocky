import { Controller, Get, Query } from '@nestjs/common';
import { GetProductAttributeSubtypesQuery } from 'src/domain/entities/product-attribute-subtype.entity';
import { ProductAttributeSubtypeUseCases } from '../../application/use-cases/product-attribute-subtype.use-cases';

@Controller('product-attribute-subtypes')
export class ProductAttributeSubtypeController {
  constructor(private readonly productAttributeSubtypeService: ProductAttributeSubtypeUseCases) {}

  @Get('')
  async getProductAttributeSubtype(@Query() query: GetProductAttributeSubtypesQuery) {
    const productAttributeSubtypes = await this.productAttributeSubtypeService.getProductAttributeSubtypes(query.type);

    return {
      productAttributeSubtypes,
    };
  }
}
