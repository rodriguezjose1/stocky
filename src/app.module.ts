import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './infrastructure/database/database.module';
import { LoggerMiddleware } from './infrastructure/logging/logger.middleware';
import { LoggerModule } from './infrastructure/logging/logger.module';
import { ProductModule } from './product.module';
import { PurchaseModule } from './purchase.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StockModule } from './stock.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRootAsync(),
    EventEmitterModule.forRoot(),
    LoggerModule,
    ProductModule,
    PurchaseModule,
    StockModule,
  ],
  providers: [AppService],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
