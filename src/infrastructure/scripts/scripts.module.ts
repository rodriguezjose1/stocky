import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UpdateSalesVariantDataScript } from './update-sales-variant-data';
import { SaleSchema } from '../models/sale.model';
import { SaleModel } from '../models/sale.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SaleModel.name, schema: SaleSchema },
    ]),
  ],
  providers: [
    UpdateSalesVariantDataScript,
  ],
  exports: [
    UpdateSalesVariantDataScript,
  ],
})
export class ScriptsModule {} 