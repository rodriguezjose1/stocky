import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AsyncEventsModule } from './async-events/async-events.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { LoggerMiddleware } from './infrastructure/logging/logger.middleware';
import { LoggerModule } from './infrastructure/logging/logger.module';
import { AttributeTypeModule } from './modules/attribute-type.module';
import { CategoryModule } from './modules/category.module';
import { LoginModule } from './modules/login.module';
import { ProductModule } from './modules/product.module';
import { PurchaseModule } from './modules/purchase.module';
import { RoleModule } from './modules/role.module';
import { SaleModule } from './modules/sale.module';
import { StockModule } from './modules/stock.module';
import { UploadImageModule } from './modules/upload-image.module';
import { UserModule } from './modules/user.module';
import { VariantModule } from './modules/variant.module';

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
    VariantModule,
    AttributeTypeModule,
    UploadImageModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
