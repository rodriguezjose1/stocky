import { Module } from '@nestjs/common';
import { LoginUseCases } from '../application/use-cases/login.use-cases';
import { LoginController } from '../interfaces/http/login.controller';
import { UserModule } from './user.module';
import { TokenGeneratorModule } from 'src/infrastructure/adapters/token-generator/token-generator.module';

@Module({
  imports: [UserModule, TokenGeneratorModule],
  providers: [LoginUseCases],
  controllers: [LoginController],
  exports: [LoginUseCases],
})
export class LoginModule {}
