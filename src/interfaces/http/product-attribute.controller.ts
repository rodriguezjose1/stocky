import { Controller, Get, Query } from '@nestjs/common';
import { GetProductAttributesQuery } from 'src/domain/entities/product-attribute.entity';
import { ProductAttributeUseCases } from '../../application/use-cases/product-attribute.use-cases';

@Controller('product-attributes')
export class ProductAttributeController {
  constructor(private readonly productAttributeService: ProductAttributeUseCases) {}

  @Get('')
  async getProductAttributes(@Query() query: GetProductAttributesQuery) {
    const productAttributes = await this.productAttributeService.getProductAttributes(query.type, query.subtype);

    return {
      productAttributes,
    };
  }
}
