import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AsyncEventsModule } from './async-events/async-events.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { LoggerMiddleware } from './infrastructure/logging/logger.middleware';
import { LoggerModule } from './infrastructure/logging/logger.module';
import { ProductModule } from './product.module';
import { PurchaseModule } from './purchase.module';
import { SaleModule } from './sale.module';
import { StockModule } from './stock.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRootAsync(),
    EventEmitterModule.forRoot(),
    LoggerModule,
    AsyncEventsModule,
    ProductModule,
    PurchaseModule,
    StockModule,
    SaleModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
