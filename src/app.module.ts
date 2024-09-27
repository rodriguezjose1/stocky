import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AsyncEventsModule } from './async-events/async-events.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { LoggerMiddleware } from './infrastructure/logging/logger.middleware';
import { LoggerModule } from './infrastructure/logging/logger.module';
import { ProductModule } from './modules/product.module';
import { PurchaseModule } from './modules/purchase.module';
import { SaleModule } from './modules/sale.module';
import { StockModule } from './modules/stock.module';
import { UserModule } from './modules/user.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { LoginModule } from './modules/login.module';
import { RoleModule } from './modules/role.module';
import { CategoryModule } from './modules/category.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRootAsync(),
    EventEmitterModule.forRoot(),
    AuthModule,
    LoggerModule,
    AsyncEventsModule,
    ProductModule,
    PurchaseModule,
    StockModule,
    SaleModule,
    UserModule,
    LoginModule,
    RoleModule,
    CategoryModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
