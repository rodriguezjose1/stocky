// role.module.ts
import { Module } from '@nestjs/common';
import { RoleUseCases } from 'src/application/use-cases/role.use-cases';
import { RoleController } from 'src/interfaces/http/role.controller';
import { MongooseRoleRepositoryAdapter } from '../infrastructure/adapters/mongoose/mongoose-role-repository.adapter';

@Module({
  providers: [
    {
      provide: 'RoleRepositoryPort',
      useClass: MongooseRoleRepositoryAdapter,
    },
    RoleUseCases,
  ],
  controllers: [RoleController],
  exports: [RoleUseCases],
})
export class RoleModule {}
