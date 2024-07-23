import { Module } from '@nestjs/common';
import { PurchaseListener } from './listeners/purchase.listeners';
import { ProductListener } from './listeners/product.listeners';
import { StockModule } from 'src/stock.module';
import { PurchaseModule } from 'src/purchase.module';
import { ProductModule } from 'src/product.module';
import { SaleListener } from './listeners/sale.listeners';
import { SaleModule } from 'src/sale.module';

@Module({
  imports: [PurchaseModule, StockModule, ProductModule, SaleModule],
  providers: [PurchaseListener, ProductListener, SaleListener],
  exports: [PurchaseListener, ProductListener, SaleListener],
})
export class AsyncEventsModule {}
