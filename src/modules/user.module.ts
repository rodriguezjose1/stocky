// user.module.ts
import { Module } from '@nestjs/common';
import { UserUseCases } from '../application/use-cases/user.use-cases';
import { MongooseUserRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-user-repository.adapter';
import { UserController } from '../interfaces/http/user.controller';
import { EncrypterModule } from 'src/infrastructure/adapters/encrypter/encrypter.module';

@Module({
  imports: [EncrypterModule],
  providers: [
    {
      provide: 'UserRepositoryPort',
      useClass: MongooseUserRepositoryAdapter,
    },
    UserUseCases,
  ],
  controllers: [UserController],
  exports: [UserUseCases],
})
export class UserModule {}
