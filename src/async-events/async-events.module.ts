import { Module } from '@nestjs/common';
import { CartModule } from 'src/modules/cart.module';
import { NotificationModule } from 'src/modules/notification.module';
import { ProductModule } from 'src/modules/product.module';
import { PurchaseModule } from 'src/modules/purchase.module';
import { SaleModule } from 'src/modules/sale.module';
import { StockModule } from 'src/modules/stock.module';
import { ProductListener } from './listeners/product.listeners';
import { PurchaseListener } from './listeners/purchase.listeners';
import { SaleListener } from './listeners/sale.listeners';
import { StockListener } from './listeners/stock.listeners';
import { NotificationListener } from './listeners/notification.listeners';
import { MailModule } from 'src/infrastructure/adapters/email-service/mail.module';
import { ErrorNotificationService } from 'src/infrastructure/adapters/email-service/error-notification.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PurchaseModule, 
    StockModule, 
    ProductModule, 
    SaleModule, 
    CartModule, 
    NotificationModule, 
    MailModule,
    ConfigModule
  ],
  providers: [
    PurchaseListener, 
    ProductListener, 
    SaleListener, 
    StockListener, 
    NotificationListener,
    ErrorNotificationService
  ],
  exports: [PurchaseListener, ProductListener, SaleListener, StockListener, NotificationListener],
})
export class AsyncEventsModule {}
