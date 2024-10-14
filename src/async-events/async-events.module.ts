import { Module } from '@nestjs/common';
import { PurchaseListener } from './listeners/purchase.listeners';
import { ProductListener } from './listeners/product.listeners';
import { StockModule } from 'src/modules/stock.module';
import { PurchaseModule } from 'src/modules/purchase.module';
import { ProductModule } from 'src/modules/product.module';
import { SaleListener } from './listeners/sale.listeners';
import { SaleModule } from 'src/modules/sale.module';
import { StockListener } from './listeners/stock.listeners';

@Module({
  imports: [PurchaseModule, StockModule, ProductModule, SaleModule],
  providers: [PurchaseListener, ProductListener, SaleListener, StockListener],
  exports: [PurchaseListener, ProductListener, SaleListener, StockListener],
})
export class AsyncEventsModule {}
