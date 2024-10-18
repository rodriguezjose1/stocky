import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/modules/user.module';
import { BasicAuthStrategy } from './strategies/basic-auth.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { BasicAuthGuard } from './guards/basic-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      // TODO: Move to .env
      secretOrPrivateKey: 'secret',
      signOptions: { expiresIn: '1h' },
    }),
    UserModule,
  ],
  providers: [JwtStrategy, BasicAuthStrategy, JwtAuthGuard, BasicAuthGuard],
  exports: [JwtAuthGuard, BasicAuthGuard],
})
export class AuthModule {}
