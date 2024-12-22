import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GetProductAttributesQuery, PostProductAttributeDto } from 'src/domain/entities/product-attribute.entity';
import { ProductAttributeUseCases } from '../../application/use-cases/product-attribute.use-cases';
import { ProductAttributeSubtypeUseCases } from 'src/application/use-cases/product-attribute-subtype.use-cases';
import { GetProductAttributeSubtypesQuery } from 'src/domain/entities/product-attribute-subtype.entity';

@Controller('product-attributes')
export class ProductAttributeController {
  constructor(
    private readonly productAttributeService: ProductAttributeUseCases,
    private readonly productAttributeSubtypeService: ProductAttributeSubtypeUseCases,
  ) {}

  @Get('')
  async getProductAttributes(@Query() query: GetProductAttributesQuery) {
    const productAttributes = await this.productAttributeService.getProductAttributes(query.type, query.subtype);

    return {
      productAttributes,
    };
  }

  @Get('subtypes')
  async getProductAttributeSubtype(@Query() query: GetProductAttributeSubtypesQuery) {
    const productAttributeSubtypes = await this.productAttributeSubtypeService.getProductAttributeSubtypes(query.type);

    return {
      productAttributeSubtypes,
    };
  }

  @Post('')
  async createProductAttribute(@Body() productAttribute: PostProductAttributeDto) {
    return this.productAttributeService.createProductAttribute(productAttribute);
  }
}
