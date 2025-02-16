// user.module.ts
import { Module } from '@nestjs/common';
import { UserUseCases } from '../application/use-cases/user.use-cases';
import { MongooseUserRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-user-repository.adapter';
import { UserController } from '../interfaces/http/user.controller';
import { EncrypterModule } from 'src/infrastructure/adapters/encrypter/encrypter.module';
import { ChangePasswordUseCases } from 'src/application/use-cases/change-password.use-cases';
import { RoleModule } from './role.module';

@Module({
  imports: [EncrypterModule, RoleModule],
  providers: [
    {
      provide: 'UserRepositoryPort',
      useClass: MongooseUserRepositoryAdapter,
    },
    UserUseCases,
    ChangePasswordUseCases,
  ],
  controllers: [UserController],
  exports: [UserUseCases, ChangePasswordUseCases],
})
export class UserModule {}
